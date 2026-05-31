# note-assistant-agent — 수직 슬라이스 이슈 (issues)

각 이슈는 데이터→에이전트→UI를 관통해 그 자체로 동작·관찰 가능하다. **walking skeleton(NAA-1~3)** 먼저,
이후 도구·확인게이트·UX를 덧붙인다. **AC(Given/When/Then) ≠ DoD(품질 게이트 체크리스트)**.

라벨: `feature/note-assistant-agent`, 우선순위 `P0/P1/P2`, `slice:*`.

## 공통 DoD (모든 이슈)

- [ ] `npm test`(Vitest) 그린, 새 로직 단위/컴포넌트 테스트 포함(LLM은 모킹 — ADR-0005)
- [ ] `npm run build`(tsc) 타입 에러 0, `npm run lint` 통과
- [ ] UI 변경 시 디자인 시스템 준수(시맨틱 토큰, 핵심 액션 `bg-primary`, 임의 hex/그림자/인라인 style 0 — 커밋 게이트 통과)
- [ ] 기존 회귀 없음, 한국어 주석·camelCase·JSDoc(전역 규칙)
- [ ] `tdd-review` Blocker 0

---

## NAA-1 — 채팅 패널 UI + 메시지 왕복 (walking skeleton) · P0 · slice:ui

**설명**: 우측 도크 채팅 패널을 만들고, 입력→전송 시 사용자 메시지를 표시하고 주입된 `onSend`
응답을 어시스턴트 메시지로 렌더한다. 에이전트/도구는 아직 없음(`onSend`는 주입 경계).

**범위**: `src/components/ChatPanel.tsx`, `src/lib/agent/messages.ts`(메시지 reducer 순수 함수),
`src/lib/agent/types.ts`. App 헤더에 "AI 비서" 토글 + Layout assistant 슬롯(최소).

**AC**

- Given 채팅 패널이 열려 있고, When 사용자가 "안녕"을 입력해 전송하면, Then 사용자 메시지 "안녕"이 목록에 보인다.
- Given `onSend`가 "반가워요"를 반환하도록 주입됐고, When 전송하면, Then 어시스턴트 메시지 "반가워요"가 이어서 렌더된다.
- Given 입력이 비어 있으면, When 전송을 눌러도, Then 메시지가 추가되지 않는다.
- Given 응답 대기 중이면, Then 타이핑 인디케이터가 보이고 중복 전송이 차단된다.

**DoD**: 공통 + ChatPanel 컴포넌트 테스트(RTL) + messages reducer 단위 테스트.

---

## NAA-2 — 도구 계약 + toolDispatcher · P0 · slice:logic

**설명**: 5개 도구 스키마와 순수 디스패처. 도구 호출(name+args)을 받아 주입된 deps(NotesContext
액션/utils)로 위임. 인자 검증 포함.

**범위**: `src/lib/agent/tools.ts`(스키마·`TOOLS_REQUIRING_CONFIRMATION`), `src/lib/agent/toolDispatcher.ts`.

**AC**

- Given `{name:'createNote', args:{title:'회의', content:'...', tags:['업무']}}`, When 디스패치하면, Then 주입된 `addNote('회의','...',['업무'])`가 호출되고 생성 노트를 반환한다.
- Given 빈 `title`의 createNote, When 디스패치하면, Then 검증 에러를 도구 결과로 반환하고 액션을 호출하지 않는다.
- Given 알 수 없는 도구명, When 디스패치하면, Then 명확한 에러 결과를 반환한다(throw로 루프 중단 안 함).

**DoD**: 공통 + 각 도구·검증 분기 단위 테스트(deps 모킹).

---

## NAA-3 — LangGraph 에이전트 루프(runAgent) + LlmClient 경계 · P0 · slice:agent

**설명**: LangGraph.js로 에이전트 루프 구성: LLM 노드 → tool_calls 있으면 디스패치→결과 회신→재호출,
없으면 종료. `LlmClient` 인터페이스로 LLM 격리(ADR-0005). ChatPanel `onSend`를 `runAgent`에 연결해
**채팅으로 노트 생성**이 관통(skeleton 완성). LangGraph 번들 이슈 시 동일 인터페이스의 순수 tool-loop 폴백(ADR-0001).

**범위**: `src/lib/agent/graph.ts`(`runAgent`), `src/lib/agent/llmClient.ts`(인터페이스+모킹용), ChatPanel 배선.

**AC**

- Given 모킹 LLM이 1차에 `createNote` tool_call, 2차에 "만들었어요"를 반환하도록 설정, When "노트 만들어줘" 전송, Then 노트가 1개 생성되고 어시스턴트가 "만들었어요"로 응답한다.
- Given 모킹 LLM이 tool_call 없이 바로 텍스트 응답, When 전송, Then 도구 실행 없이 그 텍스트가 렌더된다.
- Given 도구가 에러 결과를 반환, When 루프가 돌면, Then 에러가 LLM에 회신되고 루프가 무한반복하지 않는다(최대 스텝 가드).

**DoD**: 공통 + 모킹 LLM 기반 그래프 전이 결정적 테스트 + 최대 스텝 가드 테스트.

---

## NAA-4 — OpenAI 프록시 Edge Function + 실제 LLM 연결 · P0 · slice:backend

**설명**: `openai-proxy` Edge Function(인증 게이트 + OPENAI 키 주입 포워딩, ADR-0002)과, 브라우저
`LlmClient`의 OpenAI 구현(`ChatOpenAI` baseURL→프록시, `supabase.functions.invoke`로 JWT 첨부).

**범위**: `supabase/functions/openai-proxy/index.ts`, `supabase/config.toml`(`[edge_runtime] enabled`),
`src/lib/agent/openaiClient.ts`, `.env.example` 주석.

**AC**

- Given 유효 세션, When 브라우저가 LLM을 호출, Then 프록시가 JWT 검증 후 OpenAI로 포워딩하고 응답을 반환한다.
- Given JWT 없음, When 프록시를 호출, Then 401을 반환한다.
- Given 함수 env에 `OPENAI_API_KEY` 없음, When 호출, Then 503 + 설정 가이드 메시지를 반환한다.

**DoD**: 공통 + 프록시 핸들러 로직 단위 테스트(가능 범위) + Playwright **E2E 스모크 1개**.
**⚠ Open Question(PRD)**: 실제 LLM 호출/배포는 사용자가 `OPENAI_API_KEY`를 함수 secret으로 제공한 뒤 가능.
키 부재 시 E2E 스모크는 `test.skip` + README 가이드로 인계(자율 게이트는 코드·빌드·모킹 테스트까지).

---

## NAA-5 — 읽기 도구 통합 (searchNotes / listNotes) · P1 · slice:read

**설명**: 에이전트가 내 노트를 읽어 답한다. `searchNotes`는 `src/utils/filterNotes` 재사용, RLS 범위 내.

**AC**

- Given "회의"가 든 노트가 있고, When "회의 노트 찾아줘" 전송, Then 에이전트가 해당 노트를 요약/언급한다.
- Given 노트 0개, When "내 노트 목록" 전송, Then 빈 결과를 자연스럽게 안내한다.

**DoD**: 공통 + 검색/목록 도구 단위 테스트(모킹 LLM 시나리오 포함).

---

## NAA-6 — 수정 도구 통합 (updateNote) · P1 · slice:write

**설명**: 에이전트가 기존 노트를 수정한다(제목/본문/태그/핀). 대상 식별 후 `editNote`.

**AC**

- Given 노트 〈A〉가 있고, When "A 노트 제목을 B로 바꿔줘" 전송, Then `editNote(id,{title:'B'})`가 실행되고 목록/에디터에 반영된다.
- Given 존재하지 않는 노트 지칭, When 전송, Then 못 찾았음을 안내하고 변경하지 않는다.

**DoD**: 공통 + 수정 도구 단위 테스트.

---

## NAA-7 — 삭제 도구 + 확인 게이트 · P2 · slice:write-guarded

**설명**: `deleteNote`는 즉시 실행하지 않고 확인 카드 → 승인 시에만 `removeNote`(소프트 삭제). ADR-0004.

**AC**

- Given 노트 〈A〉, When "A 삭제해줘" 전송, Then 실행되지 않고 "A를 휴지통으로 보낼까요? 복구 가능" 확인 카드가 뜬다.
- Given 확인 카드, When [확인]을 누르면, Then `removeNote` 실행 + 목록에서 사라지고(휴지통으로) 결과가 채팅에 반영된다.
- Given 확인 카드, When [취소]를 누르면, Then 삭제되지 않고 그 사실이 안내된다.

**DoD**: 공통 + 확인게이트 전이 단위 테스트 + 확인 카드 컴포넌트 테스트.

---

## NAA-8 — 결과 양방향 반영 + 로딩/에러 UX + 배치 마무리 · P1 · slice:ux

**설명**: 생성/수정/삭제가 채팅 칩 + 좌 목록/에디터에 동기화. 로딩(타이핑)·에러(친화 문구+재시도)·
헤더 토글/우측 도크/좁은화면 오버레이 폴백을 디자인 시스템으로 다듬는다.

**AC**

- Given 에이전트가 노트를 생성, When 완료되면, Then 채팅에 "생성됨: 〈제목〉" 칩과 좌 목록에 새 노트가 동시에 보인다.
- Given LLM/네트워크 에러, When 발생하면, Then 친화 에러 메시지 + 재시도 안내가 보이고 패널이 깨지지 않는다.
- Given 좁은 화면, When 패널을 열면, Then 전체폭 오버레이로 렌더된다.

**DoD**: 공통 + 반영/에러 상태 테스트 + 디자인 시스템 게이트 통과.

---

## 의존 순서

NAA-1 → NAA-2 → NAA-3 (walking skeleton) → NAA-4 (실제 LLM, 키 필요) → NAA-5 → NAA-6 → NAA-7 → NAA-8.

> GitHub 등록 후 각 이슈 번호를 여기에 역링크한다.
