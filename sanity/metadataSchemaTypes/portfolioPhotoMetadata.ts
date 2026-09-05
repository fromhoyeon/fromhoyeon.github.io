import {defineArrayMember, defineField, defineType} from 'sanity'

// Canonical repository source for the private `photo-metadata` dataset.
// This type is intentionally NOT exported from schemaTypes/index.ts because the
// public `production` dataset must not expose archival EXIF/IPTC/XMP metadata.
export const portfolioPhotoMetadata = defineType({
  name: 'portfolioPhotoMetadata',
  title: 'Photo Metadata',
  type: 'document',
  fields: [
    defineField({name: 'publicPhotoId', title: 'Public Photograph ID', type: 'string'}),
    defineField({name: 'sourceHash', title: 'Source SHA-256', type: 'string'}),
    defineField({name: 'originalFilename', title: 'Original filename', type: 'string'}),
    defineField({name: 'importedAt', title: 'Imported at', type: 'datetime'}),
    defineField({name: 'dateTimeOriginal', title: 'Capture date/time', type: 'string'}),
    defineField({name: 'cameraMake', title: 'Camera make', type: 'string'}),
    defineField({name: 'cameraModel', title: 'Camera model', type: 'string'}),
    defineField({name: 'cameraSerialNumber', title: 'Camera serial number', type: 'string'}),
    defineField({name: 'lensMake', title: 'Lens make', type: 'string'}),
    defineField({name: 'lensModel', title: 'Lens model', type: 'string'}),
    defineField({name: 'lensSerialNumber', title: 'Lens serial number', type: 'string'}),
    defineField({name: 'focalLength', title: 'Focal length (mm)', type: 'number'}),
    defineField({name: 'focalLength35mm', title: '35mm-equivalent focal length', type: 'number'}),
    defineField({name: 'aperture', title: 'F-number', type: 'number'}),
    defineField({name: 'exposureTime', title: 'Exposure time (seconds)', type: 'number'}),
    defineField({name: 'iso', title: 'ISO', type: 'number'}),
    defineField({name: 'exposureCompensation', title: 'Exposure compensation', type: 'number'}),
    defineField({name: 'rating', title: 'Lightroom/XMP rating', type: 'number'}),
    defineField({name: 'title', title: 'Embedded title', type: 'string'}),
    defineField({name: 'caption', title: 'Embedded caption / description', type: 'text'}),
    defineField({
      name: 'creator',
      title: 'Creator / by-line',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({name: 'copyright', title: 'Copyright / rights', type: 'string'}),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
    defineField({name: 'usageTerms', title: 'Usage terms', type: 'text'}),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({name: 'locationName', title: 'Location name', type: 'string'}),
    defineField({name: 'city', title: 'City', type: 'string'}),
    defineField({name: 'state', title: 'State / province', type: 'string'}),
    defineField({name: 'country', title: 'Country', type: 'string'}),
    defineField({name: 'gps', title: 'GPS (private)', type: 'geopoint'}),
    defineField({
      name: 'rawMetadataJson',
      title: 'Raw extracted metadata (JSON)',
      type: 'text',
      rows: 18,
    }),
  ],
  preview: {
    select: {title: 'originalFilename', subtitle: 'cameraModel'},
    prepare({title, subtitle}) {
      return {
        title: title || 'Photo metadata',
        subtitle: subtitle || 'No camera model',
      }
    },
  },
})
