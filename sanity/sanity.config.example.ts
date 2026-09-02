import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Hoyeon Website Content',
  projectId: 'YOUR_PROJECT_ID',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {types: schemaTypes},
})
