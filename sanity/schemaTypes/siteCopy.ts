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
        defineField({
          name: 'accentImage',
          title: 'Accent image',
          type: 'image',
          options: {hotspot: true},
        }),
        textField('accentImageAlt', 'Accent image alt text', 1),
        defineField({
          name: 'accentImageEnabled',
          title: 'Show accent image',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'accentImagePosition',
          title: 'Accent image position',
          type: 'string',
          initialValue: 'beforeTitle',
          options: {
            list: [
              {title: 'Before title', value: 'beforeTitle'},
              {title: 'Between title and description', value: 'afterTitle'},
              {title: 'After description', value: 'afterBody'},
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'accentImageWidth',
          title: 'Accent image width (px)',
          description: 'Base rendered width on the site. Choose a value from 32 to 320 px.',
          type: 'number',
          initialValue: 96,
          validation: (rule) => rule.integer().min(32).max(320),
        }),
        defineField({
          name: 'accentImageAlign',
          title: 'Accent image alignment',
          type: 'string',
          initialValue: 'center',
          options: {
            list: [
              {title: 'Left', value: 'left'},
              {title: 'Center', value: 'center'},
              {title: 'Right', value: 'right'},
            ],
            layout: 'radio',
          },
        }),
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
          validation: (rule) => rule.integer().min(8).max(64),
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
    prepare: () => ({title: 'Website text'}),
  },
})
