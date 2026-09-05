# Photography metadata pipeline

Portfolio photographs use a two-layer import path so editorial metadata can be retained without embedding it in the image files delivered by the public website.

## Current status

This pipeline is prepared now but is **not intended to be used for the current sample photo pool**.

The current Sanity photographs are temporary samples. The intended workflow is:

1. finish selecting and organizing the real portfolio photographs in Lightroom;
2. export the final web-bound photographs with the desired embedded metadata intact;
3. test this importer with a small number of files first;
4. verify both the private metadata record and the sanitized public image;
5. replace the current sample pool with the final photographs;
6. only after that, decide which metadata fields, if any, should be copied into public `production` for display in the enlarged-photo UI.

Do not treat the presence of the private metadata pipeline as a decision to display camera, lens, exposure, date, copyright, caption, GPS, or any other metadata publicly.

## Privacy boundary

### Public website dataset

- Sanity dataset: `production`
- ACL: public
- Stores the `portfolioPhoto` documents used by the website.
- Receives a sanitized copy of each Lightroom export, not the Lightroom export itself.
- The importer removes embedded EXIF/IPTC/XMP and other descriptive/identifying metadata before upload while preserving color-space information needed for faithful display.
- The frontend currently queries only the fields it needs and does not automatically expose archived photo metadata.

Because `production` is public, any data stored there should be treated as public even if the current UI does not render it.

### Private metadata dataset

- Sanity dataset: `photo-metadata`
- ACL: private
- Studio: `https://hoyeon-photo-metadata.sanity.studio/`
- Stores `portfolioPhotoMetadata` documents.
- Each metadata document is matched to its public `portfolioPhoto` through the source SHA-256-derived ID and `publicPhotoId` field.

The private record keeps commonly useful fields separately for convenient browsing and also stores a raw JSON snapshot of extracted EXIF/IPTC/XMP/Composite metadata.

Common fields include:

- original filename and source hash
- capture date/time
- camera make/model and body serial number
- lens make/model and lens serial number
- focal length and 35mm-equivalent focal length
- aperture, exposure time, ISO, exposure compensation
- Lightroom/XMP rating
- embedded title and caption/description
- creator/by-line
- copyright/rights, credit, usage terms
- keywords
- textual location fields
- GPS coordinates, when present

None of these private fields are published to the website automatically.

## Importer

Use:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\import-portfolio-photos.ps1" "D:\path\to\exported-photos"
```

The importer requires:

- Node.js / `npx`
- ExifTool available as `exiftool` in `PATH`

For each source image it:

1. computes a SHA-256 hash;
2. extracts EXIF/IPTC/XMP/Composite metadata with ExifTool;
3. creates the private `portfolioPhotoMetadata` record;
4. creates a temporary public copy with metadata removed;
5. verifies that common private/descriptive tags did not survive sanitization;
6. imports the metadata document into private `photo-metadata`;
7. uploads only the sanitized image copy and `portfolioPhoto` document to public `production`.

The original Lightroom export is never uploaded by this script.

If ExifTool is unavailable or sanitization verification fails, the script aborts before the public image import. This is intentional: the privacy boundary fails closed rather than silently uploading a metadata-bearing file.

## Re-import behavior

- Private metadata uses `--replace`, so re-importing the same source file refreshes the archived metadata record.
- Public photographs use `--missing`, preserving later Sanity-side curation such as tags, enabled state, and featured state for an already imported photograph.

## Future public metadata display

Camera, lens, exposure, date, caption, copyright, or other values should not be read directly from the private dataset by the static public frontend.

When a public display policy is decided, add explicit public fields to `portfolioPhoto` (or another public content type) and copy only the approved values from the private metadata record into `production`. This keeps publishing an intentional action rather than an accidental consequence of metadata ingestion.
