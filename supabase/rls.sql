-- Run this in the Supabase SQL editor after running drizzle-kit migrate

-- Enable RLS on all tables
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_phases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vans            ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role from profiles
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (get_my_role() = 'admin');

-- ── Jobs ──────────────────────────────────────────────────────────────────────
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "jobs_write" ON jobs FOR ALL USING (get_my_role() IN ('manager', 'admin'));

-- ── Job Assignments ───────────────────────────────────────────────────────────
CREATE POLICY "assignments_select" ON job_assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "assignments_write" ON job_assignments FOR ALL
  USING (get_my_role() IN ('manager', 'admin'));

-- ── Job Phases ────────────────────────────────────────────────────────────────
CREATE POLICY "phases_select" ON job_phases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "phases_write" ON job_phases FOR UPDATE
  USING (get_my_role() IN ('site_head', 'manager', 'admin'));

-- ── Time Entries ──────────────────────────────────────────────────────────────
CREATE POLICY "time_entries_select_own" ON time_entries FOR SELECT
  USING (user_id = auth.uid() OR get_my_role() IN ('site_head', 'manager', 'admin'));
CREATE POLICY "time_entries_insert_own" ON time_entries FOR INSERT
  WITH CHECK (entered_by = auth.uid());
CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE
  USING (
    (user_id = auth.uid() AND status = 'pending') OR
    get_my_role() IN ('site_head', 'manager', 'admin')
  );

-- ── Audit Logs ────────────────────────────────────────────────────────────────
CREATE POLICY "audit_select" ON audit_logs FOR SELECT
  USING (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT
  WITH CHECK (changed_by = auth.uid());

-- ── Vans ──────────────────────────────────────────────────────────────────────
CREATE POLICY "vans_select" ON vans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "vans_write" ON vans FOR ALL USING (get_my_role() IN ('manager', 'admin'));

-- ── Enable Realtime for job_phases ────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE job_phases;
