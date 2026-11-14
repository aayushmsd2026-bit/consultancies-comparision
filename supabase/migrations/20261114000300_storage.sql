-- =============================================================================
-- 3. The private bucket for proof files
--
-- Files are stored as:  <user id>/<review id>/<file name>
-- The uploader can add and read their own files. An admin can read and delete.
-- Nobody else. The bucket is not public, so there are no public links.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs',
  'proofs',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Uploaders can add their own proof files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Uploaders and admins can read proof files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'proofs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

create policy "Admins can delete proof files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'proofs' and (select public.is_admin()));
