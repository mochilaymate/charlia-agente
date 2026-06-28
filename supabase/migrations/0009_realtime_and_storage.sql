-- 0009: Realtime publication and Storage bucket setup

-- Enable Realtime for the inbox (conversations + messages)
-- replica identity full required so UPDATE/DELETE events carry old record
alter table conversations replica identity full;
alter table messages replica identity full;

-- Add tables to the supabase_realtime publication
-- (idempotent: only adds if not already member)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table conversations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end;
$$;

-- Storage bucket for WhatsApp media (inbound: downloaded server-side from YCloud)
-- NOTE: Run this via Supabase dashboard or supabase-js admin client, not raw SQL,
-- if the storage extension is not available in the migration runner.
-- This is a no-op if storage.buckets doesn't exist yet.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'whatsapp-media',
      'whatsapp-media',
      false,  -- private bucket; access via signed URLs only
      52428800,  -- 50 MB max per file
      array['image/jpeg','image/png','image/webp','image/gif','audio/ogg','audio/mpeg','video/mp4','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    )
    on conflict (id) do nothing;

    -- RLS: workspace-scoped access via path prefix {workspace_id}/...
    -- Applied via Supabase Storage policies (managed in dashboard or via API)
  end if;
end;
$$;
