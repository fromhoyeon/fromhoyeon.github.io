# Sanity content layer

이 디렉터리는 개인 웹사이트의 **외부 콘텐츠·asset 레이어**를 위한 Sanity schema 참고 파일과 연결 기준을 보관한다.

중요한 경계:

- 웹페이지 구현과 배포는 계속 GitHub Pages가 담당한다.
- Sanity Studio를 웹사이트 프론트엔드로 사용하지 않는다.
- Sanity는 DB형 콘텐츠, 이미지, 파일, 메뉴 데이터를 저장하고 API로 전달한다.
- Sanity에서 관리하는 텍스트나 메뉴가 아직 도착하지 않았을 때 GitHub가 과거 내용을 흉내 내지 않는다. 해당 UI는 `OFFLINE` 상태를 표시한다.

## 현재 준비된 schema

- `siteCopy` — 사이트 공통 문구 중 Site brand, Intro, About, Footer와 소수의 presentation 설정
- `siteNavigation` — 상단 primary navigation. 항목 추가·삭제·순서 변경 가능
- `portfolioPhoto` — 사진 pool. 이미지, 공개 여부, featured, series, year, tags
- `contentEntry` — 일반 게시물·기록용
- `workEntry` — 홈페이지에 표시할 개별 작업. 제목, slug, 연도, meta, 설명, tags와 `contentBlocks`
- `workVideoBlock` — 작업 내부 YouTube 영상 블록
- `workTextBlock` — 작업 내부 텍스트 블록
- `workGalleryBlock` / `workGalleryImage` — 작업 내부 이미지 갤러리와 개별 이미지
- `workWebEmbedBlock` — 작업 내부 interactive web embed 블록
- `homePage` — 홈페이지 큐레이션 문서. `featuredWorks` reference 배열의 순서가 실제 홈페이지 작업 순서가 된다.

실제 현재 Studio:

`https://hoyeon-website-content.sanity.studio/`

현재 project/dataset:

- Project ID: `a707yvok`
- Dataset: `production`

## frontend 설정

`assets/content/sanity-config.js`의 public 설정을 사용한다. 현재 active prototyping 중에는 `useCdn: false`로 published Content Lake를 직접 읽어 순서·내용 수정이 즉시 보이게 한다.

이 파일에는 write token이나 비밀키를 넣지 않는다.

## 현재 프로토타입 동작

### Site Copy와 OFFLINE

`siteCopy`는 현재 **Site brand, Intro, About, Footer와 필요한 presentation 설정만** 관리한다.

작업 제목·설명·링크·Work index 정보는 `workEntry` / `homePage`가 소유하고, primary navigation은 `siteNavigation`이 소유한다. Shuffle, Close, Instagram/YouTube/GitHub 같은 고정 UI label은 GitHub frontend에 둔다. 과거 `siteCopy`에 중복으로 있던 work별 copy, index label, navigation label, external-link label, UI label은 2026-09-04 정리했다.

`assets/content/site-copy.js`는 Sanity에 남겨둔 editable copy만 바인딩한다. 바인딩된 텍스트가 아직 remote에서 오지 않았으면 `OFFLINE`을 표시한다.

### Primary Navigation

상단 메뉴는 `_id == "primary-navigation"`인 `siteNavigation` singleton의 `items` 배열을 읽는다.

각 item은 `label`과 `href`를 가지며 Studio에서 추가, 삭제, 드래그 재정렬할 수 있다. 2026-09-03 현재 published 메뉴는 `About → #about` 하나다.

과거 `siteCopy.site.navWork`, `navAbout`, `navLinks`는 중복 필드였으며 2026-09-04 schema와 published data에서 제거했다.

### 홈페이지 작업과 순서

홈페이지의 주요 작업은 각각 독립된 `workEntry` document다.

`homePage` document의 `featuredWorks` 배열이 홈페이지 노출 여부와 순서를 결정한다. Studio에서 reference 배열을 드래그해 순서를 변경하면 GitHub 코드를 수정하지 않아도 다음 페이지 로드부터 순서가 바뀐다.

작업 데이터가 아직 도착하지 않은 초기 상태 또는 query 실패 상태에서는 과거 하드코딩 작업을 보여주지 않고 Work index에 `OFFLINE`을 표시한다. 기존 HTML 섹션은 renderer reference로 남아 있지만 사용자용 콘텐츠 fallback 역할은 하지 않는다.

### 작업 내부 Content blocks

`workEntry.contentBlocks`가 존재하면 기존의 단일 media slot보다 이 배열을 우선한다. 배열의 순서가 실제 페이지 내부 표시 순서이며 Studio에서 블록을 드래그해 재배치할 수 있다.

현재 지원 블록:

- `YouTube Video` — 한 작업 안에 여러 개 추가 가능
- `Text` — 독립 텍스트 블록
- `Image Gallery` — 여러 이미지를 한 블록으로 표시. `Rows` 값으로 목표 행 수를 지정하며 프론트가 원본 비율을 유지한 채 행 분배와 공통 높이를 계산한다.
- `Web Embed` — browser work embed

`Exhibition Sample`은 block 구조 검증용 작업이며 영상 2개와 이미지 갤러리를 사용한다.

기존 작업에 `contentBlocks`가 없으면 기존 특수 renderer를 사용한다.

- `youtube` — YouTube poster/player
- `photoCollection` — Selected Photography justified grid와 lightbox
- `webEmbed` — DODREI on-demand iframe gate
- `none` — 미디어 없는 일반 작업

### YouTube custom UI

`assets/content/youtube-custom-ui.js`는 YouTube 기본 controls를 숨긴 상태에서 IFrame API로 재생을 제어하고, 사이트 자체의 최소 control bar를 추가한다.

현재 control은 다음만 제공한다.

- play / pause
- seek timeline
- current time / duration

control 색상은 `--bg`, `--fg`, `--line`, `--muted` CSS 변수를 사용하므로 사이트 팔레트 변경을 따라간다. YouTube가 iframe 내부에 자체적으로 표시하는 브랜드·오버레이 요소는 사이트 CSS가 직접 제어하지 않는다.

### 사진 pool

현재 `portfolioPhotos: false`로 두고 GitHub의 local sample pool을 사용한다. 향후 실제 asset 이관 시 Sanity `portfolioPhoto` pool을 활성화할 수 있다.

## schema 관리

`schemaTypes/`는 repository 안에서 현재 데이터 구조를 추적하기 위한 참고 source다. 실제 hosted Studio/schema는 Sanity managed workspace에도 배포되어 있으므로 schema 변경 시 두 상태를 함께 갱신한다.

## 향후 원칙

- 자주 바뀌는 콘텐츠·메뉴 → Sanity
- 구조·레이아웃·인터랙션 → GitHub
- remote 콘텐츠가 없거나 연결되지 않음 → stale local copy 대신 `OFFLINE`
- 반복적으로 쌓이는 게시물·사진 pool → 필요에 따라 Sanity collection

Sanity는 교체 가능한 콘텐츠 레이어이며 웹사이트 자체의 canonical implementation은 GitHub에 남긴다.
