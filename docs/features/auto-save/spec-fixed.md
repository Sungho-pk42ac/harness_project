# 확정 정의서 — auto-save

> 노트 전환/창 닫기 시 미저장 편집이 사라지는 손실을 막는다. 범위를 좁혀 위험을 줄인다.

## 1. 범위 — 기존 노트 편집의 디바운스 자동저장만

- **포함**: **이미 저장된 노트(selectedNote)** 를 편집할 때 title/content/tags 변경을 디바운스(800ms)로 `editNote` 자동 저장. 노트 전환·언마운트 시 대기 중 저장을 flush(손실 방지). 저장 상태 표시("저장 중…"/"저장됨").
- **제외**: 신규 노트(isCreating)는 기존 **저장 버튼 유지**(id 없음 → 자동 생성 시 중복 위험·E2E 흐름 보존). 충돌 해결·오프라인·낙관적 업데이트.
- **근거**: 손실 버그의 핵심은 "기존 노트 편집 중 전환". 신규 노트 자동생성은 범위를 키우고 tag/trash E2E(신규→저장 버튼)를 깨뜨릴 위험 → 다음 기회로.

## 2. 디바운스 — 순수 유틸 `src/utils/debounce.ts`

- `debounce(fn, ms)` → 호출을 ms만큼 지연·합치고, `.flush()`(즉시 실행)·`.cancel()`(취소) 제공. 순수·타이머 기반이라 fake timers로 단위 테스트.
- **근거**: 디바운스 로직을 컴포넌트에서 분리해 결정적으로 테스트(이 레포의 lib/utils 순수함수 패턴).

## 3. NoteEditor 연동

- 기존 노트 편집 중 title/content/tags가 바뀌면 디바운스 자동저장 예약. 저장 시작 시 "저장 중…", 완료 시 "저장됨"(잠시) 표시.
- `selectedNoteId` 변경(노트 전환)·언마운트 시 pending을 flush. 제목이 빈 경우 자동저장은 보류(수동 저장의 빈 제목 alert는 유지).
- 수동 "저장" 버튼은 그대로(즉시 저장). 자동저장과 동작 일관(editNote 동일 호출).

## 영향 파일

- 신규: `src/utils/debounce.ts` + `.test.ts`.
- 변경: `src/components/NoteEditor.tsx` + `NoteEditor.test.tsx`(자동저장 케이스 추가).
- 불변: 신규 노트 저장 흐름, tag/trash E2E.
