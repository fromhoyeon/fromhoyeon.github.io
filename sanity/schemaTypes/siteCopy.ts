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
