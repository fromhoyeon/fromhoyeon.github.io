import {defineField, defineType} from 'sanity'

const textField = (name: string, title: string, rows = 2) => defineField({
  name,
  title,
  type: rows > 1 ? 'text' : 'string',
  ...(rows > 1 ? {rows} : {}),
})

export const siteCopy = defineType({
  name: 'siteCopy',
  title: 'Site Copy',
  type: 'document',
  fields: [
    defineField({
      name: 'site',
      title: 'Site',
      type: 'object',
      fields: [
        textField('brand', 'Brand', 1),
      ],
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'object',
      fields: [
        textField('title', 'Title', 2),
        textField('body', 'Body', 4),
      ],
    }),
    defineField({
      name: 'presentation',
      title: 'Presentation',
      type: 'object',
      fields: [
        defineField({
          name: 'lightboxPadding',
          title: 'Enlarged image outer margin (px)',
          description: 'Outer breathing room around enlarged photos on desktop. Mobile uses about 60% of this value.',
          type: 'number',
          initialValue: 24,
        }),
      ],
    }),
    defineField({
      name: 'about',
      title: 'About',
      type: 'object',
      fields: [
        textField('title', 'Title', 1),
        textField('practiceLabel', 'Practice label', 1),
        textField('practice', 'Practice', 6),
        textField('ruleLabel', 'Rule label', 1),
        textField('rule', 'Rule', 6),
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        textField('copyright', 'Copyright', 1),
        textField('status', 'Status', 1),
      ],
    }),
  ],
  preview: {
    select: {title: 'site.brand'},
  },
})
