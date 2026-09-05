# Sanity content layer

이 디렉터리는 개인 웹사이트의 **외부 콘텐츠·asset 레이어**를 위한 Sanity schema 참고 파일과 연결 기준을 보관한다.

중요한 경계:

- 웹페이지 구현과 배포는 계속 GitHub Pages가 담당한다.
- Sanity Studio를 웹사이트 프론트엔드로 사용하지 않는다.
- Sanity는 DB형 콘텐츠, 이미지, 메뉴와 관계 데이터를 저장하고 API로 전달한다.
- Sanity에서 관리하는 콘텐츠가 도착하지 않았을 때 GitHub가 과거 내용을 흉내 내지 않는다. 해당 UI는 `OFFLINE` 상태를 표시한다.

## 현재 콘텐츠 모델

2026-09-05부터 포트폴리오의 일반 콘텐츠를 분야·프로젝트 계층으로 미리 나누지 않고 **동등한 Portfolio Item**으로 관리한다.

- `workEntry` — Studio 표시명 `Portfolio Item`. 기술적 `_type` 이름은 기존 문서 ID와 frontend/reference 호환성을 위해 유지한다.
- `tag` — 재사용 가능한 독립 Tag document. 현재 모든 tag는 의미상 동등하며 category, year, tool, series 등의 계층을 강제하지 않는다.
- `portfolioPhoto` — Studio 표시명 `Photograph`. 사진은 Portfolio Item의 구성요소이면서 독립적으로 탐색될 수 있는 유일한 특수 pool이라 별도 document로 유지한다.
- `homePage` — `featuredWorks` reference 배열로 홈페이지에 표시할 Portfolio Item과 순서를 관리한다.
- `siteCopy` — Site brand, Intro, About, Footer 등 사이트 공통 문구와 소수 presentation 설정.
- `siteNavigation` — 상단 primary navigation.
- `workVideoBlock` — Portfolio Item 내부 YouTube 영상 블록.
- `workTextBlock` — Portfolio Item 내부 텍스트 블록.
- `workGalleryBlock` / `workGalleryImage` — Portfolio Item 내부 이미지 갤러리와 개별 이미지.
- `workWebEmbedBlock` — Portfolio Item 내부 interactive web embed 블록.

과거의 `contentEntry`는 production document가 없으며 현재 active schema source에서 제외했다. hosted Studio에서도 legacy type으로 숨겨두었다.

실제 현재 Studio:

`https://hoyeon-website-content.sanity.studio/`

현재 project/dataset:

- Project ID: `a707yvok`
- Dataset: `production`

## Portfolio Item

Portfolio Item은 음악, 공연, 영상, 미디어아트, 웹 작업 등의 분야를 document type으로 구분하지 않는다.

기본 필드:

- `internalTitle` — Studio 관리용 명칭
- `title` — 공개 제목. 현재 `text` 타입이며 2-row 입력 UI를 사용해 필요하면 줄바꿈을 입력할 수 있다.
- `slug`
- `enabled`
- `yearLabel`
- `metaLines`
- `summary`
- `tags` — `tag` document weak reference 배열
- `contentBlocks` — 필요한 미디어 블록의 순서형 배열
- `externalUrl` / `actionLabel`

새 항목은 어떤 분야인지 먼저 선택하는 대신 필요한 `contentBlocks`를 조합하고 tag를 붙인다.

### Flat tags

현재 tag에는 `label`과 `slug`만 둔다.

모든 tag는 동일한 레벨이며 `2026`, `TouchDesigner`, 작품명, 행사명, 장소명 같은 값 사이에 schema 차원의 우선순위나 그룹을 두지 않는다. Portfolio Item 작성 시 기존 Tag document를 검색·재사용하고, 필요한 경우 새 Tag를 만든다.

콘텐츠가 충분히 쌓여 실제 사용 패턴이 드러난 뒤에만 tag grouping이나 hierarchy를 추가한다.

2026-09-05 기존 문자열 tag를 다음 독립 document로 이관했다.

- `TouchDesigner`
- `Archive`
- `Performance`
- `Batman`

`Batman`은 기존 테스트 데이터를 보존하기 위해 이관한 값이며 채택된 taxonomy를 의미하지 않는다.

현재 Portfolio Item과 Photograph의 Tag reference는 `weak: true`다. 따라서 Tag를 삭제해도 이를 가리키는 Portfolio Item이나 Photograph 때문에 삭제가 차단되지 않는다. 약한 reference는 target 삭제 뒤 source document 안에 unresolved reference object가 남을 수 있으므로 frontend에서는 dereference 결과가 없는 값을 실제 tag로 취급하지 않는 방향을 따른다.

### Content blocks

`workEntry.contentBlocks`가 존재하면 기존 단일 media slot보다 이 배열을 우선한다. 배열 순서가 실제 페이지 표시 순서다.

현재 지원 블록:

- `YouTube Video` — 한 항목 안에 여러 개 추가 가능
- `Text`
- `Image Gallery` — 원본 비율 유지, row 수와 desktop/mobile 최대 높이 지정 가능
- `Web Embed`

필요해지면 Audio 등 새로운 block type을 같은 레벨에 추가할 수 있다.

기존 Portfolio Item 가운데 아직 `contentBlocks`로 이관되지 않은 항목을 위해 `mediaType`, `youtubeUrl`, `embedUrl`, `photoCount`는 compatibility field로 잠시 유지한다. 새 일반 Portfolio Item에서는 Content blocks를 우선한다.

## Photography

사진은 현재 유일한 특수 케이스다.

`portfolioPhoto` document는 다음을 관리한다.

- image
- internal title
- alt text
- public pool 포함 여부
- selected / featured 여부
- `tag` document weak references

과거 `series`, `year`, 자유입력 string tags는 실제 production 사진에 값이 없었으므로 현재 active schema에서는 제거했다. 분류가 필요하면 일반 Portfolio Item과 동일한 Tag documents를 사용한다.

현재 production에는 enabled/published Photograph 98장이 있으며 Selected Photography가 이 pool에서 일부를 무작위로 선택한다.

## 홈페이지 작업과 순서

`homePage` document의 `featuredWorks` 배열이 홈페이지 노출 항목과 순서를 결정한다. Studio에서 reference 배열을 드래그해 순서를 변경하면 GitHub 코드를 수정하지 않아도 다음 페이지 로드부터 반영된다.

`featuredWorks` reference 역시 현재 `weak: true`다. 따라서 test Portfolio Item을 삭제할 때 Homepage reference 때문에 삭제가 막히지 않는다. target이 사라진 weak reference는 frontend에서 유효한 work로 해석하지 않는 방향을 따른다.

작업 데이터가 아직 도착하지 않은 초기 상태 또는 query 실패 상태에서는 과거 하드코딩 작업을 보여주지 않고 Work index에 `OFFLINE`을 표시한다.

## frontend 연결

`assets/content/sanity-config.js`의 public 설정을 사용한다. active prototyping 중에는 `useCdn: false`로 published Content Lake를 직접 읽는다.

`assets/content/sanity-runtime.js`는 Portfolio Item tag reference를 label 문자열로 resolve해 기존 frontend tag UI에 전달한다. Photograph 쪽은 label과 slug를 함께 가져와 향후 photography filtering에 사용할 수 있게 준비한다.

primary navigation은 `_id == "primary-navigation"`인 `siteNavigation` singleton의 `items` 배열을 읽는다.

YouTube Video block은 현재 **poster-first** 방식이다. 재생 전에는 YouTube iframe을 만들지 않고 thumbnail + play button만 표시하며, 실제 사용자 interaction 뒤에만 native YouTube player를 생성해 기본 seek/fullscreen controls를 사용한다. 과거 `youtube-custom-ui.js` 기반의 custom control bar는 안정성 문제 때문에 제거했다. media UI 보정은 `assets/content/portfolio-ui-overrides.js`에서 처리한다.

## schema 관리

`schemaTypes/`는 repository 안에서 현재 데이터 구조를 추적하는 source다. 실제 hosted Studio/schema도 Sanity managed workspace에 배포되어 있으므로 schema 변경 시 두 상태를 함께 갱신한다.

2026-09-05 flat Portfolio Item / Tag / Photograph 구조를 repository source와 hosted Studio 양쪽에 반영했다. 같은 날 Tag와 Homepage reference를 weak reference로 변경하고 기존 production reference objects에도 `_weak: true`를 적용했다. Portfolio Item `Public title`은 multiline 입력을 위해 `text` 타입으로 변경했다.

## 원칙

- 일반 공개 콘텐츠 → 동등한 Portfolio Item
- 콘텐츠 사이 관계와 조회 → flat Tag weak references
- 사진 pool → 별도 Photograph documents
- 홈페이지 큐레이션과 순서 → `homePage.featuredWorks` weak references
- 자주 바뀌는 콘텐츠·메뉴 → Sanity
- 구조·레이아웃·인터랙션 → GitHub
- remote 콘텐츠가 없거나 연결되지 않음 → stale local copy 대신 `OFFLINE`

Sanity는 교체 가능한 콘텐츠 레이어이며 웹사이트 자체의 canonical implementation은 GitHub에 남긴다.
