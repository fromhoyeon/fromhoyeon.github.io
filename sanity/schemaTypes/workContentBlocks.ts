import {defineArrayMember, defineField, defineType} from 'sanity'

export const workVideoBlock = defineType({
  name: 'workVideoBlock',
  title: 'YouTube Video',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Optional label', type: 'string'}),
    defineField({name: 'youtubeUrl', title: 'YouTube URL', type: 'url'}),
  ],
  preview: {select: {title: 'title', subtitle: 'youtubeUrl'}},
})

export const workTextBlock = defineType({
  name: 'workTextBlock',
  title: 'Text',
  type: 'object',
  fields: [defineField({name: 'text', title: 'Text', type: 'text', rows: 6})],
  preview: {select: {title: 'text'}},
})

export const workGalleryImage = defineType({
  name: 'workGalleryImage',
  title: 'Gallery Image',
  type: 'object',
  fields: [
    defineField({name: 'image', title: 'Sanity image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'externalUrl', title: 'External image URL', type: 'url'}),
    defineField({name: 'alt', title: 'Alt text', type: 'string'}),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
  preview: {select: {title: 'caption', subtitle: 'externalUrl', media: 'image'}},
})

export const workGalleryBlock = defineType({
  name: 'workGalleryBlock',
  title: 'Image Gallery',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Optional label', type: 'string'}),
    defineField({
      name: 'rowCount',
      title: 'Maximum rows',
      description: 'The browser may use fewer rows when that gives a calmer layout, but it will not exceed this number.',
      type: 'number',
      initialValue: 4,
      validation: (rule) => rule.integer().min(1).max(8),
    }),
    defineField({
      name: 'maxRowHeightDesktop',
      title: 'Maximum row height · desktop (px)',
      description: 'Hard cap for each gallery row on desktop. Sparse or portrait-heavy rows stay left-aligned instead of stretching past this height.',
      type: 'number',
      initialValue: 280,
      validation: (rule) => rule.integer().min(120).max(480),
    }),
    defineField({
      name: 'maxRowHeightMobile',
      title: 'Maximum row height · mobile (px)',
      description: 'Hard cap for each gallery row on mobile.',
      type: 'number',
      initialValue: 190,
      validation: (rule) => rule.integer().min(100).max(320),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [defineArrayMember({type: 'workGalleryImage'})],
    }),
  ],
  preview: {select: {title: 'title'}},
})

export const workWebEmbedBlock = defineType({
  name: 'workWebEmbedBlock',
  title: 'Web Embed',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Optional label', type: 'string'}),
    defineField({name: 'embedUrl', title: 'Embed URL', type: 'url'}),
    defineField({name: 'externalUrl', title: 'External URL', type: 'url'}),
  ],
  preview: {select: {title: 'title', subtitle: 'embedUrl'}},
})
