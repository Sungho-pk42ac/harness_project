-- supabase-notes-backend: notes 테이블 (ADR-0001/0002) — 클라우드와 동일 스키마.
-- 로컬 supabase(`supabase start`)와 CI E2E가 이 마이그레이션으로 동일 스키마를 갖춘다.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  created_at timestamptz,
  updated_at timestamptz,
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  deleted_at timestamptz
);

alter table public.notes enable row level security;

-- 인증은 다음 런(supabase-auth-rls)에서 user_id 기반으로 잠근다. 이번 런은 anon CRUD 임시 허용.
create policy "anon_select_notes" on public.notes for select to anon using (true);
create policy "anon_insert_notes" on public.notes for insert to anon with check (true);
create policy "anon_update_notes" on public.notes for update to anon using (true) with check (true);
create policy "anon_delete_notes" on public.notes for delete to anon using (true);

-- RLS 정책과 별개로 테이블 레벨 GRANT가 있어야 anon이 접근 가능하다(로컬/CI 필수).
grant select, insert, update, delete on public.notes to anon;
