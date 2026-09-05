import {siteCopy} from './siteCopy'
import {siteNavigation} from './siteNavigation'
import {tag} from './tag'
import {portfolioPhoto} from './portfolioPhoto'
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
  siteNavigation,
  tag,
  portfolioPhoto,
  workVideoBlock,
  workTextBlock,
  workGalleryImage,
  workGalleryBlock,
  workWebEmbedBlock,
  workEntry,
  homePage,
]
