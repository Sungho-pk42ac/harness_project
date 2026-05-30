---
name: design-system
description: SLNOTE 노트 웹의 UI를 만들 때 디자인 시스템(컬러·타이포·컴포넌트·Do/Don't)을 따르도록 안내합니다. 컴포넌트·페이지·화면·버튼·카드·모달·레이아웃을 새로 만들거나 스타일을 바꾸는 작업, Tailwind 클래스나 색·폰트·여백을 다루는 작업이면 반드시 이 스킬을 사용하세요. 사용자가 "디자인 시스템"을 명시적으로 언급하지 않더라도, UI를 만들거나 스타일링하는 의도가 보이면 사용합니다.
---

# SLNOTE 디자인 시스템 적용

이 프로젝트의 UI는 `docs/design-system/`에 정의된 디자인 시스템을 따릅니다.
UI를 만들거나 스타일을 바꾸기 전에, 아래 핵심 규칙을 적용하고 필요하면 원문 문서를 읽으세요.

## 먼저 읽을 곳

| 무엇을 정할 때      | 읽을 문서                                                                         |
| ------------------- | --------------------------------------------------------------------------------- |
| 색·토큰             | [`docs/design-system/colors.md`](../../../docs/design-system/colors.md)           |
| 폰트·글자 크기      | [`docs/design-system/typography.md`](../../../docs/design-system/typography.md)   |
| 컴포넌트 구성       | [`docs/design-system/components.md`](../../../docs/design-system/components.md)   |
| 애매할 때 판단 기준 | [`docs/design-system/do-and-dont.md`](../../../docs/design-system/do-and-dont.md) |

## 핵심 규칙 (요약)

작업 전 이것만은 지킵니다. 자세한 이유는 위 문서에 있습니다.

### 컬러 — 시맨틱 토큰만

- 색은 항상 **토큰**으로: `bg-card`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`.
- 포인트색 **인디고(primary)는 핵심 액션에만**: 주요 버튼·FAB·링크 강조 → `bg-primary text-primary-foreground hover:bg-primary-hover`.
- 배지·옅은 강조 → `bg-primary-subtle text-primary`.
- **임의 색상값 금지**: `bg-[#3b82f6]` 같은 hex 직접 사용 X. (빨강 `destructive`는 삭제·경고 전용)

### 타이포 — 한글엔 Pretendard

- 본문·제목은 **Pretendard**(`font-sans`, 기본값).
- **`font-display`(Boogaloo)는 라틴 전용** — 로고 "SLNOTE" 같은 영문에만. **한글 제목에 쓰면 글자가 깨집니다.**

### 형태 — 일관성

- radius는 `rounded-xl`~`rounded-2xl`로 통일, FAB만 `rounded-full`.
- **임의 그림자값(`shadow-[0_2px_12px_...]`) 금지**, **인라인 `style={{ }}` 매직넘버 금지**. 공통 클래스/토큰으로 모읍니다.

### 여백 / 위계

- 넉넉한 여백으로 위계를 만듭니다. 한 화면의 주요 액션(primary 버튼)은 하나로.

## 작업 순서

1. 만들 컴포넌트가 [`components.md`](../../../docs/design-system/components.md)에 정의돼 있으면 그 구성·토큰을 따릅니다.
2. 색/폰트/형태는 위 "핵심 규칙"을 적용. 애매하면 [`do-and-dont.md`](../../../docs/design-system/do-and-dont.md)를 확인합니다.
3. `bg-primary` 등 인디고 토큰이 아직 `src/index.css`에 없다면, [`colors.md`](../../../docs/design-system/colors.md)의 `@theme` 블록을 먼저 반영해야 클래스가 동작합니다.

> 참고: 커밋 시 husky 검사가 임의 색·그림자·인라인 style 위반을 자동으로 잡습니다. 이 스킬은 그 전에 "처음부터 올바르게" 만들도록 돕는 역할입니다.
