[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Folder,

    [string]$ProjectId = 'a707yvok',
    [string]$Dataset = 'production',
    [string]$MetadataDataset = 'photo-metadata',
    [string]$Series = '',
    [int]$Year = 0,
    [int]$AssetConcurrency = 4,
    [switch]$Recursive,
    [switch]$PreviewOnly,
    [switch]$KeepManifest,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Get-ImageFiles([string]$Path) {
    $extensions = @('.jpg', '.jpeg', '.png', '.webp')
    Get-ChildItem -LiteralPath $Path -File -Recurse:$Recursive |
        Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } |
        Sort-Object FullName
}

function Invoke-ExifToolJson([string[]]$Arguments) {
    $output = & exiftool @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "ExifTool failed with exit code $LASTEXITCODE."
    }
    $json = ($output -join "`n")
    if ([string]::IsNullOrWhiteSpace($json)) {
        return $null
    }
    $parsed = $json | ConvertFrom-Json
    return @($parsed)[0]
}

function Get-TagValue($Object, [string[]]$Names) {
    if ($null -eq $Object) { return $null }
    foreach ($name in $Names) {
        $property = $Object.PSObject.Properties[$name]
        if ($null -eq $property) { continue }
        $value = $property.Value
        if ($null -eq $value) { continue }
        if ($value -is [string] -and [string]::IsNullOrWhiteSpace($value)) { continue }
        return $value
    }
    return $null
}

function Convert-ToDouble($Value) {
    if ($null -eq $Value) { return $null }
    $number = 0.0
    if ([double]::TryParse(
        [string]$Value,
        [System.Globalization.NumberStyles]::Float,
        [System.Globalization.CultureInfo]::InvariantCulture,
        [ref]$number
    )) {
        return $number
    }
    return $null
}

function Convert-ToStringArray($Value) {
    if ($null -eq $Value) { return @() }
    if ($Value -is [string]) {
        if ([string]::IsNullOrWhiteSpace($Value)) { return @() }
        return @($Value.Trim())
    }
    if ($Value -is [System.Collections.IEnumerable]) {
        $items = @()
        foreach ($item in $Value) {
            if ($null -eq $item) { continue }
            $text = ([string]$item).Trim()
            if (-not [string]::IsNullOrWhiteSpace($text)) { $items += $text }
        }
        return @($items | Select-Object -Unique)
    }
    return @(([string]$Value).Trim())
}

function Add-IfPresent($Dictionary, [string]$Key, $Value) {
    if ($null -eq $Value) { return }
    if ($Value -is [string] -and [string]::IsNullOrWhiteSpace($Value)) { return }
    if ($Value -is [System.Array] -and $Value.Count -eq 0) { return }
    $Dictionary[$Key] = $Value
}

function Get-PhotoMetadata([string]$Path) {
    $raw = Invoke-ExifToolJson @(
        '-j', '-G1', '-a', '-n',
        '-EXIF:all', '-XMP:all', '-IPTC:all', '-Composite:all',
        $Path
    )

    if ($null -ne $raw) {
        $raw.PSObject.Properties.Remove('SourceFile')
    }

    $common = Invoke-ExifToolJson @(
        '-j', '-n',
        '-DateTimeOriginal', '-Make', '-Model', '-SerialNumber', '-BodySerialNumber',
        '-LensMake', '-LensModel', '-LensSerialNumber',
        '-FocalLength', '-FocalLengthIn35mmFormat', '-FNumber', '-ExposureTime',
        '-ISO', '-ExposureCompensation', '-Rating',
        '-Title', '-ObjectName', '-Description', '-Caption-Abstract', '-ImageDescription',
        '-Creator', '-By-line', '-Artist',
        '-Copyright', '-CopyrightNotice', '-Rights', '-Credit', '-UsageTerms',
        '-Keywords', '-Subject',
        '-Location', '-Sublocation', '-City', '-State', '-Province-State',
        '-Country', '-Country-PrimaryLocationName',
        '-GPSLatitude', '-GPSLongitude', '-GPSAltitude',
        $Path
    )

    if ($null -ne $common) {
        $common.PSObject.Properties.Remove('SourceFile')
    }

    return [pscustomobject]@{
        Raw = $raw
        Common = $common
    }
}

function New-SanitizedPublicCopy([string]$SourcePath, [string]$DestinationPath) {
    # Remove embedded EXIF/IPTC/XMP and other metadata while preserving color-space data.
    # The uploaded Sanity asset is this sanitized copy, never the Lightroom export itself.
    & exiftool '-all=' '--icc_profile:all' '--jfif:all' '-tagsfromfile' '@' '-colorspacetags' '-o' $DestinationPath $SourcePath | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $DestinationPath)) {
        throw "Could not create sanitized public image: $SourcePath"
    }

    # Fail closed if common identifying/descriptive tags somehow survived sanitization.
    $check = Invoke-ExifToolJson @(
        '-j', '-n',
        '-GPS:all', '-SerialNumber', '-BodySerialNumber', '-LensSerialNumber',
        '-DateTimeOriginal', '-Make', '-Model', '-LensModel',
        '-Copyright', '-CopyrightNotice', '-Rights', '-Artist', '-Creator',
        '-Description', '-ImageDescription', '-Comment', '-Keywords', '-Subject',
        '-Location', '-Sublocation', '-City', '-State', '-Country',
        $DestinationPath
    )

    if ($null -ne $check) {
        $check.PSObject.Properties.Remove('SourceFile')
        $remaining = @($check.PSObject.Properties | Where-Object {
            $null -ne $_.Value -and
            -not ($_.Value -is [string] -and [string]::IsNullOrWhiteSpace($_.Value))
        })
        if ($remaining.Count -gt 0) {
            $names = ($remaining.Name -join ', ')
            throw "Public metadata sanitization verification failed for $SourcePath. Remaining tags: $names"
        }
    }
}

if (-not (Get-Command exiftool -ErrorAction SilentlyContinue)) {
    throw 'ExifTool was not found. Install ExifTool and make sure exiftool is available in PATH. The importer refuses to upload unsanitized portfolio images.'
}

try {
    $resolvedFolder = (Resolve-Path -LiteralPath $Folder).Path
} catch {
    throw "Folder not found: $Folder"
}

$files = @(Get-ImageFiles $resolvedFolder)
if ($files.Count -eq 0) {
    throw 'No supported images found. Supported extensions: .jpg, .jpeg, .png, .webp'
}

Write-Step "Preparing $($files.Count) image(s) from $resolvedFolder"
Write-Host "Public dataset: $Dataset"
Write-Host "Private metadata dataset: $MetadataDataset"

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("hoyeon-sanity-photo-import-" + [Guid]::NewGuid().ToString('N'))
$sanitizedRoot = Join-Path $tempRoot 'public-images'
[System.IO.Directory]::CreateDirectory($sanitizedRoot) | Out-Null
$publicManifestPath = Join-Path $tempRoot 'portfolio-photos-public.ndjson'
$metadataManifestPath = Join-Path $tempRoot 'portfolio-photos-metadata.ndjson'

$publicLines = New-Object 'System.Collections.Generic.List[string]'
$metadataLines = New-Object 'System.Collections.Generic.List[string]'
$seenHashes = New-Object 'System.Collections.Generic.HashSet[string]'
$duplicateCount = 0

foreach ($file in $files) {
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()

    if (-not $seenHashes.Add($hash)) {
        $duplicateCount++
        Write-Host "Skipping duplicate file content: $($file.Name)" -ForegroundColor DarkYellow
        continue
    }

    Write-Host "Processing: $($file.Name)"

    $documentId = 'portfolio-photo-' + $hash.Substring(0, 40)
    $metadataDocumentId = 'portfolio-photo-metadata-' + $hash.Substring(0, 40)
    $safeName = $hash.Substring(0, 12) + '-' + $file.Name
    $sanitizedPath = Join-Path $sanitizedRoot $safeName

    $metadata = Get-PhotoMetadata $file.FullName
    New-SanitizedPublicCopy $file.FullName $sanitizedPath

    $fileUri = [System.Uri]::new($sanitizedPath).AbsoluteUri
    $publicDocument = [ordered]@{
        _id = $documentId
        _type = 'portfolioPhoto'
        title = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        image = [ordered]@{
            _type = 'image'
            _sanityAsset = "image@$fileUri"
        }
        enabled = $true
        featured = $false
    }

    if (-not [string]::IsNullOrWhiteSpace($Series)) {
        $publicDocument['series'] = $Series
    }
    if ($Year -gt 0) {
        $publicDocument['year'] = $Year
    }

    $common = $metadata.Common
    $metadataDocument = [ordered]@{
        _id = $metadataDocumentId
        _type = 'portfolioPhotoMetadata'
        publicPhotoId = $documentId
        sourceHash = $hash
        originalFilename = $file.Name
        importedAt = [DateTime]::UtcNow.ToString('o')
    }

    Add-IfPresent $metadataDocument 'dateTimeOriginal' (Get-TagValue $common @('DateTimeOriginal'))
    Add-IfPresent $metadataDocument 'cameraMake' (Get-TagValue $common @('Make'))
    Add-IfPresent $metadataDocument 'cameraModel' (Get-TagValue $common @('Model'))
    Add-IfPresent $metadataDocument 'cameraSerialNumber' (Get-TagValue $common @('BodySerialNumber', 'SerialNumber'))
    Add-IfPresent $metadataDocument 'lensMake' (Get-TagValue $common @('LensMake'))
    Add-IfPresent $metadataDocument 'lensModel' (Get-TagValue $common @('LensModel'))
    Add-IfPresent $metadataDocument 'lensSerialNumber' (Get-TagValue $common @('LensSerialNumber'))
    Add-IfPresent $metadataDocument 'focalLength' (Convert-ToDouble (Get-TagValue $common @('FocalLength')))
    Add-IfPresent $metadataDocument 'focalLength35mm' (Convert-ToDouble (Get-TagValue $common @('FocalLengthIn35mmFormat')))
    Add-IfPresent $metadataDocument 'aperture' (Convert-ToDouble (Get-TagValue $common @('FNumber')))
    Add-IfPresent $metadataDocument 'exposureTime' (Convert-ToDouble (Get-TagValue $common @('ExposureTime')))
    Add-IfPresent $metadataDocument 'iso' (Convert-ToDouble (Get-TagValue $common @('ISO')))
    Add-IfPresent $metadataDocument 'exposureCompensation' (Convert-ToDouble (Get-TagValue $common @('ExposureCompensation')))
    Add-IfPresent $metadataDocument 'rating' (Convert-ToDouble (Get-TagValue $common @('Rating')))
    Add-IfPresent $metadataDocument 'title' (Get-TagValue $common @('Title', 'ObjectName'))
    Add-IfPresent $metadataDocument 'caption' (Get-TagValue $common @('Description', 'Caption-Abstract', 'ImageDescription'))

    $creators = @()
    $creators += Convert-ToStringArray (Get-TagValue $common @('Creator'))
    $creators += Convert-ToStringArray (Get-TagValue $common @('By-line'))
    $creators += Convert-ToStringArray (Get-TagValue $common @('Artist'))
    $creators = @($creators | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
    Add-IfPresent $metadataDocument 'creator' $creators

    Add-IfPresent $metadataDocument 'copyright' (Get-TagValue $common @('CopyrightNotice', 'Copyright', 'Rights'))
    Add-IfPresent $metadataDocument 'credit' (Get-TagValue $common @('Credit'))
    Add-IfPresent $metadataDocument 'usageTerms' (Get-TagValue $common @('UsageTerms'))

    $keywords = @()
    $keywords += Convert-ToStringArray (Get-TagValue $common @('Keywords'))
    $keywords += Convert-ToStringArray (Get-TagValue $common @('Subject'))
    $keywords = @($keywords | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
    Add-IfPresent $metadataDocument 'keywords' $keywords

    Add-IfPresent $metadataDocument 'locationName' (Get-TagValue $common @('Location', 'Sublocation'))
    Add-IfPresent $metadataDocument 'city' (Get-TagValue $common @('City'))
    Add-IfPresent $metadataDocument 'state' (Get-TagValue $common @('State', 'Province-State'))
    Add-IfPresent $metadataDocument 'country' (Get-TagValue $common @('Country', 'Country-PrimaryLocationName'))

    $lat = Convert-ToDouble (Get-TagValue $common @('GPSLatitude'))
    $lng = Convert-ToDouble (Get-TagValue $common @('GPSLongitude'))
    $alt = Convert-ToDouble (Get-TagValue $common @('GPSAltitude'))
    if ($null -ne $lat -and $null -ne $lng) {
        $gps = [ordered]@{_type = 'geopoint'; lat = $lat; lng = $lng}
        if ($null -ne $alt) { $gps['alt'] = $alt }
        $metadataDocument['gps'] = $gps
    }

    if ($null -ne $metadata.Raw) {
        $metadataDocument['rawMetadataJson'] = ($metadata.Raw | ConvertTo-Json -Compress -Depth 30)
    }

    $publicLines.Add(($publicDocument | ConvertTo-Json -Compress -Depth 12))
    $metadataLines.Add(($metadataDocument | ConvertTo-Json -Compress -Depth 30))
}

if ($publicLines.Count -eq 0) {
    throw 'Nothing to import after duplicate filtering.'
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($publicManifestPath, $publicLines, $utf8NoBom)
[System.IO.File]::WriteAllLines($metadataManifestPath, $metadataLines, $utf8NoBom)

Write-Host "Prepared public documents: $($publicLines.Count)"
Write-Host "Prepared private metadata documents: $($metadataLines.Count)"
if ($duplicateCount -gt 0) {
    Write-Host "Skipped duplicate file contents: $duplicateCount"
}
Write-Host "Public manifest: $publicManifestPath"
Write-Host "Private metadata manifest: $metadataManifestPath"
Write-Host 'Public image files are sanitized copies; Lightroom export files are never uploaded directly.' -ForegroundColor Green

if ($PreviewOnly) {
    Write-Host "`nPreview only. Nothing was uploaded." -ForegroundColor Yellow
    Write-Host "Temporary files kept at: $tempRoot"
    exit 0
}

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw 'npx was not found. Install Node.js first, then run this script again.'
}

if (-not $Yes) {
    $answer = Read-Host "Import $($publicLines.Count) sanitized public photo(s) to '$Dataset' and private metadata to '$MetadataDataset'? [y/N]"
    if ($answer -notmatch '^(y|yes)$') {
        Write-Host 'Cancelled. No Sanity import was started.' -ForegroundColor Yellow
        if (-not $KeepManifest) {
            Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "Temporary files kept at: $tempRoot"
        }
        exit 0
    }
}

Write-Step 'Importing private photo metadata'
Write-Host 'Private metadata documents are replaceable on re-import; no image asset is stored in this dataset.'

$metadataArgs = @(
    '--yes',
    'sanity@latest',
    'datasets',
    'import',
    $metadataManifestPath,
    '-p', $ProjectId,
    '-d', $MetadataDataset,
    '--replace'
)

& npx @metadataArgs
$metadataExitCode = $LASTEXITCODE
if ($metadataExitCode -ne 0) {
    Write-Host "`nPrivate metadata import failed with exit code $metadataExitCode." -ForegroundColor Red
    Write-Host "Temporary files kept for retry: $tempRoot" -ForegroundColor Yellow
    exit $metadataExitCode
}

Write-Step 'Importing sanitized public portfolio images'
Write-Host 'If the Sanity CLI asks you to sign in, complete the browser login and return here.'

$publicArgs = @(
    '--yes',
    'sanity@latest',
    'datasets',
    'import',
    $publicManifestPath,
    '-p', $ProjectId,
    '-d', $Dataset,
    '--missing',
    '--asset-concurrency', [string]$AssetConcurrency
)

& npx @publicArgs
$publicExitCode = $LASTEXITCODE
if ($publicExitCode -ne 0) {
    Write-Host "`nPublic Sanity import failed with exit code $publicExitCode." -ForegroundColor Red
    Write-Host 'Private metadata was imported successfully, but the public photo import did not complete.' -ForegroundColor Yellow
    Write-Host "Temporary files kept for retry: $tempRoot" -ForegroundColor Yellow
    exit $publicExitCode
}

Write-Host "`nImport complete: $($publicLines.Count) sanitized Photograph document(s) + private metadata." -ForegroundColor Green
Write-Host "Private metadata Studio: https://hoyeon-photo-metadata.sanity.studio/"

if ($KeepManifest) {
    Write-Host "Temporary files kept at: $tempRoot"
} else {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
