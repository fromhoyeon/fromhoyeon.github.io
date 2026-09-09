# fromhoyeon.github.io

Hoyeon의 개인 웹사이트이자 포트폴리오 저장소다.

## 목적과 범위

이 저장소는 `fromhoyeon.github.io`에 공개되는 개인 웹사이트의 **페이지 구조, 시각 시스템, 인터랙션, Sanity 연결과 배포 코드**를 소유한다.

음악, 사진, 영상, 미디어아트, 웹 작업을 처음부터 고정된 직업 카테고리로 영구 분리하지 않는다. 실제 작업과 사용 방식에 따라 Portfolio Item과 Tag를 조합하며, 개별 작품의 상세 구현은 가능한 경우 각 작품 repository가 소유한다.

개인적 기억, 공개되지 않은 작품의 기원, 그 밖의 비공개 맥락은 이 공개 저장소에 자동으로 기록하지 않는다.

## v1 현재 구조

2026-09-06 기준으로 초기 prototype 단계를 정리하고 **v1 운영 구조**로 전환했다.

- `index.html` — 실제 공개 사이트의 루트 문서. 더 이상 별도 `prototype-*` 페이지로 redirect하지 않는다.
- `assets/content/` — 현재 사이트의 CSS와 JavaScript runtime.
- `sanity/` — Sanity content model과 schema 참고 source. 자세한 기준은 `sanity/README.md`를 따른다.
- `scripts/` — 운영·import용 보조 스크립트. 현재 Photograph import 스크립트를 유지한다.

과거 font, embed, gallery, random-photo, multi-page portfolio 실험과 로컬 sample asset은 v1 public tree에서 제거했다. 필요한 과거 상태는 Git history에서 확인할 수 있으며 현재 운영 코드와 섞어 보관하지 않는다.

## 색상과 시각 시스템

`assets/content/site.css`가 **사이트 전체 색상과 핵심 시각 token의 canonical source**다.

테마 색은 palette 원본을 한 번만 정의하고, 실제 UI는 semantic token을 통해 참조한다.

```css
--palette-white-bg
--palette-white-fg
--palette-white-muted
--palette-white-line
--palette-white-panel

--palette-black-bg
--palette-black-fg
--palette-black-muted
--palette-black-line
--palette-black-panel
```

현재 값은 White 계열과 Black 계열 두 세트이며 기본 테마는 White다. 사용자가 Black을 선택하면 같은 브라우저의 `localStorage`에 선택을 보존한다.

페이지 배경, 글자, divider, panel, lightbox, photo-return overlay, Shuffle button, theme preview button 등 테마에 종속되는 UI는 위 palette에서 파생된 `--bg`, `--fg`, `--muted`, `--line`, `--panel` 등을 사용한다.

따라서 향후 White를 미세한 beige 계열로 바꾸거나 Black을 warm black으로 바꾸더라도 각 palette 원본만 수정하면 된다. JavaScript나 Sanity document에 테마 색을 중복 저장하지 않는다.

YouTube player 배경이나 embedded media처럼 **사이트 테마와 무관하게 절대적인 black/white가 필요한 요소**도 `site.css` 안의 별도 media token으로 명시한다. 테마 palette와 의도적으로 분리된 값이다.

## frontend module 책임

현재 `assets/content/`의 주요 파일:

- `site.css` — palette, semantic color token, spacing, layout, component styling과 responsive rules.
- `site-copy.js` — Sanity-bound 공통 copy/navigation bridge. remote 값이 없을 때 stale local copy 대신 `OFFLINE` 원칙을 유지한다.
- `sanity-config.js` — public Sanity 연결 설정.
- `sanity-runtime.js` — Sanity query, image URL 생성과 필요한 enhancement module loading.
- `sanity-site-bridge.js` — Homepage / Portfolio Item / About / Links 데이터를 실제 페이지 구조에 연결한다.
- `video-collection.js` — Sanity에서 개별 관리되는 Video Collection의 selected player, 4개 단위 thumbnail pagination, page-load randomization과 browser-only Shuffle을 담당한다.
- `playlist-video-collection.js` — YouTube playlist URL 하나로 전체 목록을 자동 구성하는 보존용 playlist renderer.
- `portfolio-ui-overrides.js` — Portfolio Item gallery lightbox의 동작만 보정한다. YouTube 렌더링에는 개입하지 않는다.
- `sanity-gallery-layout.js` — Portfolio Item Image Gallery의 ratio-preserving row 계산과 확대 보기.
- `photo-gallery-core.js` — Selected Photography의 기본 row layout, lightbox와 keyboard/touch navigation.
- `photo-pool-controls.js` — 전체 Photograph pool의 random deck, 12장 batch, page 상태, Shuffle과 session 복원.
- `photo-lightbox-interactions.js` — Selected Photography의 desktop close, mobile pinch/pan, thumbnail/enlarged loading state.
- `presentation-controls.js` — White/Black theme state, lightbox spacing과 desktop navigation behavior.

원칙은 **CSS는 시각 상태, JavaScript는 동작과 데이터 상태**를 담당하는 것이다. 런타임 JavaScript에서 테마별 색상 style을 동적으로 주입하지 않는다.

## Selected Photography

Sanity의 published/enabled `portfolioPhoto` 전체 pool을 하나의 random deck으로 만든다.

- 한 번 만든 deck 안에서는 사진을 반복하지 않는다.
- 현재 화면에는 12장씩 표시한다.
- 같은 브라우저에서는 deck 순서와 현재 batch를 2시간 복원한다.
- `Shuffle order`는 전체 deck을 다시 섞고 page 1로 돌아간다.
- 목록 아래에 `PAGE <현재 / 전체>`를 표시한다.
- 현재 batch의 마지막 enlarged 사진에 도달하면 다음 12장의 thumbnail을 preload하고, 다음 page 첫 enlarged 이미지 1장만 추가 preload한다.
- 일반 enlarged 이동에서는 현재 사진 기준 이전/다음 enlarged 이미지를 각각 1장씩 preload한다.
- thumbnail 또는 enlarged image가 느리게 로드되면 작은 `loading` 텍스트를 표시한다. 별도 서버 요청은 만들지 않는다.
- mobile enlarged view는 pinch zoom과 확대 후 자유로운 one-finger pan을 지원한다. 1x 상태에서는 horizontal swipe가 사진 이동이다.
- desktop enlarged view는 우측 상단 Close button을 제공한다.
- lightbox를 닫으면 방금 보던 thumbnail에 현재 theme background와 같은 100% opaque overlay가 0.1초 표시된 뒤 1초 동안 fade-out된다.

## Video Collection

기본 `Video Collection` content block은 영상마다 Sanity에서 `YouTube URL`, `Title`, `Description`을 개별 관리한다. Sanity 배열은 source order로만 보존한다. 페이지를 열 때는 `Jihye Lee Orchestra - We Are All From The Same Stream`을 첫 영상으로 고정하고 나머지 영상 순서만 browser에서 셔플한다.

- 선택된 영상은 재생 전 YouTube `hqdefault` thumbnail과 중앙 재생 버튼만 있는 start poster를 표시한다. 재생 버튼을 누르면 `youtube.com/embed/<videoId>?autoplay=1`로 교체하며, 그 뒤 controls, 자막과 기타 UI는 YouTube 기본 동작을 따른다. `autoplay=1` 이외의 player parameter는 붙이지 않는다.
- player 아래에서 선택 영상의 Title과 Description을 표시한다. Description은 현재 접거나 내부 scroll하지 않고 전체 길이를 표시한다.
- thumbnail은 한 page에 4개만 표시한다. desktop은 4열, mobile은 2열 × 2행이다. 각 thumbnail 하단에는 영상 Title을 한 줄로 표시하고 넘치는 글자는 ellipsis로 생략한다.
- thumbnail 아래의 `PAGE 현재 / 전체` 이전·다음 control로 목록 page를 이동한다.
- thumbnail 선택 시 mobile에서는 짧은 custom transition으로 player 위치로 빠르게 이동한다.
- 파란색 `Shuffle order`는 browser 안의 영상 순서와 선택 영상만 섞고 page 1로 돌아간다. Sanity 배열 순서는 수정하지 않는다.
- `Playlist Video Collection · backup`은 playlist URL 하나로 목록을 자동 생성하는 별도 보존 기능이다.

Portfolio Item에는 `Title description`과 기존 `Description`이 별도로 존재한다. `Title description`은 제목 바로 아래, 모든 content 이전에 표시되며 이 값이 있을 때만 제목 하단 divider가 나타난다. 기존 `Description`은 content 설명으로 기존 위치를 유지한다.

## Sanity 경계

GitHub Pages가 웹사이트 본체이고 Sanity는 교체 가능한 content/asset layer다.

Sanity가 관리하는 것:

- Portfolio Item
- Tag
- Photograph
- Homepage curation/order
- Site copy
- Primary navigation
- Portfolio Item content blocks

GitHub가 관리하는 것:

- HTML 구조
- CSS / theme / palette
- layout
- interaction
- media runtime
- Sanity adapter
- deployment

색상이나 디자인 token은 Sanity에서 관리하지 않는다. presentation setting 중 실제 content editor가 조절할 필요가 있는 값만 제한적으로 Sanity에 둘 수 있다.

## v1 cleanup checkpoint — 2026-09-06

이번 checkpoint에서 실제로 적용한 내용:

- 공개 root를 redirect용 `index.html`에서 실제 사이트 문서로 승격했다.
- main prototype의 inline CSS와 photo JavaScript를 각각 `site.css`, `photo-gallery-core.js`로 분리했다.
- theme palette를 `site.css` 한 곳의 canonical palette token으로 통합했다.
- photo deck, photo lightbox, presentation, portfolio media, Sanity runtime에서 중복 style injection과 theme color hardcoding을 제거했다.
- active Sanity bridge 이름을 `sanity-prototype-bridge.js`에서 `sanity-site-bridge.js`로 정리했다.
- 사용하지 않는 font/embed/gallery 테스트 페이지, 과거 random-photo prototype, 과거 multi-page `portfolio-v2`, prototype sample assets, 중복 legacy 문서를 public branch에서 제거했다.
- 현재 repository root를 `README.md`, `index.html`, `assets/`, `sanity/`, `scripts/` 중심으로 정리했다.

이 checkpoint는 사이트의 작품 분류나 최종 미학을 영구 확정한다는 뜻이 아니다. 현재 구현을 유지·확장하기 위한 **v1 기술 기준선**을 확정한 것이다.

## Video Collection checkpoint — 2026-09-10

이번 checkpoint에서는 Video Collection과 YouTube embed에 실제로 적용된 최신 상태만 기록한다.

- curated Videography의 상단 player는 재생 전 YouTube `hqdefault` thumbnail과 중앙 재생 버튼만 있는 start poster를 표시한다. 클릭 후에는 `youtube.com/embed/<videoId>?autoplay=1`로 전환하고 이후 UI는 YouTube 기본 동작을 따른다.
- `autoplay=1`을 제외하고 `controls`, `cc_load_policy`, `rel`, `playsinline`, `iv_load_policy` 등 별도 player parameter는 추가하지 않는다.
- 과거 player를 다시 쓰거나 변환하던 `portfolio-ui-overrides.js`의 YouTube 개입은 제거된 상태를 유지한다.
- `Jihye Lee Orchestra - We Are All From The Same Stream`의 Sanity `YouTube URL`은 `https://www.youtube.com/watch?v=VvSIj9rhanA`을 사용한다.
- page load 시 첫 영상 고정도 같은 ID `VvSIj9rhanA`을 기준으로 하며, 나머지 영상만 browser에서 셔플한다.
- thumbnail grid는 video ID의 YouTube 표준 `hqdefault.jpg` URL 하나만 사용한다. cache-busting query, 대체 thumbnail 파일 순회, custom fallback은 두지 않으며 thumbnail 파일을 repository에 별도 저장하지 않는다.

start poster는 재생 전 진입 화면만 담당하며, 재생 이후 YouTube 자체 UI를 사이트가 재설계하거나 덮어쓰지 않는다.
