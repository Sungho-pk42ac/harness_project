---
name: tdd-red
description: 승인된 테스트 시나리오(`docs/features/<기능>/issue-{N}.md`)를 "반드시 실패하는" Vitest 테스트 코드로 옮기고 RED를 확인하는 TDD RED 단계 스킬입니다. `/tdd-red {이슈번호}`로 부르거나, 사용자가 "RED 단계", "실패하는 테스트부터 작성", "시나리오를 테스트 코드로", "이슈 N TDD 시작", "테스트 먼저 짜자(test-first)" 등을 말하면 반드시 사용하세요. "RED"·"TDD"를 명시하지 않아도, 이미 도출된 시나리오/시그니처를 테스트 코드로 옮기려는 의도가 보이면 발동합니다. (구현 로직은 작성하지 않습니다 — 테스트와 최소 스텁, RED 확인까지만. 통과시키는 GREEN 단계는 별도.)
---

# TDD RED

`test-scenarios` 스킬이 만든 **`docs/features/<기능>/issue-{N}.md`**(상단=확정 시그니처, 하단=승인된 `should…when…` 시나리오)를 입력받아, **반드시 실패하는 Vitest 테스트 코드**로 옮기고 **실행해서 RED를 확인**합니다. 이후 테스트를 통과시키는 **GREEN(구현) 단계로 인계**합니다.

> **`<기능>` 결정 규칙(하드):** 경로의 `<기능>`은 추측하지 않습니다. 이슈 라벨/마일스톤 또는 작업 브랜치명 `feature/<slug>`의 **`<slug>`** 로 정합니다(`test-scenarios`가 쓴 산출물 파일이 이미 그 경로에 있으니, 없으면 멈추고 확인). 이 프로젝트는 `tag` 외에 `login`·`pin`·`trash`·`sort`·`search`·`markdown-preview`·`duplicate`·`export` 등으로 확장됐으므로 **`tag`를 기본값으로 가정하지 마십시오.**

왜 RED를 먼저 확인하나: 테스트가 "올바른 이유"(아직 구현이 없어서)로 실패하는 걸 눈으로 봐야, 그 테스트가 실제로 행위를 검증한다는 보장이 생깁니다. 처음부터 통과하는 테스트는 아무것도 지켜주지 못합니다. 시나리오 한 줄(`[분류] 함수 — should … when …`)이 곧 `it(...)` 한 개로 1:1 떨어지므로, 변환은 기계적이고 역추적이 쉽습니다.

## 하드 규칙 (반드시 지킬 것)

- **구현 로직 작성 금지.** 스텁은 "컴파일·실행만 되는 빈 껍데기"입니다. 테스트를 통과시키는 코드를 쓰면 RED 위반 — 그건 GREEN 단계의 몫입니다.
- **테스트가 통과하면 실패한 것.** 이 단계의 정상 산출물은 "전부 실패"입니다. 통과하는 `it`이 하나라도 있으면 시나리오를 잘못 옮겼거나 이미 구현이 있는 것이니 멈추고 점검합니다.
- **승인된 시나리오와 1:1.** `issue-{N}.md`에 있는 시나리오만, 모두 옮깁니다. 시나리오에 없는 테스트를 지어내지 말고, 한 줄도 빠뜨리지 마세요.
- **확정 시그니처만 사용.** 시그니처를 임의로 바꾸지 않습니다. 옮기다 시그니처가 어긋나면 코드를 비틀지 말고 `test-scenarios` 단계로 되돌려 시그니처를 고칩니다.
- **올바른 이유로 실패할 것.** assertion 실패나 "미구현"이어야 합니다. 오타·잘못된 import·모킹 실수로 인한 실패는 RED가 아니므로 고칩니다.

## 입력

- 이슈 번호는 **`$ARGUMENTS`** 로 전달됩니다 (예: `/tdd-red 6`).
- 자연어로 불러도(예: "이슈 6 RED") 번호를 추출해 같은 절차를 따릅니다. 번호를 특정 못 하면 추측하지 말고 물어봅니다.
- **출발점은 승인된 `issue-{N}.md`**(test-scenarios의 ⑦ 시나리오 승인 완료본)입니다. 파일이 없거나 시나리오가 비어 있으면 RED를 시작하지 말고 먼저 `test-scenarios`로 시나리오를 도출하라고 안내합니다.

## 절차

### ① 입력 로드

`docs/features/<기능>/issue-{N}.md`를 읽어 **확정 시그니처**와 **테스트 시나리오**(함수/컴포넌트별 그룹 + 분류 태그)를 파악합니다. AC 커버리지 표도 함께 봐 두면 ⑥ 보고에서 매핑할 수 있습니다.

### ② 테스트 파일 매핑

시나리오 그룹별로 대상 소스 옆에 둘 테스트 파일 경로를 정합니다(co-locate, 자세한 컨벤션은 아래 절 참고).

- `createNote / updateNote (api)` → `src/api/notes.test.ts`
- `addNote / editNote (Context)` → `src/context/NotesContext.test.tsx`
- `NoteEditor (컴포넌트)` → `src/components/NoteEditor.test.tsx`

### ③ 최소 스텁

확정 시그니처대로 **컴파일·실행만 되는** 최소 코드를 만듭니다(있는 파일이면 시그니처가 테스트와 맞도록 최소 변경만).

- 함수: 시그니처만 갖춘 빈 본문(`throw new Error('Not implemented')`) 또는 타입만 채운 형태.
- 타입: 테스트가 참조하는 필드/타입을 추가(예: `Note`에 `tags: string[]`). 타입 추가는 행위 구현이 아니므로 허용.
- 컴포넌트: 시그니처(Props)만 맞춘 껍데기. 동작은 넣지 않습니다.

> 목표는 "테스트가 컴파일되어 **실행**되고, assertion에서 실패"하게 만드는 것입니다. 스텁이 테스트를 통과시키면 안 됩니다.

### ④ 시나리오 → 테스트 변환

시나리오 한 줄을 `it` 한 개로 옮깁니다.

- `describe('함수/컴포넌트명')` 안에 `it('[분류] should … when …')`를 둡니다. **분류 태그와 `should…when…` 문구는 `issue-{N}.md`와 똑같이** 적어 1:1 대조가 되게 합니다.
- 계층별 모킹 패턴을 적용합니다(아래 컨벤션 참고).
- AAA(Arrange–Act–Assert) 구조로, 비동기는 `await` / `findBy*`.

### ⑤ RED 실행 확인

`npx vitest run <파일경로>` 로 실제 실행합니다.

- **모든 `it`이 실패**하는지 확인합니다(통과가 있으면 멈추고 점검).
- 실패가 **올바른 이유**(assertion 실패 / `Not implemented` / 아직 없는 행위)인지 확인합니다. 오타·import·모킹 실수로 인한 깨짐이면 **그것만** 고치고 다시 실행합니다(구현은 건드리지 않습니다).

### ⑥ 결과 보고 & 인계

RED 결과를 요약 보고합니다: 작성한 테스트 파일, `통과 0 / 실패 N`, 그리고 시나리오·AC가 모두 테스트로 옮겨졌다는 매핑. 이어서 **GREEN(구현) 단계로 인계**합니다(테스트를 하나씩 통과시키는 작업).

## 테스트 파일 컨벤션

- **위치 — co-locate.** 대상 소스 바로 옆에 `*.test.ts`(로직) / `*.test.tsx`(컴포넌트). 새 디렉터리(`__tests__`)를 만들지 않습니다.
- **import.** `vite.config.ts`에 `globals: true`라 `describe/it/expect/vi`는 import하지 않습니다. jest-dom 매처는 `src/test-setup.ts`로 자동 로드됩니다. 컴포넌트는 `render, screen`(`@testing-library/react`)과 `userEvent`(`@testing-library/user-event`)를 import합니다.
- **구조.** `describe('대상명')` → `it('[정상/경계/예외] should … when …')`. 문구는 시나리오 그대로(한국어 유지).
- **계층별 모킹.**
  - **api**(`notes.test.ts`): 네트워크 경계인 `fetch`를 `vi.stubGlobal('fetch', vi.fn())`으로 모킹. 응답은 `{ ok, json }` 형태로 흉내. `res.ok=false` 케이스로 throw를 검증.
  - **Context**(`NotesContext.test.tsx`): api 모듈을 `vi.mock('../api/notes')`로 모킹하고, `renderHook`(또는 테스트용 소비 컴포넌트)으로 `useNotes()` 호출. api 호출 인자/상태 갱신/에러 전파를 검증.
  - **컴포넌트**(`NoteEditor.test.tsx`): `NotesProvider`로 감싸 렌더하거나 `useNotes`를 모킹. 사용자 동작은 `userEvent`로, `alert`는 `vi.spyOn(window, 'alert')`로 검증.
- **AAA + 비동기.** Arrange→Act→Assert. 상태 변화는 `await screen.findBy*` / `await waitFor`로 기다립니다.

### 예시 (변환 형태만 — 실제 시나리오에 맞게 작성)

```ts
// src/api/notes.test.ts
import { createNote } from './notes';

describe('createNote', () => {
  it('[예외] should Error("Failed to create note")를 throw한다 when res.ok가 false다', async () => {
    // Arrange: 실패 응답을 주도록 fetch 모킹
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    // Act & Assert
    await expect(createNote({ title: 't', content: 'c', tags: [] })).rejects.toThrow(
      'Failed to create note',
    );
  });
});
```

> 위 ②의 매핑(api/Context/컴포넌트)은 예시입니다. 실제 테스트 대상 소스(`src/api`·`src/context`·`src/components`·`src/lib`·`src/utils`)와 `issue-{N}.md` 경로는 **그 이슈의 기능(`<기능>`)에 맞게** 정합니다 — `tag`로 고정하지 마세요.
