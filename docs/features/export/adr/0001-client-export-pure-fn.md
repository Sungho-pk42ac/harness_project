# ADR-0001 — 클라이언트 순수 변환 함수 + 얇은 Blob 다운로드

- **상태(Status)**: Accepted
- **날짜**: 2026-05-31
- **관련**: [PRD §9 데이터/상태 모델](../PRD.md#9-데이터--상태-모델-개요), [ADR-0002](0002-backup-json-shape.md)

## Context

노트를 파일로 "어떻게" 꺼낼지 정해야 한다. 제약·맥락은 다음과 같다.

- 데이터는 이미 `NotesContext.notes`에 **전부 클라이언트 메모리**에 있다(소규모, 수십~수백 건).
- `NotesContext`는 서버 데이터의 **단일 출처**다 — 내보내기는 **읽기·표시**일 뿐 서버 데이터를 바꾸지 않는다.
- 실제 다운로드는 브라우저 API(`Blob`, `URL.createObjectURL`, anchor click)에 의존하는 **부수효과**다. 이 API는 **jsdom 테스트 환경에 없거나 다르게 동작**해, 순수 변환 로직과 섞으면 단위 테스트가 어렵다.
- 별도 라이브러리(file-saver 등) 없이 표준 API만으로 충분하다.

## Decision

내보내기를 **순수 변환 함수**와 **얇은 다운로드 부수효과 헬퍼**로 분리한다.

```ts
// src/lib/export.ts — 순수(부수효과 없음, 입출력만)
export function noteToMarkdown(note: Note): string; // 노트 1건 → 마크다운 문자열
export function notesToJson(notes: Note[]): string; // 노트 배열 → JSON 백업 문자열
export function buildExportFilename(base: string, ext: 'md' | 'json', date?: Date): string;

// src/lib/download.ts — 부수효과(브라우저 의존), 최대한 얇게
export function downloadTextFile(filename: string, text: string, mime: string): void;
//  - Blob 생성 → URL.createObjectURL → 임시 <a> 클릭 → URL.revokeObjectURL
```

- 변환 함수는 **원본 `notes`/`note`를 변형하지 않는다**(읽기만).
- 컴포넌트는 "변환 → 다운로드 호출"만 배선한다. 변환 로직을 컴포넌트에 인라인하지 않는다.
- 헤더 전역 액션(전체 백업)은 **`App.tsx`가 소유**해 `Layout`에 콜백으로 주입한다(검색어를 App이 소유한 것과 같은 화면-상태 경계). 단일 노트 내보내기는 그 노트를 들고 있는 `NoteEditor`가 수행.

## Consequences

**긍정**

- 변환은 입출력이 명확한 순수 함수라 **단위 테스트가 쉽고** 재사용 가능하다(첫 테스트 예제로 적합).
- 브라우저 의존 코드가 `download.ts` 한 곳에 격리돼, jsdom에서는 그 부분만 mock하면 된다(`createObjectURL` 부재 문제를 변환 테스트로 번지지 않게 함).
- 원본 불변이라 내보내기가 Context의 단일 출처를 오염시키지 않는다 — 검색 기능과 동일 철학.
- 서버 왕복·로딩 상태가 없어 동기·단순하다.

**부정 / 트레이드오프**

- 파일 두 개(`export.ts`/`download.ts`)로 나뉘어 아주 작은 기능치고 파일 수가 는다 → 책임 분리·테스트성 이득이 더 크다고 판단.
- `downloadTextFile` 자체의 브라우저 동작은 단위 테스트로 완전 검증되지 않는다 → 호출·인자 검증 + (선택) E2E로 보완.

## Alternatives Considered

1. **컴포넌트 안에서 변환+다운로드를 인라인 처리**
   - 기각 이유: 브라우저 API와 변환 로직이 엉켜 단위 테스트가 어렵고, 같은 변환을 재사용·검증하기 나쁘다.
2. **file-saver 등 외부 라이브러리 도입**
   - 기각 이유: 표준 `Blob`+anchor로 충분한데 의존성·번들을 늘린다. YAGNI.
3. **내보내기 상태를 `NotesContext`에 추가**(예: `exporting` 플래그/메서드)
   - 기각 이유: 내보내기는 서버 데이터를 바꾸지 않는 일회성 읽기다. 단일 출처에 화면/부수효과 관심사를 섞으면 경계가 흐려진다.
