import {defineField, defineType} from 'sanity'

const textField = (name: string, title: string, rows = 2) => defineField({
  name,
  title,
  type: rows > 1 ? 'text' : 'string',
  ...(rows > 1 ? {rows} : {}),
})

const urlField = (name: string, title: string) => defineField({
  name,
  title,
  type: 'url',
  validation: (rule) => rule.uri({scheme: ['http', 'https']}),
})

export const siteCopy = defineType({
  name: 'siteCopy',
  title: 'Site Copy',
  type: 'document',
  fields: [
    defineField({
      name: 'site', title: 'Site / Navigation', type: 'object', fields: [
        textField('brand', 'Brand', 1),
        textField('navWork', 'Work label', 1),
        textField('navAbout', 'About label', 1),
        textField('navLinks', 'Links label', 1),
      ],
    }),
    defineField({
      name: 'intro', title: 'Intro', type: 'object', fields: [
        textField('title', 'Title', 2),
        textField('body', 'Body', 4),
        textField('meta', 'Meta', 2),
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
        defineField({
          name: 'photoRowGap',
          title: 'Photo row vertical gap (deprecated)',
          description: 'No longer used. Thumbnail spacing has returned to the site default.',
          type: 'number',
          deprecated: {reason: 'Use Enlarged image outer margin for the spacing that was actually intended.'},
          readOnly: true,
          hidden: ({value}) => value === undefined,
          initialValue: undefined,
        }),
      ],
    }),
    defineField({
      name: 'index', title: 'Work Index Labels', type: 'object', fields: [
        textField('dual', 'Dual Conversation', 1),
        textField('photo', 'Photography', 1),
        textField('dodrei', 'DODREI', 1),
        textField('moving', 'Moving Image', 1),
      ],
    }),
    defineField({
      name: 'dual', title: 'Dual Conversation', type: 'object', fields: [
        textField('title', 'Title', 1),
        textField('description', 'Description', 5),
        textField('action', 'Action label', 1),
        urlField('youtubeUrl', 'YouTube URL'),
      ],
    }),
    defineField({
      name: 'photo', title: 'Selected Photography', type: 'object', fields: [
        textField('title', 'Title', 1),
        textField('helper', 'Helper text', 2),
        textField('shuffle', 'Shuffle button', 1),
        textField('description', 'Description', 5),
        textField('action', 'Action label', 1),
      ],
    }),
    defineField({
      name: 'dodrei', title: 'DODREI', type: 'object', fields: [
        textField('title', 'Title', 1),
        textField('description', 'Description', 5),
        textField('action', 'Action label', 1),
      ],
    }),
    defineField({
      name: 'moving', title: 'Moving Image', type: 'object', fields: [
        textField('title', 'Title', 1),
        textField('description', 'Description', 5),
        textField('action', 'Action label', 1),
        urlField('youtubeUrl', 'YouTube URL'),
      ],
    }),
    defineField({
      name: 'about', title: 'About', type: 'object', fields: [
        textField('title', 'Title', 1),
        textField('practiceLabel', 'Practice label', 1),
        textField('practice', 'Practice', 6),
        textField('ruleLabel', 'Rule label', 1),
        textField('rule', 'Rule', 6),
      ],
    }),
    defineField({
      name: 'links', title: 'External Link Labels', type: 'object', fields: [
        textField('instagram', 'Instagram', 1),
        textField('youtube', 'YouTube', 1),
        textField('github', 'GitHub', 1),
      ],
    }),
    defineField({
      name: 'footer', title: 'Footer', type: 'object', fields: [
        textField('copyright', 'Copyright', 1),
        textField('status', 'Status', 1),
      ],
    }),
    defineField({
      name: 'ui', title: 'UI Labels', type: 'object', fields: [
        textField('close', 'Close', 1),
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Website text'}),
  },
})
