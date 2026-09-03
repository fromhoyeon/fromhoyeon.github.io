import {defineArrayMember, defineField, defineType} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Internal title', type: 'string'}),
    defineField({
      name: 'featuredWorks',
      title: 'Featured works',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'workEntry'}],
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
