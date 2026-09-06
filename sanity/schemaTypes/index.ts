import {siteCopy} from './siteCopy'
import {siteNavigation} from './siteNavigation'
import {tag} from './tag'
import {portfolioPhoto} from './portfolioPhoto'
import {
  workCuratedVideoCollectionBlock,
  workCuratedVideoItem,
  workGalleryBlock,
  workGalleryImage,
  workTextBlock,
  workVideoBlock,
  workVideoCollectionBlock,
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
  workVideoCollectionBlock,
  workCuratedVideoItem,
  workCuratedVideoCollectionBlock,
  workTextBlock,
  workGalleryImage,
  workGalleryBlock,
  workWebEmbedBlock,
  workEntry,
  homePage,
]
