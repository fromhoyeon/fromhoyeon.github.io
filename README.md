# fromhoyeon.github.io

Hoyeon의 개인 웹사이트이자 포트폴리오를 위한 저장소다.

## 목적

이 저장소는 `fromhoyeon.github.io`에 공개되는 개인 웹사이트를 소유한다.

음악, 사진, 영상, 미디어아트, 웹 작업을 처음부터 고정된 직업 카테고리로 영구 분리하지 않는다. 사이트의 정보 구조와 표현 방식은 미리 정한 분류 체계보다 실제 작업과 예술적 의도에서 발전시킨다.

개별 작품과 웹 애플리케이션의 상세 구현은 적절한 경우 각 프로젝트 저장소가 소유한다. 이 저장소는 그 작업들을 개인 웹사이트에서 어떻게 소개하고, 연결하고, 맥락화할지를 담당한다.

개인적 기억, 공개되지 않은 작품의 기원, 그 밖의 비공개 개인 맥락은 기본적으로 이 공개 저장소에 복제하지 않는다.

## 현재 상태

평가를 위해 이전 포트폴리오 프로토타입들을 이 저장소에 복원해두었다. 파일이 존재한다는 사실만으로 해당 구조, 분류, 타이포그래피, 시각 방향이 최종안으로 채택된 것은 아니다.

현재 루트의 주요 프로토타입과 테스트:

- `index.html` — 현재 공개 사이트의 진입점. `prototype-functional-onepage.html`로 즉시 이동시킨다. 당분간 이 단일 페이지 프로토타입을 메인 사이트로 사용한다.
- `prototype-random-photo-layout.html` — 10~15장의 사진이 서로 다른 비율로 유동적으로 들어온다고 가정하고, crop 없이 원본 비율을 유지한 채 화면 폭에 맞춰 justified row를 구성하는 사진 배치 실험.
- `prototype-functional-onepage.html` — 중앙 집중형 정보 영역과 제한된 타이포그래피·간격 규칙을 사용하는 현재 메인 단일 페이지. `Selected Photography`는 Sanity `portfolioPhoto`의 published/enabled 사진 pool에서 12장을 무작위로 선택한다. 모바일에서는 4개 행으로 배치하고 데스크탑에서는 mixed-ratio justified layout을 사용한다. 확대 보기에서 첫 사진 이전 이동은 막고, 마지막 사진에 도착하면 현재 사진을 유지한 채 selection을 새로 섞어 그 사진을 새 목록의 1번으로 만든다. 별도 Close 버튼은 없으며 흰 여백 클릭 또는 Esc로 닫는다. DODREI는 iframe을 즉시 로드하지 않고 투명한 외부 여백 안의 단일 dark-gray gate에서 `Play here / Open in new window`를 선택하게 한다. 주요 Portfolio Item의 제목·연도·meta·설명·tag·media URL과 홈페이지 순서는 Sanity에서 읽는다.
- `assets/content/site-copy.js` — Sanity-bound 전역 텍스트와 navigation bridge. Sanity 내용을 local copy로 복제하지 않으며 아직 remote 값이 없는 bound text/navigation은 `OFFLINE`으로 표시한다. 현재 기본 사이트 배경은 흰색이다.
- `assets/content/sanity-config.js` / `sanity-runtime.js` / `sanity-prototype-bridge.js` — Sanity content adapter. Project ID `a707yvok`, dataset `production`에 연결되어 있으며 active prototyping 중에는 CDN cache를 사용하지 않고 published data를 직접 읽는다. Portfolio Item의 Tag reference는 frontend에서 label로 resolve한다.
- `assets/content/youtube-custom-ui.js` — YouTube 기본 controls 대신 play/pause, seek timeline, current/duration만 제공하는 최소 control layer. 사이트의 CSS color variables를 사용한다.
- `assets/content/sanity-gallery-layout.js` — Portfolio Item의 Image Gallery block에서 지정한 `Rows` 수를 기준으로 사진의 실제 비율을 읽어 행 분할을 자동 계산한다. 각 행 안에서는 사진 높이를 동일하게 맞추되 crop하지 않는다.
- `sanity/` — `Portfolio Item`(`_type: workEntry`), `Tag`, `Photograph`(`_type: portfolioPhoto`), `homePage`, `siteCopy`, `siteNavigation`과 content block schema source 및 연결 기준. 실제 schema와 hosted Studio도 같은 content model로 배포되어 있다.
- `assets/prototypes/photo-samples/` — 과거 사진 배치·확대 동작 테스트를 위한 로컬 샘플 이미지. 현재 Selected Photography의 canonical pool은 아니다.
- `assets/prototypes/photo-samples-size-tests/` — 로컬 사진 크기 변형 테스트본.
- `style.css` — 이전 루트 편집형 포트폴리오 프로토타입의 스타일시트. 현재 메인 진입점에서는 사용하지 않는다.
- `gallery.html` / `gallery.css` — 연속 갤러리·아카이브 배치 실험.
- `Font_test.html`, `Font_test-1.html` ~ `Font_test-3.html` — 타이포그래피와 팔레트 테스트.
- `Embed_test_1.html` — 정지 이미지와 YouTube 임베드·배치 실험.
- `portfolio-v2/` — 공용 CSS/JS와 카테고리·프로젝트 페이지를 가진 과거 다중 페이지 포트폴리오 프로토타입.
- `styles.css` — 초기 최소 구조의 스타일시트. 현재 복원된 루트 프로토타입에서는 사용하지 않는다.
- `LEGACY_README.md` / `LEGACY_PROJECT_STATE.md` — 이전 포트폴리오 단계의 보존 기록. 현재의 기준 문서와 분리해서 유지한다.

현재 최종 프레임워크와 시각 시스템 전체가 확정된 것은 아니다. 다만 현재 공개 메인 화면은 `prototype-functional-onepage.html`을 사용한다.

## 2026-09-03 checkpoint

현재 메인 프로토타입의 **포맷과 기능은 실제 콘텐츠·문구 작업을 시작하기에 충분한 임시 기준선**으로 본다. 최종 디자인이나 정보 구조를 확정했다는 뜻은 아니며, 당분간 레이아웃 자체를 확장하기보다 무엇을 보여주고 어떤 문구를 사용할지 검토하는 단계로 이동했다.

이 checkpoint 이후 시작된 **작가의 작업 전반과 철학을 해석하는 논의는 홈페이지 구현 상태와 분리한다.** 해당 내용은 공개 사이트의 확정 문구나 이 저장소의 작가론으로 자동 반영하지 않고, 공개 가능한 내용만 추후 선택적으로 가져온다.

## 2026-09-05 content-model checkpoint

포트폴리오 콘텐츠가 실제로 늘어날 것을 전제로 Sanity의 일반 콘텐츠 모델을 단순화했다.

- 일반 공개 콘텐츠를 `Music`, `Media Art`, `Project` 같은 상위 타입이나 계층으로 미리 나누지 않는다.
- 일반 공개 항목은 모두 동등한 **Portfolio Item**으로 취급한다. 기존 데이터와 frontend reference를 보존하기 위해 기술적 `_type` 이름 `workEntry`는 유지한다.
- Portfolio Item 사이의 관계와 향후 조회는 독립 `Tag` document reference로 표현한다.
- 현재 모든 Tag는 완전히 동등하다. `year`, `series`, `tool`, `event`, `medium` 등의 tag group이나 hierarchy는 아직 만들지 않는다. 실제 콘텐츠가 충분히 쌓인 뒤 필요가 확인되면 추가한다.
- Portfolio Item 작성 시 기존 Tag를 검색·재사용하고, 필요할 때 새 Tag를 만든다.
- 사진은 현재 유일한 특수 케이스다. `Photograph` document pool을 따로 두되 일반 Portfolio Item과 동일한 Tag documents를 공유한다.
- production의 기존 문자열 tag `TouchDesigner`, `Archive`, `Performance`, `Batman`은 독립 Tag documents로 이관했다.
- 기존 5개 Portfolio Item의 공개 제목과 내용은 이번 구조 변경에서 바꾸지 않았다. 새 실제 콘텐츠로 교체·보강하는 작업은 다음 콘텐츠 편집 단계에서 진행한다.
- 사용되지 않는 `contentEntry`는 active repository schema 목록에서 제외하고 hosted Studio에서도 legacy type으로 숨겼다.

세부 schema와 runtime 기준은 `sanity/README.md`를 따른다.

## 콘텐츠 레이어 기준

- **GitHub Pages가 웹사이트 본체다.** HTML, CSS, JavaScript, 레이아웃, 인터랙션, 작품별 특수 구현, 텍스트의 시각적 포맷과 배포는 이 저장소가 계속 소유한다.
- **Sanity는 DB형 콘텐츠와 asset을 제공하는 외부 content layer다.** Sanity가 웹페이지를 렌더링하거나 사이트 구조 전체를 소유하지 않는다.
- **사이트 전역 문구는 Sanity `siteCopy` 문서에서 관리한다.** remote 값이 없거나 연결되지 않은 bound text는 `OFFLINE`으로 표시한다.
- **상단 메뉴는 Sanity `siteNavigation`의 `primary-navigation` singleton에서 관리한다.**
- **일반 공개 콘텐츠는 Sanity Portfolio Item 문서로 관리한다.** 기술적 `_type`은 기존 호환성을 위해 `workEntry`를 유지한다.
- **Portfolio Item의 노출 여부와 홈페이지 순서는 `homePage.featuredWorks` reference 배열이 결정한다.**
- **Portfolio Item의 관계·필터링용 메타데이터는 재사용 가능한 `tag` documents를 reference한다.** 현재 tag는 별도 그룹 없이 flat하게 운영한다.
- **작품 내부 구성은 `contentBlocks` 배열을 우선한다.** 현재 YouTube Video, Text, Image Gallery, Web Embed block을 조합하고 순서를 바꿀 수 있다.
- 기존 Portfolio Item 중 content block으로 아직 이관되지 않은 항목을 위해 legacy media fields는 compatibility 용도로 잠시 유지한다.
- **Image Gallery는 사진 비율을 보고 지정된 행 수 안에서 균형 있는 분할 지점을 계산하며 crop하지 않는다.**
- **YouTube는 기본 controls를 숨기고 사이트 자체의 최소 control bar를 실험 중이다.** 현재 play/pause, seek timeline, current/duration을 제공한다.
- **Work 영역의 사용자-facing fallback은 `OFFLINE`이다.** Sanity query가 실패하거나 Homepage 데이터가 없으면 과거 하드코딩 콘텐츠를 대신 노출하지 않는다.
- **Selected Photography의 canonical pool은 Sanity `portfolioPhoto`다.** 2026-09-05 기준 production에 enabled/published Photograph 98장이 있으며 그중 일부를 무작위 선택한다.
- 어떤 콘텐츠를 remote/static으로 둘지는 영구 고정하지 않는다. 외부 content layer도 교체 가능해야 한다.

현재 Sanity 관리 Studio:

`https://hoyeon-website-content.sanity.studio/`

## 현재 디자인 탐색 기준

2026-09-02 이후 대화에서 다음 취향과 작업 기준이 확인되었다. 이는 최종 시각안의 확정이 아니라 이후 프로토타입을 평가할 때 우선 참고할 기준이다.

- 시각적으로 여백 자체를 강조하는 미니멀리즘보다 **구조적으로 단순한 사이트**를 선호한다.
- 빈 공간은 장식이나 분위기를 위해 만들기보다 가독성, 매체 크기, 조작 편의 등 **기능적 이유의 결과**로 생기는 편을 선호한다.
- 많은 종류의 장식·타이포그래피를 쓰기보다 **몇 가지 글자 스타일, 간격, 블록 규격을 반복 조합**해 전체 미학을 만드는 방향을 선호한다.
- 기능 요소와 정보 구조를 숨기기보다 제목, 번호, 연도, 상태, 버튼, 링크 같은 **실용적 인터페이스가 화면의 디자인 요소로 드러나는 방식**을 선호한다.
- 모바일에서 본 `rushi.co`, `noplans.studio/work`, `bureauborsche.com`의 밀도와 반복 규칙을 긍정적으로 평가했다. 특히 Bureau Borsche의 화면을 꽉 채우는 성격과 Rushi의 제한된 타이포그래피 사용이 참고점이다. 데스크탑 버전 전체를 그대로 선호한다는 뜻은 아니다.
- 한국어와 영어를 함께 사용할 예정이며 현재 기본 서체는 `IBM Plex Sans KR`이다.
- 데스크탑에서도 화면 전체를 의무적으로 활용하지 않고, **텍스트와 일반 인터페이스는 중앙의 비교적 좁은 영역에 모으고 큰 사진·영상처럼 실제 필요가 있을 때만 폭을 확장**하는 방식을 선호한다.
- 기본 구조는 한 페이지 중심을 선호하며, 필요할 때만 같은 규격의 개별 페이지를 추가하는 방식을 우선 검토한다. 사진의 `More Photography`가 자체 페이지인지 외부 서비스인지도 아직 고정하지 않는다.
- 사진은 원본 비율을 디자인에 맞춰 자르기보다 그대로 유지하는 쪽을 우선한다.
- 현재 메인 프로토타입의 기본 배경은 **순백색(`#fff`)**이다.

## 작업 원칙

저장소의 현재 구조, 구현 상태, 기준 문서와 필요한 참조 경로를 확인할 때는 이 `README.md`를 최초 진입점으로 사용한다. 저장소에서 현재 상태를 확인할 수 있다면 프롬프트나 오래된 대화에서 변경 가능한 프로젝트 정보를 추정하지 않는다.

아이디어, 참고 자료, 제안된 탐색 구조, 복원된 과거 프로토타입, 디자인 실험은 명시적으로 현재 방향으로 선택되거나 구현되기 전까지 채택된 것으로 간주하지 않는다.

## 문서 언어와 용어

- 이 저장소의 작업 문서와 README는 기본적으로 **한국어를 우선**한다.
- 코드 식별자, 파일명·경로, API·제품명, 실제 UI 표기, 검색이나 외부 서비스가 원문을 요구하는 기술 용어는 원래 표기를 유지한다.
- 공개 사이트의 실제 문구처럼 관객·서비스 요구상 영어가 적합한 결과물은 이 규칙의 예외다.
- 정확한 기술 용어는 유지하되, 사용자를 실무 전문가가 아닌 **준전문가**로 가정한다. 불필요하게 전문 용어만으로 축약하지 않고 한국어로 자연스럽게 풀어쓸 수 있으면 먼저 풀어쓴 뒤 필요한 경우 첫 등장에 원래 용어를 괄호로 덧붙인다.
- 할 일과 다음 작업을 적을 때는 내부 구조 용어보다 실제로 무엇을 해야 하는지 바로 이해되는 표현을 우선한다.
- 현재 운영에 쓰이는 문서는 이 기준에 맞춰 유지한다. 과거 상태를 증거로 보존하는 `LEGACY_*` 문서는 역사 기록의 의미를 훼손하지 않기 위해 별도로 취급할 수 있다.

## 배포

이 저장소는 다음 GitHub Pages 주소에서 개인 사이트를 제공한다.

`https://fromhoyeon.github.io/`
