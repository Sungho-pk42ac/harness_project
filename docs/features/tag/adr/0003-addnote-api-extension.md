# ADR-0003 — `addNote` 시그니처 확장 및 기본값 채우는 위치

- **상태(Status)**: Accepted
- **날짜**: 2026-05-30
- **관련**: [PRD §6 FR-9](../PRD.md#6-기능-요구사항-functional-requirements), [ADR-0001](0001-tag-data-model.md)

## Context

태그를 저장하려면 데이터 흐름 `NoteEditor → NotesContext → api/notes.ts → 서버`에 `tags`를 실어야 한다. 현재 시그니처는 다음과 같다.

```ts
addNote(title: string, content: string): Promise<void>;
editNote(id: string, updates: Partial<Note>): Promise<void>;
```

이 프로젝트의 컨벤션은 **"api 계층은 받은 데이터를 그대로 전송한다(가공 금지)"**, **"변경 함수는 호출부에서 try/catch+alert로 에러 처리"** 이다. 이 일관성을 깨지 않으면서 태그를 끼워야 한다.

## Decision

1. **`addNote`에 위치 인자 추가**:
   ```ts
   addNote(title: string, content: string, tags: string[]): Promise<void>;
   ```
2. **`editNote`는 변경하지 않는다.** 이미 `Partial<Note>`를 받으므로 `editNote(id, { title, content, tags })`로 태그를 함께 넘기면 된다.
3. **기본값(`[]`)은 호출부에서 채운다.** `api/notes.ts`는 내부에서 기본값을 채우지 않고 받은 값을 그대로 전송한다(기존 규칙 유지).
4. **저장 실패**는 기존과 동일하게 호출부 `try/catch` + `alert`로 처리한다.

## Consequences

**긍정**

- 현재 코드에서 **최소 변경**으로 확장된다(호출부 1곳 + 시그니처 1줄).
- "api는 순수 전송" 규칙이 유지되어 코드베이스 일관성이 보존된다.
- `editNote`는 손대지 않아 회귀 위험이 없다.

**부정 / 트레이드오프**

- 위치 인자가 3개가 되어, 향후 필드가 더 늘면 인자 나열이 길어진다 → 그 시점에 **객체 파라미터로 리팩터링**하는 후속 ADR을 남긴다.
- 기본값 책임이 호출부에 있어, 새로운 호출 지점이 생기면 `tags` 전달을 빠뜨리지 않도록 주의해야 한다(타입으로 강제됨 — `tags`가 필수 인자라 누락 시 컴파일 에러).

## Alternatives Considered

1. **객체 파라미터로 즉시 전환** (`addNote({ title, content, tags })`)
   - 장점: 확장성 좋음.
   - 기각(지금은): 모든 호출부를 동시에 고쳐야 해 변경 폭이 큼. 인자가 3개인 현재는 과한 변경. 필드가 더 늘 때 전환.
2. **api 계층에서 기본값 채우기**
   - 기각: "api는 받은 값 그대로 전송" 규칙 위반. 가공 로직이 계층에 흩어짐.
