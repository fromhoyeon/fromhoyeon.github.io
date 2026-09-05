import {defineArrayMember, defineField, defineType} from 'sanity'

const legacyReason = 'Compatibility-only field for existing entries. New Portfolio Items should use Content blocks.'

export const workEntry = defineType({
  name: 'workEntry',
  title: 'Portfolio Item',
  type: 'document',
  fields: [
    defineField({
      name: 'internalTitle',
      title: 'Internal title',
      description: 'Optional Studio-only name. The public title is separate.',
      type: 'string',
    }),
    defineField({name: 'title', title: 'Public title', type: 'text', rows: 2, validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'enabled', title: 'Public', type: 'boolean', initialValue: true}),
    defineField({name: 'yearLabel', title: 'Date / year label', type: 'string'}),
    defineField({
      name: 'metaLines',
      title: 'Secondary meta lines',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({name: 'summary', title: 'Description', type: 'text', rows: 6}),
    defineField({
      name: 'tags',
      title: 'Tags',
      description: 'All tags are equal at this stage. Reuse existing Tag documents whenever possible.',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'tag'}], weak: true})],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'contentBlocks',
      title: 'Content blocks',
      description: 'Add any supported media blocks in the order they should appear.',
      type: 'array',
      of: [
        defineArrayMember({type: 'workVideoBlock'}),
        defineArrayMember({type: 'workTextBlock'}),
        defineArrayMember({type: 'workGalleryBlock'}),
        defineArrayMember({type: 'workWebEmbedBlock'}),
      ],
    }),
    defineField({
      name: 'mediaType',
      title: 'Legacy media type',
      type: 'string',
      deprecated: {reason: legacyReason},
      hidden: ({value}) => value === undefined,
      options: {
        list: [
          {title: 'YouTube', value: 'youtube'},
          {title: 'Photography collection', value: 'photoCollection'},
          {title: 'Interactive web embed', value: 'webEmbed'},
          {title: 'No media', value: 'none'},
        ],
      },
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'Legacy YouTube URL',
      type: 'url',
      deprecated: {reason: legacyReason},
      hidden: ({value}) => value === undefined,
    }),
    defineField({
      name: 'embedUrl',
      title: 'Legacy Embed URL',
      type: 'url',
      deprecated: {reason: legacyReason},
      hidden: ({value}) => value === undefined,
    }),
    defineField({name: 'externalUrl', title: 'External / project URL', type: 'url'}),
    defineField({name: 'actionLabel', title: 'Action label', type: 'string'}),
    defineField({
      name: 'photoCount',
      title: 'Legacy photography selection count',
      type: 'number',
      deprecated: {reason: 'Compatibility-only field for the current Selected Photography special case.'},
      hidden: ({value}) => value === undefined,
    }),
  ],
  preview: {
    select: {internalTitle: 'internalTitle', title: 'title', subtitle: 'yearLabel'},
    prepare({internalTitle, title, subtitle}) {
      return {
        title: internalTitle || title || 'Untitled item',
        subtitle,
      }
    },
  },
})
