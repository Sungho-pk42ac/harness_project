-- supabase-auth-rls (AUTH-1): notes를 사용자별로 격리한다 (ADR-0001).
-- user_id 추가 후 anon 임시 정책/GRANT를 제거하고 authenticated 본인 행 정책으로 교체.
alter table public.notes
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- 이전 런의 anon 임시 정책 제거
drop policy if exists "anon_select_notes" on public.notes;
drop policy if exists "anon_insert_notes" on public.notes;
drop policy if exists "anon_update_notes" on public.notes;
drop policy if exists "anon_delete_notes" on public.notes;

revoke select, insert, update, delete on public.notes from anon;
grant select, insert, update, delete on public.notes to authenticated;

-- 본인 노트만 접근. createNote가 세션 user_id를 명시 주입한다(default 비의존).
create policy "own_select_notes" on public.notes
  for select to authenticated using (user_id = auth.uid());
create policy "own_insert_notes" on public.notes
  for insert to authenticated with check (user_id = auth.uid());
create policy "own_update_notes" on public.notes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_delete_notes" on public.notes
  for delete to authenticated using (user_id = auth.uid());
