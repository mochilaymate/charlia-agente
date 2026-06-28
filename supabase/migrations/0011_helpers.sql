-- Helper to update message delivery status by wamid (stored in metadata)
CREATE OR REPLACE FUNCTION update_message_status(p_wamid TEXT, p_status TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE messages
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{status}', to_jsonb(p_status))
  WHERE metadata->>'wamid' = p_wamid;
END;
$$;
