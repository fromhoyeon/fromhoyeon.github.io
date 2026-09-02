# Sanity content layer

이 디렉터리는 개인 웹사이트의 **외부 콘텐츠·asset 레이어**를 위한 Sanity schema 초안과 연결 기준을 보관한다.

중요한 경계:

- 웹페이지 구현과 배포는 계속 GitHub Pages가 담당한다.
- Sanity Studio를 웹사이트 프론트엔드로 사용하지 않는다.
- Sanity는 DB형 콘텐츠, 이미지, 파일을 저장하고 API/CDN으로 전달하는 역할만 맡는다.
- Sanity가 비활성 또는 장애 상태여도 현재 GitHub의 local 콘텐츠로 사이트가 동작해야 한다.

## 현재 준비된 schema

- `siteCopy` — 자주 바꿀 사이트 텍스트
- `portfolioPhoto` — 사진 pool. 이미지, 공개 여부, featured, series, year, tags
- `contentEntry` — 추후 게시물·기록용. 본문, 이미지 배열, 일반 파일/download 배열 포함

## 사용자가 한 번 해야 하는 일

### 1. Sanity 프로젝트 생성

Sanity에 로그인해 새 프로젝트를 만든다.

권장값:

- Project name: `Hoyeon Website Content`
- Dataset: `production`
- Dataset visibility: `public`

공개 포트폴리오에서 읽을 데이터이므로 frontend에 read token을 넣지 않는 구조를 사용한다.

프로젝트를 만든 뒤 **Project ID**를 기록한다.

### 2. CORS origin 추가

Sanity Manage의 API/CORS 설정에서 다음 origin을 추가한다.

`https://fromhoyeon.github.io`

Credentials는 필요하지 않다.

로컬 테스트가 필요하면 사용하는 localhost origin도 별도로 추가한다.

### 3. Project ID 전달 또는 설정

`assets/content/sanity-config.js`의 다음 값을 채운다.

```js
window.SANITY_CONFIG = {
  enabled: true,
  projectId: 'YOUR_PROJECT_ID',
  dataset: 'production',
  apiVersion: '2026-09-02',
  useCdn: true,
  features: {
    siteCopy: true,
    portfolioPhotos: true
  }
};
```

이 파일에는 **write token이나 비밀키를 절대 넣지 않는다.**

### 4. Sanity Studio 생성

Node.js/npm이 설치된 PC에서 공식 CLI로 clean Studio를 만든다.

```bash
npm create sanity@latest -- --project YOUR_PROJECT_ID --dataset production --template clean --typescript --output-path sanity-studio
```

그 다음 이 저장소의 `sanity/schemaTypes/` 내용을 생성된 Studio의 `schemaTypes/`에 사용하고,
`sanity/sanity.config.example.ts`를 기준으로 `sanity.config.ts`를 설정한다.

Studio 로컬 실행:

```bash
cd sanity-studio
npm run dev
```

필요하면 Sanity가 제공하는 Studio hosting으로 배포할 수 있다.

```bash
npx sanity@latest deploy
```

Studio는 콘텐츠 관리 UI일 뿐이며 GitHub Pages 웹사이트와는 별도다.

## 연결 후 현재 프로토타입 동작

### 텍스트

`siteCopy` document가 있으면 해당 필드만 local `assets/content/site-copy.js` 위에 덮어쓴다.
비어 있는 필드는 GitHub의 local 값이 그대로 유지된다.

### 사진

`portfolioPhoto` document 중 다음 조건을 만족하는 사진을 pool로 사용한다.

- `enabled != false`
- image asset이 존재함

Sanity가 활성화되어 있고 사진이 존재하면 현재 `Selected Photography`는 전체 remote pool 가운데 최대 12장을 무작위 선택한다.
Sanity 연결 실패 또는 사진 0장이면 현재 GitHub의 local sample pool을 그대로 사용한다.

이미지 query에서 Sanity가 보유한 dimensions/aspect ratio metadata를 함께 받아오므로, 원본 파일을 먼저 다운로드하지 않고도 justified layout을 계산할 수 있다.

## 향후 원칙

어떤 콘텐츠가 remote인지 static인지는 고정하지 않는다.

- 자주 바뀌는 콘텐츠 → Sanity
- 구조·레이아웃·인터랙션 → GitHub
- 내용이 확정된 remote 콘텐츠 → 필요 시 GitHub static으로 이동 가능
- 반복적으로 쌓이는 게시물·사진 pool → Sanity collection 유지 가능

Sanity는 교체 가능한 콘텐츠 레이어이며 웹사이트 자체의 canonical implementation은 GitHub에 남긴다.
