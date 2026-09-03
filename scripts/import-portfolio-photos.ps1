[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Folder,

    [string]$ProjectId = 'a707yvok',
    [string]$Dataset = 'production',
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

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("hoyeon-sanity-photo-import-" + [Guid]::NewGuid().ToString('N'))
[System.IO.Directory]::CreateDirectory($tempRoot) | Out-Null
$manifestPath = Join-Path $tempRoot 'portfolio-photos.ndjson'

$lines = New-Object 'System.Collections.Generic.List[string]'
$seenHashes = New-Object 'System.Collections.Generic.HashSet[string]'
$duplicateCount = 0

foreach ($file in $files) {
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()

    if (-not $seenHashes.Add($hash)) {
        $duplicateCount++
        Write-Host "Skipping duplicate file content: $($file.Name)" -ForegroundColor DarkYellow
        continue
    }

    # Stable content-based document ID makes re-running the importer safe with --missing.
    $documentId = 'portfolio-photo-' + $hash.Substring(0, 40)
    $fileUri = [System.Uri]::new($file.FullName).AbsoluteUri

    $document = [ordered]@{
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
        $document['series'] = $Series
    }
    if ($Year -gt 0) {
        $document['year'] = $Year
    }

    $lines.Add(($document | ConvertTo-Json -Compress -Depth 8))
}

if ($lines.Count -eq 0) {
    throw 'Nothing to import after duplicate filtering.'
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($manifestPath, $lines, $utf8NoBom)

Write-Host "Prepared documents: $($lines.Count)"
if ($duplicateCount -gt 0) {
    Write-Host "Skipped duplicate file contents: $duplicateCount"
}
Write-Host "Project: $ProjectId"
Write-Host "Dataset: $Dataset"
Write-Host "Manifest: $manifestPath"

if ($PreviewOnly) {
    Write-Host "`nPreview only. Nothing was uploaded." -ForegroundColor Yellow
    Write-Host "Manifest kept at: $manifestPath"
    exit 0
}

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw 'npx was not found. Install Node.js first, then run this script again.'
}

if (-not $Yes) {
    $answer = Read-Host "Import these $($lines.Count) Portfolio Photo documents and their images to Sanity? [y/N]"
    if ($answer -notmatch '^(y|yes)$') {
        Write-Host 'Cancelled. No Sanity import was started.' -ForegroundColor Yellow
        if (-not $KeepManifest) {
            Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "Manifest kept at: $manifestPath"
        }
        exit 0
    }
}

Write-Step 'Starting Sanity bulk import'
Write-Host 'If the Sanity CLI asks you to sign in, complete the browser login and return here.'

$npxArgs = @(
    '--yes',
    'sanity@latest',
    'datasets',
    'import',
    $manifestPath,
    '-p', $ProjectId,
    '-d', $Dataset,
    '--missing',
    '--asset-concurrency', [string]$AssetConcurrency
)

& npx @npxArgs
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Host "`nSanity import failed with exit code $exitCode." -ForegroundColor Red
    Write-Host "Manifest kept for retry: $manifestPath" -ForegroundColor Yellow
    exit $exitCode
}

Write-Host "`nImport complete: $($lines.Count) Portfolio Photo document(s)." -ForegroundColor Green
Write-Host 'The documents are imported as published documents, but the website still uses the local sample photo pool until portfolioPhotos is enabled in sanity-config.js.'

if ($KeepManifest) {
    Write-Host "Manifest kept at: $manifestPath"
} else {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
