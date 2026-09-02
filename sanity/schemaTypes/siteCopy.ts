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
      name: 'intro', title: 'Intro', type: 'object', fields: [
        textField('title', 'Title', 2),
        textField('body', 'Body', 4),
        textField('meta', 'Meta', 2),
      ],
    }),
    defineField({
      name: 'dual', title: 'Dual Conversation', type: 'object', fields: [
        textField('title', 'Title', 1),
        textField('description', 'Description', 5),
        textField('action', 'Action label', 1),
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
  ],
  preview: {
    prepare: () => ({title: 'Website text'}),
  },
})
