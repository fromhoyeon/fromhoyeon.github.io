import {defineArrayMember, defineField, defineType} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Internal title', type: 'string'}),
    defineField({
      name: 'featuredWorks',
      title: 'Portfolio items / homepage order',
      description: 'Choose which Portfolio Items appear on the homepage and drag them into display order.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'workEntry'}],
          weak: true,
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
