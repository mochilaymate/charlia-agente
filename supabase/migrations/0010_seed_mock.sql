-- 0010: Mock seed data for development
-- Run manually after creating a real auth.users entry via signup
-- Replace the UUIDs with real ones from your Supabase project.

-- Uncomment and fill in real values before running:

/*
do $$
declare
  v_user_id   uuid := '<your-auth-user-uuid>';
  v_ws_id     uuid := uuid_generate_v4();
  v_contact1  uuid := uuid_generate_v4();
  v_contact2  uuid := uuid_generate_v4();
  v_conv1     uuid := uuid_generate_v4();
  v_conv2     uuid := uuid_generate_v4();
begin

insert into workspaces (id, slug, name, owner_id, settings)
values (v_ws_id, 'demo', 'Demo Workspace', v_user_id, '{"ycloud_api_key": "", "phone_number": "+1555000000"}');

insert into users (id, workspace_id, email, role)
values (v_user_id, v_ws_id, 'demo@charlia.app', 'admin');

insert into contacts (id, workspace_id, phone, name, email, stage, source, consent)
values
  (v_contact1, v_ws_id, '+5491100000001', 'Ana García', 'ana@example.com', 'lead', 'website', true),
  (v_contact2, v_ws_id, '+5491100000002', 'Juan López', 'juan@example.com', 'qualified', 'referral', true);

insert into conversations (id, workspace_id, contact_id, ai_enabled, status, state, last_inbound_at, window_open, last_message_at)
values
  (v_conv1, v_ws_id, v_contact1, true, 'active', 'ia_active', now() - interval '2 hours', true, now() - interval '2 hours'),
  (v_conv2, v_ws_id, v_contact2, false, 'active', 'human_active', now() - interval '25 hours', false, now() - interval '25 hours');

insert into messages (conversation_id, sender_id, sender_type, content, media_type, wamid)
values
  (v_conv1, '+5491100000001', 'contact', 'Hola, quiero información sobre sus servicios', 'text', 'wamid.mock001'),
  (v_conv1, v_ws_id::text, 'ai', 'Hola Ana! Claro, con gusto te ayudo. ¿Qué servicio te interesa?', 'text', null),
  (v_conv2, '+5491100000002', 'contact', 'Buenos días, tengo una consulta urgente', 'text', 'wamid.mock002');

insert into business_info (workspace_id, name, description, brand_tone)
values (v_ws_id, 'Demo Empresa', 'Empresa de demo para Charlia', 'profesional y amigable');

end;
$$;
*/
