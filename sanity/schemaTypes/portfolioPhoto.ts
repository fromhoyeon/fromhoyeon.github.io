import {defineField, defineType} from 'sanity'

export const portfolioPhoto = defineType({
  name: 'portfolioPhoto',
  title: 'Portfolio Photo',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: false}, validation: (Rule) => Rule.required()}),
    defineField({name: 'alt', title: 'Alt text', type: 'string'}),
    defineField({name: 'enabled', title: 'Include in public pool', type: 'boolean', initialValue: true}),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
    defineField({name: 'series', title: 'Series', type: 'string'}),
    defineField({name: 'year', title: 'Year', type: 'number'}),
    defineField({name: 'tags', title: 'Tags', type: 'array', of: [{type: 'string'}]}),
  ],
  preview: {
    select: {title: 'title', media: 'image', year: 'year', series: 'series'},
    prepare({title, media, year, series}) {
      return {
        title: title || 'Untitled photograph',
        subtitle: [year, series].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
