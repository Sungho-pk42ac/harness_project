# 이슈 #57 — SUPA-2: fetchNotes를 Supabase로 전환

## 확정 시그니처 (불변 — 내부 구현만 교체)

```ts
// src/api/notes.ts
export async function fetchNotes(): Promise<Note[]>; // 시그니처·반환형 동일

// 신규(내부): snake_case row → camelCase Note 매퍼 (ADR-0002)
// toNote(row): Note  — created_at→createdAt, is_pinned→isPinned, deleted_at→deletedAt, tags ?? []
```

- 구현: `getSupabase().from('notes').select('*')` → `{ data, error }`. error면 `Error('Failed to fetch notes')`,
  성공이면 `(data ?? []).map(toNote)`. 삭제된 노트도 포함해 반환(휴지통 분리는 상위 Context/utils 소관 — 동작 불변).
- 테스트는 `./supabaseClient`의 `getSupabase`를 `vi.mock`으로 모킹(기존 fetch 모킹 대체).
- create/update/delete는 이 슬라이스에서 **그대로 fetch 유지**(SUPA-3·4 범위).

## 테스트 시나리오

- [정상] fetchNotes — should snake_case row를 camelCase `Note[]`로 매핑해 반환한다 when supabase가 데이터를 반환한다
- [경계] fetchNotes — should 빈 배열을 반환한다 when data가 null이다
- [예외] fetchNotes — should `Error('Failed to fetch notes')`를 throw한다 when supabase가 error를 반환한다

### AC 커버리지

- AC-A(Supabase에서 `Note[]`로 매핑 반환) → [정상]·[경계]
- AC-B(에러 시 기존과 같이 throw) → [예외]
