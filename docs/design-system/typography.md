# 타이포그래피 & 형태

## 폰트

| 역할       | 폰트                | 토큰             | 사용처                                              |
| ---------- | ------------------- | ---------------- | --------------------------------------------------- |
| 본문       | Pretendard Variable | `--font-sans`    | 거의 모든 텍스트(제목·본문·UI). 한글/영문 모두      |
| 디스플레이 | Boogaloo            | `--font-display` | **라틴 전용** — 로고 "SLNOTE" 같은 영문 장식 텍스트 |

### ⚠️ 한글 vs 라틴 주의

Boogaloo는 **한글을 지원하지 않습니다.** 한글 제목에 `font-display`를 쓰면 글자가 시스템 폰트로 깨져 보입니다.

- **한글 제목(히어로 "지식을 만들고 편집하세요!" 등)** → `Pretendard`의 **Bold/Heavy**로 크게.
- **영문 로고·라틴 장식** → `Boogaloo`(`font-display`).

## 글자 크기 스케일

캡쳐의 위계를 기준으로 한 권장 스케일입니다. (Tailwind 유틸리티 기준)

| 단계    | 크기(권장)                        | 굵기            | 용도             |
| ------- | --------------------------------- | --------------- | ---------------- |
| Display | `text-4xl`~`text-5xl` (2.25~3rem) | `font-bold`     | 히어로 헤드라인  |
| H1      | `text-2xl` (1.5rem)               | `font-bold`     | 문서 제목        |
| H2      | `text-xl` (1.25rem)               | `font-semibold` | 섹션 제목        |
| H3      | `text-base`~`text-lg`             | `font-semibold` | 카드 제목·소제목 |
| Body    | `text-base` (1rem)                | `font-normal`   | 본문             |
| Small   | `text-sm` (0.875rem)              | `font-normal`   | 카드 설명·메타   |
| Caption | `text-xs` (0.75rem)               | `font-normal`   | 날짜·라벨·배지   |

- 본문 가독성을 위해 긴 글에는 `leading-relaxed`(넉넉한 행간)를 권장합니다.
- 카드 제목·설명은 넘칠 때 `line-clamp-1` / `line-clamp-2`로 잘라 레이아웃을 유지합니다(기존 `NoteItem` 패턴).

## 형태 (radius / 그림자)

- **radius**: 기본 `--radius: 0.75rem`. 카드·버튼·입력은 `rounded-xl`~`rounded-2xl` 수준으로 부드럽게.
- **FAB(플로팅 버튼)** 등 원형 요소는 `rounded-full`(완전 원).
- **그림자**: 카드는 옅고 일관된 그림자 하나로 통일합니다. 요소마다 다른 임의 그림자값(`shadow-[0_2px_12px_rgba(...)]`)을 흩뿌리지 마세요 — [do-and-dont.md](do-and-dont.md) 참고.
