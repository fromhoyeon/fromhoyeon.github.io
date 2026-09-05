import {defineArrayMember, defineField, defineType} from 'sanity'

export const portfolioPhoto = defineType({
  name: 'portfolioPhoto',
  title: 'Photograph',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Internal title', type: 'string'}),
    defineField({
      name: 'image',
      title: 'Image',
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
      of: [defineArrayMember({type: 'reference', to: [{type: 'tag'}]})],
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
