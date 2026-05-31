# note-assistant-agent — 확정본 (spec-fixed)

> ②단계. 보통은 사람 인터뷰로 모호함을 없애지만, 이 기능은 **auto-loop 멀티에이전트 합의**
> (PM·Tech Lead·User Advocate·Devil's Advocate)로 각 결정점을 확정했다. **각 결정에 근거**를 단다.
> 합의 불가/정보 부족은 **보수적 기본값 채택 + PRD Open Question 기록**으로 처리(사람에게 되묻지 않음).

## 0. 합의 요약 (수렴 결과)

Devil's Advocate가 "Edge Function(Deno) 코드는 Vitest 밖이라 TDD 게이트가 닿지 못하고,
LangGraph.js의 Deno 동작이 미검증"이라고 치명 반박 → **기술 사안이므로 Tech Lead 타이브레이크**로
아키텍처를 다음과 같이 재단해 GO:

- **에이전트 오케스트레이션(LangGraph.js)을 브라우저(`src/`)에서 실행**한다.
- **도구 실행도 브라우저에서** 기존 `NotesContext`/`src/api`로 수행 → 사용자 세션 JWT라 RLS 자동 준수.
- **Edge Function은 "OpenAI 프록시 + Supabase 인증 게이트"** 한 가지만 — `ChatOpenAI`의 `baseURL`을
  이 프록시로 향하게 해 **OpenAI 키를 서버에서만** 주입. (LangGraph를 Deno에서 돌릴 필요가 사라짐)

이 재단으로 그래프·도구·확인게이트 로직이 전부 `src/`에서 **LLM 모킹**으로 결정적 테스트 가능해진다.

## 1. 데이터 모델 / 타입

- **메시지**: `ChatMessage = { id: string; role: 'user' | 'assistant' | 'tool'; content: string;
toolCalls?: ToolCall[]; toolCallId?: string }`. (근거: OpenAI/LangChain 메시지 모델과 정합 — Tech Lead)
- **도구 호출**: `ToolCall = { id: string; name: ToolName; args: Record<string, unknown> }`.
- **확인 대기**: `PendingAction = { toolCall: ToolCall; summary: string }` — 삭제 등 확인 게이트가 필요한 도구.
- **노트**: 기존 `Note`(`src/types/note.ts`) 재사용. 새 필드 없음. (근거: 에이전트는 기존 CRUD 위에 얹힘 — Tech Lead)
- 대화 히스토리 **영속화 없음**(메모리 only, 새로고침 시 초기화). (근거: MVP YAGNI, 영속화는 후속 — PM/DA)

## 2. 입력 / 상호작용

- 채팅 패널: 텍스트 입력 + 전송(Enter/버튼). 멀티턴.
- 진입점: **헤더의 "AI 비서" 토글 버튼** → 우측 **도크 패널(slide-in)**. 좌 사이드바(목록)·중앙 에디터는
  유지되어 에이전트의 변경이 옆에서 즉시 보인다. 좁은 화면은 전체폭 오버레이로 폴백.
  (근거: 모달/전용뷰는 맥락을 가림, 결과 양방향 확인이 핵심 — User Advocate)
- 빈 입력·전송 중 재전송 방지(중복 호출 차단).

## 3. 도구(tool) 정책

| 도구          | 종류              | 동작                                                                        | 확인 게이트                     |
| ------------- | ----------------- | --------------------------------------------------------------------------- | ------------------------------- |
| `searchNotes` | 읽기              | 질의어로 활성 노트 필터(`src/utils/filterNotes` 재사용) 후 요약용 목록 반환 | 불필요                          |
| `listNotes`   | 읽기              | 활성 노트 목록(요약 메타) 반환                                              | 불필요                          |
| `createNote`  | 쓰기              | `addNote(title, content, tags)`                                             | 불필요(저위험, 되돌리기=휴지통) |
| `updateNote`  | 쓰기              | `editNote(id, updates)`                                                     | 불필요(되돌릴 수 있음)          |
| `deleteNote`  | 쓰기(비가역 위험) | `removeNote(id)` = 소프트 삭제(휴지통)                                      | **필요 — 실행 전 사용자 확인**  |

- **확인 게이트 메커니즘**: `deleteNote` 도구가 호출되면 즉시 실행하지 않고, 에이전트 루프가
  `PendingAction`을 만들어 **채팅에 확인 카드**("노트 〈제목〉을 휴지통으로 보낼까요? [확인]/[취소]")를
  띄운다. 사용자가 [확인]하면 그때 `removeNote` 실행 → 도구 결과를 모델에 회신해 루프 재개.
  (근거: 비가역 위험 + 사용자 통제 — User Advocate/DA. 소프트 삭제라 복구 가능함도 안내)
- 도구 인자 검증은 **순수 함수**로 `src/lib`에 두고 단위 테스트(잘못된 id·빈 제목 등 방어).

## 4. 표시 / 결과 반영

- 사용자 메시지·어시스턴트 메시지·확인 카드를 시간순으로 렌더. 로딩은 **타이핑 인디케이터**.
- 도구 실행 결과는 **양방향 반영**: 채팅에 "생성됨: 〈제목〉" 같은 칩 + **좌 목록/에디터 즉시 갱신**
  (도구가 `NotesContext`를 통하므로 자동 반영).
- 에러는 친화 문구 + 재시도 안내(네트워크/LLM/도구 실패 구분). (근거: 상태 가시성 — User Advocate)

## 5. 저장 흐름 / 아키텍처 (확정)

```
[ChatPanel(src/components)] ─ messages 상태(src/lib reducer)
     │ 전송
     ▼
[agentLoop (src/lib)] ── LangGraph.js StateGraph ──┐
     │  (LLM 노드)                                  │ tool_calls
     ▼                                              ▼
[ChatOpenAI baseURL=프록시] ──→ [Edge Function: openai-proxy]   [toolDispatcher(src/lib)]
     (브라우저, 키 없음)            (Deno: 인증 + OPENAI 키 주입)     │ createNote/searchNotes/...
                                                                     ▼
                                                          [NotesContext → src/api → Supabase(RLS)]
```

- 브라우저는 OpenAI 키를 모른다. `ChatOpenAI({ configuration: { baseURL: <함수 URL> } })`로
  프록시를 거치고, 프록시가 `Authorization: Bearer $OPENAI_API_KEY`를 붙여 OpenAI로 포워딩.
- 프록시는 요청의 **Supabase JWT를 검증**(미인증 401)해 키 오남용을 막는다.

## 6. 범위 (이번 기능)

- **포함**: 채팅 패널 UI, 브라우저 LangGraph 에이전트 루프, 5개 도구(읽기 2 + 쓰기 3),
  삭제 확인 게이트, 결과 양방향 반영, OpenAI 프록시 Edge Function, 단위/컴포넌트 테스트 + E2E 스모크.
- **제외(YAGNI, 후속)**: 응답 스트리밍, 대화 영속화/검색, 멀티 세션, 음성/첨부, 모델 선택 UI,
  비용 대시보드, 자동 태그/요약 자동화. **Graph DB 시각화는 별도 기능(`note-graph-viz`)으로 분리**.

## 7. 테스트 전략 (DA 반박 대응)

- **도구 디스패처·인자 검증·메시지 reducer·확인게이트 로직** → `src/lib` 순수 함수, Vitest 단위 테스트(LLM 무관).
- **LangGraph 그래프 라우팅** → LLM을 **모킹**(고정 tool_call/응답 주입)해 결정적 테스트.
- **ChatPanel** → React Testing Library 컴포넌트 테스트(어댑터 모킹).
- **실제 OpenAI 호출 + Edge Function** → Playwright **E2E 스모크 1개**(키 있을 때). 키 부재 시 skip + 수동 가이드.

## 8. 영향 파일 (예상)

- 신규: `src/lib/agent/{types.ts, tools.ts, toolDispatcher.ts, graph.ts, agentClient.ts, messages.ts}`,
  `src/components/ChatPanel.tsx`(+테스트), `supabase/functions/openai-proxy/index.ts`.
- 수정: `src/App.tsx`(헤더 토글 + assistant 슬롯), `src/components/Layout.tsx`(3번째 슬롯 옵션),
  `supabase/config.toml`(`[edge_runtime] enabled`), `package.json`(@langchain/langgraph·@langchain/openai),
  `.env.example`(OPENAI 관련 주석), `CLAUDE.md`(기능 목록·아키텍처 보강).

## 9. Open Questions (보수적 기본값으로 진행, PRD에 기록)

- **OPENAI_API_KEY 보유 여부 미확인**(시크릿이라 조회 불가) → 코드/테스트는 키 없이 빌드·통과하도록 설계,
  **실제 LLM 호출/배포는 사용자 키 제공 후**. 기본값: 프록시 함수는 키를 env에서 읽고 없으면 503.
- **LangGraph.js의 Vite 브라우저 번들 동작 미검증** → 에이전트 루프를 **인터페이스 뒤로 추상화**해
  LangGraph가 막히면 동등한 순수 tool-loop로 폴백(테스트는 인터페이스 기준이라 불변). 스파이크로 확인.
