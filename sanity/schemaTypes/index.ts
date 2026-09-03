import {siteCopy} from './siteCopy'
import {portfolioPhoto} from './portfolioPhoto'
import {contentEntry} from './contentEntry'
import {
  workGalleryBlock,
  workGalleryImage,
  workTextBlock,
  workVideoBlock,
  workWebEmbedBlock,
} from './workContentBlocks'
import {workEntry} from './workEntry'
import {homePage} from './homePage'

export const schemaTypes = [
  siteCopy,
  portfolioPhoto,
  contentEntry,
  workVideoBlock,
  workTextBlock,
  workGalleryImage,
  workGalleryBlock,
  workWebEmbedBlock,
  workEntry,
  homePage,
]