import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteNavigation = defineType({
  name: 'siteNavigation',
  title: 'Primary Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
    }),
    defineField({
      name: 'items',
      title: 'Menu items',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'navigationItem',
          title: 'Menu item',
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string'}),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              description: 'Examples: #about, #work, https://example.com',
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'href'},
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
