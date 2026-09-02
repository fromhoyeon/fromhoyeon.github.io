import {defineField, defineType} from 'sanity'

export const contentEntry = defineType({
  name: 'contentEntry',
  title: 'Content Entry',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
    defineField({name: 'enabled', title: 'Public', type: 'boolean', initialValue: true}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 4}),
    defineField({name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}]}),
    defineField({
      name: 'images', title: 'Images', type: 'array', of: [{
        type: 'image',
        options: {hotspot: true},
        fields: [defineField({name: 'caption', title: 'Caption', type: 'string'})],
      }],
    }),
    defineField({
      name: 'files', title: 'Files / downloads', type: 'array', of: [{
        type: 'file',
        fields: [defineField({name: 'label', title: 'Label', type: 'string'})],
      }],
    }),
    defineField({name: 'tags', title: 'Tags', type: 'array', of: [{type: 'string'}]}),
  ],
  orderings: [{title: 'Newest first', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
})
