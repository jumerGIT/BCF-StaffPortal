-- Optional: auto-log time_entry changes via database trigger
-- Alternative to calling writeAuditLog() in every Route Handler

CREATE OR REPLACE FUNCTION log_time_entry_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    id, entity_type, entity_id, changed_by, changed_by_role,
    action, old_value, new_value, created_at
  ) VALUES (
    gen_random_uuid(),
    'time_entry',
    NEW.id,
    NEW.entered_by,
    (SELECT role::text::audit_role FROM profiles WHERE id = NEW.entered_by),
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER time_entry_audit
AFTER INSERT OR UPDATE ON time_entries
FOR EACH ROW EXECUTE FUNCTION log_time_entry_changes();
