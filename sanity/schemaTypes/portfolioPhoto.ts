import {defineArrayMember, defineField, defineType} from 'sanity'

export const portfolioPhoto = defineType({
  name: 'portfolioPhoto',
  title: 'Photograph',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Internal title', type: 'string'}),
    defineField({
      name: 'image',
      title: 'Public image',
      description:
        'Public website asset. Add new portfolio photographs with scripts/import-portfolio-photos.ps1 so private metadata is archived separately and the uploaded image is sanitized first.',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'alt', title: 'Alt text', type: 'string'}),
    defineField({name: 'enabled', title: 'Include in public pool', type: 'boolean', initialValue: true}),
    defineField({name: 'featured', title: 'Selected / featured', type: 'boolean', initialValue: false}),
    defineField({
      name: 'tags',
      title: 'Tags',
      description: 'Uses the same flat Tag documents as Portfolio Items.',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'tag'}], weak: true})],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    select: {title: 'title', media: 'image'},
    prepare({title, media}) {
      return {
        title: title || 'Untitled photograph',
        media,
      }
    },
  },
})
