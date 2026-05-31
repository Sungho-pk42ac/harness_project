-- E2E/로컬용 시드. `supabase start` 시 마이그레이션 후 자동 적용된다.
-- tags가 빈 배열인 노트 1건(구버전 호환 확인용). E2E 테스트는 고유 제목으로 자기 데이터를 따로 만든다.
insert into public.notes (id, title, content, created_at, updated_at, tags, is_pinned)
values (
  '00000000-0000-0000-0000-000000000001',
  '구버전 노트',
  '태그 필드가 없던 시절의 노트',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z',
  '{}',
  false
)
on conflict (id) do nothing;
