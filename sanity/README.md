# Sanity content layer

이 디렉터리는 개인 웹사이트의 **외부 콘텐츠·asset 레이어**를 위한 Sanity schema 참고 파일과 연결 기준을 보관한다.

중요한 경계:

- 웹페이지 구현과 배포는 계속 GitHub Pages가 담당한다.
- Sanity Studio를 웹사이트 프론트엔드로 사용하지 않는다.
- Sanity는 DB형 콘텐츠, 이미지, 파일을 저장하고 API/CDN으로 전달하는 역할만 맡는다.
- Sanity가 비활성 또는 장애 상태여도 현재 GitHub의 local 콘텐츠로 사이트가 동작해야 한다.

## 현재 준비된 schema

- `siteCopy` — 사이트 전역 문구와 About, Links 등 자주 바뀌는 텍스트
- `portfolioPhoto` — 사진 pool. 이미지, 공개 여부, featured, series, year, tags
- `contentEntry` — 일반 게시물·기록용. 본문, 이미지 배열, 일반 파일/download 배열 포함
- `workEntry` — 홈페이지에 표시할 개별 작업. 제목, slug, 연도 표기, meta, 설명, tags와 함께 작업 내부의 `contentBlocks` 배열을 가질 수 있다.
- `workVideoBlock` — 작업 내부 YouTube 영상 블록
- `workTextBlock` — 작업 내부 텍스트 블록
- `workGalleryBlock` / `workGalleryImage` — 작업 내부 이미지 갤러리와 개별 이미지
- `workWebEmbedBlock` — 작업 내부 interactive web embed 블록
- `homePage` — 홈페이지 큐레이션 문서. `featuredWorks` reference 배열의 순서가 실제 홈페이지 작업 순서가 된다.

실제 현재 Studio는 다음 주소에서 관리한다.

`https://hoyeon-website-content.sanity.studio/`

현재 project/dataset:

- Project ID: `a707yvok`
- Dataset: `production`

## frontend 설정

`assets/content/sanity-config.js`의 public 설정을 사용한다.

```js
window.SANITY_CONFIG = {
  enabled: true,
  projectId: 'a707yvok',
  dataset: 'production',
  apiVersion: '2026-09-02',
  useCdn: true,
  features: {
    siteCopy: true,
    workEntries: true,
    portfolioPhotos: false
  }
};
```

이 파일에는 **write token이나 비밀키를 절대 넣지 않는다.**

## 현재 프로토타입 동작

### 사이트 전역 텍스트

`siteCopy` document가 있으면 해당 필드만 local `assets/content/site-copy.js` 위에 덮어쓴다.
비어 있는 필드는 GitHub의 local 값이 그대로 유지된다.

### 홈페이지 작업과 순서

홈페이지의 주요 작업은 각각 독립된 `workEntry` document다.
기존 이관 항목은 Dual Conversation, Photography, DODREI, Music이며 필요에 따라 새 작업을 추가할 수 있다.

`homePage` document의 `featuredWorks` 배열이 홈페이지 노출 여부와 순서를 결정한다.
Studio에서 reference 배열을 드래그해 순서를 변경하면 GitHub 코드를 수정하지 않아도 다음 페이지 로드부터 순서가 바뀐다.

현재 프로토타입은 기존 HTML 섹션을 fallback으로 그대로 남겨두고, Sanity 연결에 성공하면 해당 섹션의 제목·연도·meta·설명·tag·미디어 URL·순서를 remote `workEntry` 값으로 덮어쓴다.
Sanity query가 실패하거나 Homepage 문서가 비어 있으면 기존 하드코딩 화면이 그대로 표시된다.

### 작업 내부 Content blocks

`workEntry.contentBlocks`가 존재하면 기존의 단일 media slot보다 이 배열을 우선한다.
배열의 순서가 실제 페이지 내부 표시 순서이며 Studio에서 각 블록을 드래그해 재배치할 수 있다.

현재 지원 블록:

- `YouTube Video` — 한 작업 안에 여러 개 추가 가능
- `Text` — 설명 사이에 독립 텍스트 블록 추가 가능
- `Image Gallery` — 여러 이미지를 한 블록으로 표시. Sanity image asset 또는 외부 이미지 URL을 사용할 수 있다.
- `Web Embed` — DODREI와 같은 browser work를 작업 내부 원하는 위치에 삽입 가능

2026-09-03에 `Exhibition Sample`을 테스트 항목으로 추가했다. 현재 구성은 YouTube 영상 2개를 세로로 배치하고, 그 아래 기존 로컬 샘플 사진 4장을 2열 gallery로 표시한다. 모바일에서는 gallery가 1열로 바뀐다. 이 항목은 `homePage.featuredWorks` 맨 위에 배치되어 block 구조 검증용으로 사용한다.

기존 작업에 `contentBlocks`가 없으면 기존 특수 renderer를 그대로 사용한다.

- `youtube` — 현재 YouTube poster/player renderer
- `photoCollection` — 현재 Selected Photography justified grid와 lightbox
- `webEmbed` — 현재 DODREI on-demand iframe gate
- `none` — 미디어 없는 일반 작업

따라서 기존 네 작업을 즉시 새 구조로 마이그레이션하지 않아도 되며, block 구조를 개별 작업부터 점진적으로 적용할 수 있다.

### 사진 pool

`portfolioPhoto` document 중 다음 조건을 만족하는 사진을 remote pool로 사용할 수 있다.

- `enabled != false`
- image asset이 존재함

현재는 실제 사진 asset 이관 전이므로 `portfolioPhotos: false`로 두고 GitHub의 local sample pool을 사용한다.
활성화하면 `workEntry.photoCount`가 홈페이지 랜덤 선별 장수를 결정한다.

이미지 query에서 Sanity가 보유한 dimensions/aspect ratio metadata를 함께 받아오므로, 원본 파일을 먼저 다운로드하지 않고도 justified layout을 계산할 수 있다.

## schema 관리

이 디렉터리의 `schemaTypes/`는 repository 안에서 현재 데이터 구조를 추적하기 위한 참고 source다.
실제 현재 hosted Studio/schema는 Sanity의 managed workspace에도 배포되어 있으므로 schema 변경 시 두 상태가 어긋나지 않도록 함께 갱신한다.

## 향후 원칙

어떤 콘텐츠가 remote인지 static인지는 고정하지 않는다.

- 자주 바뀌는 콘텐츠 → Sanity
- 구조·레이아웃·인터랙션 → GitHub
- 내용이 확정된 remote 콘텐츠 → 필요 시 GitHub static으로 이동 가능
- 반복적으로 쌓이는 게시물·사진 pool → Sanity collection 유지 가능

Sanity는 교체 가능한 콘텐츠 레이어이며 웹사이트 자체의 canonical implementation은 GitHub에 남긴다.