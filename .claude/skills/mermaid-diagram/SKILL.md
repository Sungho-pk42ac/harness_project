---
name: mermaid-diagram
description: 프로젝트 구조를 분석하여 Mermaid 다이어그램 HTML을 생성하고 브라우저를 실행하여 시각화합니다. 사용자가 "아키텍처 시각화", "의존성 그래프", "프로젝트 구조 그림", "다이어그램으로 보여줘", "mermaid", "구조 시각화" 등을 언급하거나, 코드베이스의 모듈/컴포넌트 관계를 한눈에 보고 싶어 할 때 반드시 사용하세요. 명시적으로 "다이어그램"이라는 단어를 쓰지 않더라도 구조를 시각적으로 파악하려는 의도가 보이면 사용합니다.
---

# Mermaid Diagram

프로젝트의 소스를 분석해 컴포넌트/모듈 간 의존성을 **Mermaid 다이어그램**으로 그리고,
어두운 테마의 HTML로 렌더링한 뒤 **브라우저로 즉시 띄워** 아키텍처를 한눈에 보여줍니다.

코드는 텍스트로 흩어져 있어 구조를 머릿속에서 재조합해야 합니다. 이 스킬은 그 부담을 덜어
"실제 import 관계"를 그림 한 장으로 보여주는 것이 목적입니다.

## 워크플로우

아래 3단계를 순서대로 수행합니다. 각 단계의 산출물이 다음 단계의 입력이 됩니다.

### 단계 1 — 의존성 분석 및 Mermaid 구문 생성

`src/` 디렉토리를 스캔하여 컴포넌트/모듈 간 의존성을 분석하고, Mermaid `graph TD` 구문을 만듭니다.

1. `src/` 하위의 `.ts` / `.tsx` 파일을 모두 찾습니다. (Glob: `src/**/*.{ts,tsx}`)
2. 각 파일에서 **로컬 import만** 추출합니다. 즉 `from './...'` 또는 `from '../...'`처럼
   상대경로로 시작하는 import 구문만 대상으로 하고, `react` 같은 외부 패키지(`node_modules`)는 제외합니다.
   - `import` / `export ... from` / 동적 `import()` 모두 살펴봅니다.
3. import 경로를 실제 파일 경로로 정규화합니다. 확장자 생략(`./Foo` → `Foo.tsx`/`Foo.ts`)과
   디렉토리 진입(`./foo` → `foo/index.ts`)을 고려합니다.
4. **각 파일을 노드, "A가 B를 import" 관계를 엣지**로 하여 `graph TD` 구문을 만듭니다.
   - 노드 ID는 충돌이 없도록 경로 기반으로 안전하게 만들고(예: `src/api/notes.ts` → `api_notes`),
     라벨에는 사람이 읽기 쉬운 이름(파일명 또는 짧은 상대경로)을 씁니다.
   - 엣지 방향은 **의존하는 쪽 → 의존되는 쪽**(`A --> B` 는 "A가 B를 사용")으로 통일합니다.

생성 예시:

```
graph TD
    App["App.tsx"] --> NotesContext["NotesContext"]
    NotesContext --> api_notes["api/notes.ts"]
    App --> Layout["Layout"]
    App --> NoteList["NoteList"]
    NoteList --> NotesContext
```

> 노드가 너무 많아 가독성이 떨어지면, 디렉토리(`api`, `context`, `components` 등)별로
> `subgraph`로 묶어 그룹화하면 한결 보기 좋습니다.

### 단계 2 — HTML 파일 생성

`docs/architecture/index.html`에 아래 템플릿을 기반으로 파일을 생성합니다.
`docs/architecture/` 디렉토리가 없으면 먼저 만듭니다.

요구사항:

- **Mermaid.js는 CDN**으로 불러옵니다 (`https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs`).
- **어두운 테마**: 배경색 `#1a1a1a`, Mermaid `theme: 'dark'`.
- 단계 1에서 만든 `graph TD` 구문을 `<pre class="mermaid">` 안에 그대로 삽입합니다.

템플릿:

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>프로젝트 아키텍처</title>
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #1a1a1a;
        color: #e0e0e0;
        font-family: -apple-system, 'Segoe UI', sans-serif;
      }
      h1 {
        font-weight: 600;
        font-size: 18px;
        color: #f0f0f0;
      }
      .mermaid {
        display: flex;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <h1>프로젝트 아키텍처 다이어그램</h1>
    <pre class="mermaid">
<!-- 단계 1에서 생성한 graph TD 구문을 여기에 삽입 -->
  </pre>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    </script>
  </body>
</html>
```

### 단계 3 — 브라우저 즉시 실행 (Windows)

생성한 HTML을 기본 브라우저로 엽니다. 이 프로젝트 환경은 **Windows**입니다.

```powershell
start "" "docs/architecture/index.html"
```

> **경로 주의**: 명령 실행 도구(Bash)는 백슬래시(`\`)를 escape 문자로 처리해
> `docs\architecture\...`가 `docsarchitecture...`로 깨질 수 있습니다. 반드시 **슬래시(`/`)**를
> 사용하세요. 또한 Windows `start`는 첫 번째 따옴표 인자를 창 제목으로 해석하므로,
> 경로 앞에 **빈 제목(`""`)**을 넣어야 경로가 올바르게 전달됩니다.
>
> 참고: 다른 OS에서 재사용할 경우 — macOS는 `open docs/architecture/index.html`,
> Linux는 `xdg-open docs/architecture/index.html`.

## 완료 보고

브라우저 실행까지 끝나면 사용자에게 정확히 이렇게 보고합니다:

```
아키텍처 다이어그램이 브라우저에서 열렸습니다.
```
