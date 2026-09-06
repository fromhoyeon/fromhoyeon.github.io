# Sanity content layer

이 디렉터리는 개인 웹사이트의 **외부 콘텐츠·asset 레이어**를 위한 Sanity schema source와 연결 기준을 보관한다.

## 경계

- 웹페이지 구현과 배포는 GitHub Pages가 담당한다.
- Sanity는 DB형 콘텐츠, 이미지, 메뉴와 관계 데이터를 저장하고 API로 전달한다.
- Sanity Studio를 웹사이트 frontend로 사용하지 않는다.
- 색상, palette, layout, interaction은 Sanity가 소유하지 않는다. 사이트 시각 token의 canonical source는 `assets/content/site.css`다.
- Sanity 콘텐츠가 도착하지 않았을 때 GitHub가 과거 내용을 fallback으로 복제하지 않는다. 해당 UI는 `OFFLINE` 상태를 표시한다.

현재 Studio:

`https://hoyeon-website-content.sanity.studio/`

현재 project/dataset:

- Project ID: `a707yvok`
- Dataset: `production`

## 현재 콘텐츠 모델

일반 공개 콘텐츠를 분야나 프로젝트 계층으로 미리 나누지 않고 **동등한 Portfolio Item**으로 관리한다.

- `workEntry` — Studio 표시명 `Portfolio Item`. 기존 document ID와 frontend/reference 호환성을 위해 기술적 `_type` 이름은 유지한다.
- `tag` — 재사용 가능한 독립 Tag document. 현재 category/year/tool/series 등의 hierarchy를 강제하지 않는다.
- `portfolioPhoto` — Studio 표시명 `Photograph`. 독립적으로 탐색 가능한 사진 pool이므로 별도 document로 유지한다.
- `homePage` — `featuredWorks` reference 배열로 홈페이지 표시 항목과 순서를 관리한다.
- `siteCopy` — Site brand, Intro, About, Footer 등 공통 문구와 제한된 presentation setting.
- `siteNavigation` — 상단 primary navigation.
- `workVideoBlock` — 단일 YouTube video block.
- `workCuratedVideoCollectionBlock` / `workCuratedVideoItem` — 기본 Video Collection. 각 영상의 YouTube URL, Title, Description을 Sanity에서 개별 관리한다.
- `workVideoCollectionBlock` — `Playlist Video Collection · backup`. YouTube playlist 기반 자동 collection block.
- `workTextBlock` — text block.
- `workGalleryBlock` / `workGalleryImage` — image gallery block.
- `workWebEmbedBlock` — interactive web embed block.

사용되지 않는 과거 `contentEntry`는 active schema source에서 제외했고 hosted Studio에서도 legacy type으로 숨겼다.

## Portfolio Item

Portfolio Item은 음악, 공연, 영상, 미디어아트, 웹 작업 등의 분야를 document type으로 분리하지 않는다.

주요 필드:

- `internalTitle` — Studio 관리용 명칭
- `title` — 공개 제목. `text` 타입, 2-row 입력 UI
- `slug`
- `enabled`
- `period` — 제목 옆 시간/기간 정보. `2025`, `2022~2024`, `Ongoing` 등의 자유 형식 string
- `summary`
- `tags` — `tag` document weak reference 배열
- `contentBlocks` — 미디어·텍스트 block의 순서형 배열
- `externalUrl` / `actionLabel`

2026-09-06 기존 `yearLabel` 값은 `period`로 이관했고 `yearLabel`과 `metaLines`는 production document와 active schema에서 제거했다.

새 항목은 분야를 먼저 고르는 대신 필요한 `contentBlocks`를 조합하고 Tag를 붙인다.

### Flat Tag

현재 Tag는 `label`과 `slug`만 가진다.

`2026`, `TouchDesigner`, 작품명, 행사명, 장소명 등의 값 사이에 schema 차원의 우선순위나 그룹을 두지 않는다. 실제 콘텐츠가 충분히 쌓여 사용 패턴이 확인된 뒤에만 grouping이나 hierarchy를 추가한다.

Portfolio Item과 Photograph의 Tag reference는 현재 `weak: true`다. target Tag가 삭제된 뒤 unresolved reference가 남을 수 있으므로 frontend에서는 dereference 결과가 없는 값을 실제 Tag로 취급하지 않는다.

### Content blocks

`workEntry.contentBlocks`가 존재하면 compatibility용 단일 media field보다 우선한다. 배열 순서가 실제 페이지 표시 순서다.

현재 지원 block:

- `YouTube Video`
- `Video Collection`
- `Playlist Video Collection · backup`
- `Text`
- `Image Gallery`
- `Web Embed`

기본 `Video Collection`은 `videos[]` 배열을 사용한다. 각 item의 최소 필드는 `YouTube URL`, `Title`, `Description`이며 Sanity 배열 순서가 기본 표시 순서다. 첫 item이 초기 선택 영상이다. 향후 year, credit, role 등이 실제로 필요할 때 item field를 추가한다.

표시 영역의 높이, description 내부 scroll/fade, thumbnail tray, mobile 이동 속도와 browser-only Shuffle은 frontend 책임이다. Shuffle은 Content Lake의 배열 순서를 변경하지 않는다.

기존 playlist 자동 추출 구현은 `Playlist Video Collection · backup`으로 유지한다. 이 block만 `playlistUrl` 하나를 source로 사용한다.

기존 Portfolio Item 가운데 아직 이관되지 않은 항목을 위해 `mediaType`, `youtubeUrl`, `embedUrl`, `photoCount`는 compatibility field로 잠시 유지한다.

## Photography

`portfolioPhoto` document는 다음을 관리한다.

- image
- internal title
- alt text
- public pool 포함 여부
- selected / featured 여부
- `tag` document weak references

과거 `series`, `year`, 자유입력 string tags는 실제 production 사진에 값이 없었으므로 active schema에서 제거했다. 분류가 필요하면 일반 Portfolio Item과 동일한 Tag documents를 사용한다.

2026-09-06 기준 production에는 enabled/published Photograph 98장이 있다. frontend의 Selected Photography는 이 전체 metadata pool을 한 번 무작위로 섞은 **하나의 deck**으로 만들고 12장씩 표시한다. 같은 deck 안에서는 사진을 반복하지 않으며, `Shuffle order`를 누르면 전체 순서를 다시 섞고 첫 batch로 돌아간다.

thumbnail/enlarged image의 실제 loading, preload, mobile zoom/pan 등 표시 동작은 GitHub frontend가 담당하며 Sanity schema 책임이 아니다.

## 비공개 Photo Metadata

`metadataSchemaTypes/portfolioPhotoMetadata.ts`는 private `photo-metadata` dataset용 repository source다.

이 schema는 public `production` dataset의 active `schemaTypes/index.ts`에 export하지 않는다. EXIF/IPTC/XMP, camera/lens serial, GPS와 같은 archival metadata를 public Photograph document에 노출하지 않기 위한 분리다.

## 홈페이지 작업과 순서

`homePage` document의 `featuredWorks` 배열이 홈페이지 노출 Portfolio Item과 순서를 결정한다. Studio에서 reference 배열을 재정렬하면 GitHub 코드를 수정하지 않아도 다음 data load부터 반영된다.

`featuredWorks` 역시 `weak: true`이며 target이 사라진 unresolved reference는 frontend에서 유효한 work로 해석하지 않는다.

## frontend 연결

- `assets/content/sanity-config.js` — public Sanity 연결 설정
- `assets/content/sanity-runtime.js` — query, image URL과 module loading
- `assets/content/sanity-site-bridge.js` — Sanity document를 실제 `index.html` 구조에 연결
- `assets/content/video-collection.js` — curated Video Collection의 selected player, info panel, scrollable tray와 Shuffle
- `assets/content/playlist-video-collection.js` — 보존용 YouTube playlist 자동 collection renderer
- `assets/content/portfolio-ui-overrides.js` — poster-first YouTube와 gallery lightbox behavior
- `assets/content/sanity-gallery-layout.js` — Image Gallery ratio-preserving layout

현재 published Content Lake를 직접 확인하기 위해 `useCdn: false`를 사용한다.

primary navigation은 `_id == "primary-navigation"`인 `siteNavigation` singleton의 `items` 배열을 읽는다.

YouTube Video block은 **poster-first** 방식이다. 재생 전에는 iframe을 만들지 않고 thumbnail + play button만 표시하며, 실제 사용자 interaction 뒤에만 native YouTube player를 생성한다.

Video Collection block은 YouTube IFrame API의 playlist 정보를 이용해 playlist 전체의 video ID를 브라우저에서 가져온다. 따라서 Sanity에는 playlist URL 하나만 유지하고, 실제 thumbnail 목록과 현재 선택 상태는 frontend runtime이 만든다.

## schema 관리

`schemaTypes/`는 public production 데이터 구조를 추적하는 repository source다. 실제 hosted Studio/schema도 같은 content model을 유지해야 한다.

schema 변경 시 repository source와 hosted Studio 사이에 서로 다른 상태가 생기지 않도록 함께 갱신한다.

## 원칙

- 일반 공개 콘텐츠 → 동등한 Portfolio Item
- 제목 옆 시간 정보 → 자유 형식 `Period`
- 콘텐츠 관계와 조회 → flat Tag weak references
- 사진 pool → 별도 Photograph documents
- 비공개 archival metadata → 별도 private dataset/schema
- 홈페이지 큐레이션과 순서 → `homePage.featuredWorks`
- 여러 YouTube 영상 묶음 → `Video Collection` + playlist URL
- 자주 바뀌는 콘텐츠·메뉴 → Sanity
- 구조·palette·layout·interaction → GitHub
- remote 콘텐츠가 없거나 연결되지 않음 → stale local copy 대신 `OFFLINE`

Sanity는 교체 가능한 콘텐츠 레이어이며 웹사이트 자체의 canonical implementation은 GitHub에 남긴다.
