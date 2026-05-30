# 컬러

SLNOTE의 색은 **중립색(배경·카드·회색) + 인디고 포인트 + 빨강 경고**로 구성됩니다.
모든 색은 `src/index.css`의 `@theme`에 CSS 변수로 정의하고, Tailwind 클래스(`bg-primary`, `text-muted-foreground` 등)로 사용합니다.

## 중립색 (기존 유지)

이미 `src/index.css`에 정의되어 있는 토큰입니다. 그대로 유지합니다.

| 토큰                       | 값 (HSL)           | 용도                                    |
| -------------------------- | ------------------ | --------------------------------------- |
| `--color-background`       | `hsl(0 0% 94%)`    | 페이지 바탕(연회색). 카드를 띄우는 배경 |
| `--color-card`             | `hsl(0 0% 100%)`   | 카드·패널·모달의 흰 면                  |
| `--color-foreground`       | `hsl(220 35% 14%)` | 기본 텍스트(짙은 네이비)                |
| `--color-muted`            | `hsl(0 0% 90%)`    | 보조 버튼 배경, 옅은 면                 |
| `--color-muted-foreground` | `hsl(0 0% 42%)`    | 설명·날짜 등 보조 텍스트                |
| `--color-border`           | `hsl(0 0% 88%)`    | 카드·구분선 테두리                      |
| `--color-destructive`      | `hsl(0 84% 60%)`   | 삭제·경고 (일반 액션엔 쓰지 않음)       |

## 포인트색 — 인디고 (신규 추가)

캡쳐 디자인의 파란/인디고 포인트를 토큰화한 것입니다. 기존 foreground(네이비, 색조 220)와 어울리도록 색조 243~245로 잡았습니다.

| 토큰                         | 값 (HSL)            | 용도                                                  |
| ---------------------------- | ------------------- | ----------------------------------------------------- |
| `--color-primary`            | `hsl(243 75% 59%)`  | 주요 버튼, 링크 강조, FAB, 활성 상태                  |
| `--color-primary-foreground` | `hsl(0 0% 100%)`    | 인디고 위에 올리는 텍스트(흰색)                       |
| `--color-primary-hover`      | `hsl(245 58% 51%)`  | hover·press 시 한 단계 진한 인디고                    |
| `--color-primary-subtle`     | `hsl(243 100% 97%)` | 배지·선택 항목의 옅은 인디고 배경(텍스트는 `primary`) |
| `--color-ring`               | `hsl(243 75% 59%)`  | 포커스 링(= primary)                                  |

### 접근성 노트

- `primary`(흰 텍스트) 조합은 본문 크기 텍스트에서 대비가 충분합니다. 단 **연한 `primary-subtle` 배경 위에는 흰 텍스트를 올리지 말 것** — 반드시 `primary`(진한 인디고) 텍스트를 씁니다.
- `muted-foreground`는 보조 텍스트 전용입니다. 핵심 정보(본문·제목)에는 `foreground`를 쓰세요.

## 적용용 CSS

아래 블록을 `src/index.css`의 `@theme { ... }` 안에 붙여넣으면 신규 인디고 토큰까지 한 번에 적용됩니다. (중립색은 기존과 동일하므로 통합본으로 제공)

```css
@theme {
  /* 중립 */
  --color-background: hsl(0 0% 94%);
  --color-card: hsl(0 0% 100%);
  --color-foreground: hsl(220 35% 14%);
  --color-muted: hsl(0 0% 90%);
  --color-muted-foreground: hsl(0 0% 42%);
  --color-border: hsl(0 0% 88%);
  --color-destructive: hsl(0 84% 60%);

  /* 포인트 — 인디고 (신규) */
  --color-primary: hsl(243 75% 59%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-primary-hover: hsl(245 58% 51%);
  --color-primary-subtle: hsl(243 100% 97%);
  --color-ring: hsl(243 75% 59%);

  /* 폰트·radius (기존 유지) */
  --font-sans: 'Pretendard Variable', system-ui, sans-serif;
  --font-display: 'Boogaloo', sans-serif;
  --radius: 0.75rem;
}
```

> 이 문서는 가이드일 뿐 코드를 자동 수정하지 않습니다. 실제 적용은 구현 단계에서 위 블록을 반영하세요.

## 사용 예시

```html
<!-- 주요 액션 버튼 -->
<button class="bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl px-5 py-2">
  새 노트
</button>

<!-- 배지 -->
<span class="bg-primary-subtle text-primary text-xs px-2 py-0.5 rounded-full">NEW</span>
```
