import {defineArrayMember, defineField, defineType} from 'sanity'

export const workEntry = defineType({
  name: 'workEntry',
  title: 'Work Entry',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'enabled', title: 'Public', type: 'boolean', initialValue: true}),
    defineField({name: 'yearLabel', title: 'Year / date label', type: 'string'}),
    defineField({
      name: 'metaLines',
      title: 'Meta lines',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({name: 'summary', title: 'Summary', type: 'text'}),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'contentBlocks',
      title: 'Content blocks',
      description: 'Add and drag blocks to control the content order inside this work.',
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
      description: 'Used by existing entries that do not yet use Content blocks.',
      type: 'string',
      options: {
        list: [
          {title: 'YouTube', value: 'youtube'},
          {title: 'Photography collection', value: 'photoCollection'},
          {title: 'Interactive web embed', value: 'webEmbed'},
          {title: 'No media', value: 'none'},
        ],
      },
    }),
    defineField({name: 'youtubeUrl', title: 'Legacy YouTube URL', type: 'url'}),
    defineField({name: 'embedUrl', title: 'Legacy Embed URL', type: 'url'}),
    defineField({name: 'externalUrl', title: 'External / project URL', type: 'url'}),
    defineField({name: 'actionLabel', title: 'Action label', type: 'string'}),
    defineField({name: 'photoCount', title: 'Photography selection count', type: 'number'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'yearLabel'},
  },
})