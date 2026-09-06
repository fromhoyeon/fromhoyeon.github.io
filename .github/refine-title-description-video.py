from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing pattern: {label}')
    return text.replace(old, new, 1)

# Bridge: Title description is a separate pre-content field; summary stays in its original content-description position.
bridge_path = Path('assets/content/sanity-site-bridge.js')
bridge = bridge_path.read_text()
header_block = '''  function applyHeader(section, work, index){
    const number = String(index + 1).padStart(2, '0');
    const num = section.querySelector('.work-head .num');
    const title = section.querySelector('.work-title');
    const meta = section.querySelector('.work-meta');
    if (num) num.textContent = number;
    if (title) title.textContent = work.title || '';

    if (meta) {
      const period = typeof work.period === 'string' ? work.period.trim() : '';
      meta.textContent = period;
      meta.hidden = !period;
    }
  }
'''
header_replacement = header_block + '''
  function applyTitleDescription(section, work){
    const header = section.querySelector(':scope > .work-head');
    const value = typeof work.titleDescription === 'string' ? work.titleDescription.trim() : '';
    const hasTitleDescription = Boolean(value);
    header?.classList.toggle('has-title-description', hasTitleDescription);

    let element = section.querySelector(':scope > .work-title-description');
    if (!hasTitleDescription) {
      element?.remove();
      return;
    }

    if (!element) {
      element = document.createElement('p');
      element.className = 'work-title-description';
      if (header?.nextSibling) section.insertBefore(element, header.nextSibling);
      else section.appendChild(element);
    }
    element.textContent = value;
  }
'''
bridge = replace_once(bridge, header_block, header_replacement, 'applyHeader')
bridge = bridge.replace("    section.querySelector(':scope > .work-head')?.classList.toggle('has-description', hasSummary);\n", '')
old_has_blocks = '''    const hasBlocks = renderContentBlocks(section, work);
    if (hasBlocks) {
      const hasCuratedVideoCollection = Array.isArray(work.contentBlocks) && work.contentBlocks.some((block) => block?._type === 'workCuratedVideoCollectionBlock');
      if (descriptionBox) {
        descriptionBox.classList.toggle('is-section-intro', hasCuratedVideoCollection && hasSummary);
        const content = section.querySelector(':scope > .sanity-content-blocks');
        if (hasCuratedVideoCollection && hasSummary && content) section.insertBefore(descriptionBox, content);
      }
      return;
    }

    descriptionBox?.classList.remove('is-section-intro');
'''
new_has_blocks = '''    const hasBlocks = renderContentBlocks(section, work);
    applyTitleDescription(section, work);
    descriptionBox?.classList.remove('is-section-intro');
    if (hasBlocks) return;

'''
bridge = replace_once(bridge, old_has_blocks, new_has_blocks, 'content description placement')
bridge_path.write_text(bridge)

# CSS: restore old default work header, make lower divider conditional on Title description,
# and replace scrollable Video Collection with four-thumbnail pagination.
css_path = Path('assets/content/site.css')
css = css_path.read_text()
css = replace_once(
    css,
    '.work-head{display:grid;grid-template-columns:32px 1fr auto;gap:var(--m);align-items:start;border-top:1px solid var(--fg);padding:10px 0 var(--m)}\n.work-head.has-description{border-bottom:1px solid var(--line);padding-bottom:11px;margin-bottom:18px}',
    '.work-head{display:grid;grid-template-columns:32px 1fr auto;gap:var(--m);align-items:start;border-top:1px solid var(--fg);padding:10px 0 var(--m)}\n.work-head.has-title-description{border-bottom:1px solid var(--line);padding-bottom:11px}\n.work-title-description{max-width:560px;padding:11px 0 22px;font-size:12px;line-height:1.55;color:var(--muted);white-space:pre-line}',
    'work header rule'
)
css = re.sub(r'\n\.description\.is-section-intro\{[^\n]*\}\n\.description\.is-section-intro p\{[^\n]*\}', '', css, count=1)

start = css.index('.video-collection-breakout{')
end = css.index('\n.about{', start)
video_css = r'''.video-collection-breakout{width:min(calc(100vw - 24px),var(--video));margin-left:50%;transform:translateX(-50%)}
.video-collection{display:grid;gap:0}
.video-collection-stage{width:100%;aspect-ratio:16/9;background:var(--media-black)}
.video-collection-stage iframe{display:block;width:100%;height:100%;border:0}
.video-collection-info{--video-info-bg:color-mix(in srgb,var(--panel) 20%,var(--bg));padding:14px 16px 15px;background:var(--video-info-bg);border-bottom:1px solid var(--line)}
.video-collection-meta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--m);align-items:baseline;padding-bottom:9px}
.video-collection-current-title{min-width:0;font-size:13px;line-height:1.3;font-weight:500;letter-spacing:-.012em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.video-collection-status{font-size:9px;line-height:1;color:var(--muted);font-variant-numeric:tabular-nums;letter-spacing:.04em}
.video-collection-description{max-width:680px;font-size:11.5px;line-height:1.55;color:var(--muted);white-space:pre-line}
.video-collection-description[hidden]{display:none}
.video-collection-tray{padding-top:12px}
.video-collection-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--s)}
.video-collection-thumb{appearance:none;border:0;padding:0;margin:0;position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--panel);cursor:pointer}
.video-collection-thumb img{display:block;width:100%;height:100%;object-fit:cover;transition:opacity .12s ease}
.video-collection-thumb::after{content:'';position:absolute;inset:0;border:1px solid transparent;pointer-events:none;transition:border-color .12s ease}
.video-collection-thumb:hover img,.video-collection-thumb:focus-visible img{opacity:.82}
.video-collection-thumb.is-active::after{border-color:var(--fg)}
.video-collection-thumb:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
.video-collection-thumb-number{position:absolute;right:5px;bottom:4px;padding:2px 3px 1px;background:color-mix(in srgb,var(--media-black) 64%,transparent);color:var(--media-white);font-size:8px;line-height:1;font-variant-numeric:tabular-nums}
.video-collection-pagination{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px}
.video-collection-page-button{appearance:none;width:28px;height:28px;border:0;padding:0;background:transparent;color:var(--fg);display:grid;place-items:center;font-size:18px;line-height:1;cursor:pointer}
.video-collection-page-button:hover,.video-collection-page-button:focus-visible{background:var(--panel)}
.video-collection-page-button:focus-visible{outline:1px solid var(--fg);outline-offset:2px}
.video-collection-page-button:disabled{opacity:.22;cursor:default;background:transparent}
.video-collection-page-status{min-width:76px;text-align:center;font-size:9px;line-height:1;letter-spacing:.06em;color:var(--muted);font-variant-numeric:tabular-nums;text-transform:uppercase}
.video-collection-actions{display:flex;justify-content:center;margin-top:10px}
.video-collection-shuffle{appearance:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--accent-blue);padding:7px 10px 6px;background:var(--bg);color:var(--accent-blue);font-size:10px;font-weight:500;line-height:1.2;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
.video-collection-shuffle:hover,.video-collection-shuffle:focus-visible{background:var(--accent-blue);color:var(--media-white)}
.video-collection-shuffle:focus-visible{outline:2px solid color-mix(in srgb,var(--accent-blue) 35%,transparent);outline-offset:2px}
.video-collection-message{min-height:96px;display:grid;place-items:center;border:1px solid var(--line);color:var(--muted);font-size:10px;letter-spacing:.04em;text-transform:uppercase;text-align:center}
a.video-collection-message:hover,a.video-collection-message:focus-visible{border-color:var(--fg);color:var(--fg)}
'''
css = css[:start] + video_css + css[end:]

# Remove the prior global mobile header margin and old scroll/fade video overrides.
mobile_start = css.index('@media (max-width:620px){')
mobile = css[mobile_start:]
mobile = mobile.replace('  .work-head{margin-bottom:14px}\n', '')
mobile = mobile.replace('  .description.is-section-intro{padding:0 0 18px}\n', '')
old_mobile_video = '''  .video-collection-info{height:126px;padding:12px 12px 10px}
  .video-collection-meta{gap:10px;padding-bottom:8px}
  .video-collection-current-title{font-size:12px}
  .video-collection-description{font-size:11px;line-height:1.5;padding-right:10px}
  .video-collection-description-shell.has-more::after{height:24px}
  .video-collection-tray{padding:10px 10px 0}
  .video-collection-tray-head{padding-bottom:7px}
  .video-collection-grid-viewport{max-height:55vw;padding-top:5px}
  .video-collection-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}'''
new_mobile_video = '''  .work-title-description{padding:9px 0 18px;font-size:11px;line-height:1.5}
  .video-collection-info{padding:12px 12px 13px}
  .video-collection-meta{gap:10px;padding-bottom:8px}
  .video-collection-current-title{font-size:12px}
  .video-collection-description{font-size:11px;line-height:1.5}
  .video-collection-tray{padding:10px 10px 0}
  .video-collection-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
  .video-collection-pagination{margin-top:8px}
  .video-collection-page-button{width:32px;height:30px}
  .video-collection-actions{margin-top:8px}'''
if old_mobile_video not in mobile:
    raise SystemExit('missing pattern: mobile video rules')
mobile = mobile.replace(old_mobile_video, new_mobile_video, 1)
css = css[:mobile_start] + mobile
css_path.write_text(css)

# Cache versions.
index_path = Path('index.html')
index = index_path.read_text()
index = index.replace('assets/content/site.css?v=20260907-1', 'assets/content/site.css?v=20260907-2')
index = index.replace('assets/content/sanity-runtime.js?v=20260906-5', 'assets/content/sanity-runtime.js?v=20260907-1')
index = index.replace('assets/content/video-collection.js?v=20260907-1', 'assets/content/video-collection.js?v=20260907-2')
index = index.replace('assets/content/sanity-site-bridge.js?v=20260907-1', 'assets/content/sanity-site-bridge.js?v=20260907-2')
index_path.write_text(index)

# Canonical README.
readme_path = Path('README.md')
readme = readme_path.read_text()
readme = re.sub(
    r'## Video Collection\n.*?\n## Sanity 경계',
    '''## Video Collection

기본 `Video Collection` content block은 영상마다 Sanity에서 `YouTube URL`, `Title`, `Description`을 개별 관리한다. 배열 순서가 기본 표시 순서이고 첫 영상이 초기 선택이다.

- 선택된 영상은 상단 16:9 player에 표시한다.
- player 아래에서 선택 영상의 Title과 Description을 표시한다. Description은 현재 접거나 내부 scroll하지 않고 전체 길이를 표시한다.
- thumbnail은 한 page에 4개만 표시한다. desktop은 4열, mobile은 2열 × 2행이다.
- thumbnail 아래의 `PAGE 현재 / 전체` 이전·다음 control로 목록 page를 이동한다.
- thumbnail 선택 시 mobile에서는 짧은 custom transition으로 player 위치로 빠르게 이동한다.
- 파란색 `Shuffle order`는 browser 안의 영상 순서와 선택 영상만 섞고 page 1로 돌아간다. Sanity 배열 순서는 수정하지 않는다.
- `Playlist Video Collection · backup`은 playlist URL 하나로 목록을 자동 생성하는 별도 보존 기능이다.

Portfolio Item에는 `Title description`과 기존 `Description`이 별도로 존재한다. `Title description`은 제목 바로 아래, 모든 content 이전에 표시되며 이 값이 있을 때만 제목 하단 divider가 나타난다. 기존 `Description`은 content 설명으로 기존 위치를 유지한다.

## Sanity 경계''',
    readme,
    flags=re.S
)
readme_path.write_text(readme)

# Sanity README.
sanity_readme_path = Path('sanity/README.md')
sanity_readme = sanity_readme_path.read_text()
sanity_readme = sanity_readme.replace(
    '- `summary`\n',
    '- `titleDescription` — 제목 바로 아래, content 이전에 표시되는 선택적 부가설명\n- `summary` — 기존 content Description. media/content 뒤의 설명 역할을 유지\n'
)
sanity_readme = re.sub(
    r'기본 `Video Collection`은 `videos\[\]` 배열을 사용한다\..*?기존 playlist 자동 추출 구현은 `Playlist Video Collection · backup`으로 유지한다\. 이 block만 `playlistUrl` 하나를 source로 사용한다\.\n',
    '''기본 `Video Collection`은 `videos[]` 배열을 사용한다. 각 item의 최소 필드는 `YouTube URL`, `Title`, `Description`이며 Sanity 배열 순서가 기본 표시 순서다. 첫 item이 초기 선택 영상이다. 향후 year, credit, role 등이 실제로 필요할 때 item field를 추가한다.

frontend는 한 번에 thumbnail 4개만 표시하고 page control로 다음 4개를 탐색한다. mobile은 2열 × 2행, desktop은 4열이다. 개별 영상 Description은 현재 전체 길이를 표시하며 내부 scroll/fade를 사용하지 않는다. `Shuffle order`는 browser 안의 순서만 섞고 Content Lake 배열 순서는 변경하지 않는다.

기존 playlist 자동 추출 구현은 `Playlist Video Collection · backup`으로 유지한다. 이 block만 `playlistUrl` 하나를 source로 사용한다.
''',
    sanity_readme,
    flags=re.S
)
sanity_readme_path.write_text(sanity_readme)
