-- Afshaar CRM — Seed Data
-- Password for admin account: Safi@12345! (change immediately after first login)
-- Hash generated with bcrypt cost 12

INSERT INTO admins (username, email, full_name, password_hash, role)
VALUES (
  'admin',
  'admin@afshaar.com',
  'System Administrator',
  '$2b$12$C29IPc51BEVfVotV5nwAVOBKmTzy8fL6W7jXhTEI1qGvujHjH3lAu',
  'super_admin'
)
ON CONFLICT (username) DO NOTHING;

-- Note: Generate a new hash with:
-- node -e "const b=require('bcryptjs'); b.hash('YourPassword',12).then(console.log)"

-- Test vendors (various statuses for UI development)
INSERT INTO vendors (store_name, owner_name, email, phone, business_type, status)
VALUES
  ('Kicks & More', 'Ahmad Karimi', 'ahmad@kicks.af', '+93700000001', 'individual', 'pending'),
  ('Shoe Palace AF', 'Fatima Safi', 'fatima@shoepalace.af', '+93700000002', 'company', 'pending'),
  ('Sole Culture', 'Yusuf Rahimi', 'yusuf@soleculture.af', '+93700000003', 'individual', 'pending')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vendors (store_name, owner_name, email, phone, business_type, status, confirmed_by, confirmed_at)
VALUES (
  'Step Up Store', 'Omar Barakzai', 'omar@stepup.af', '+93700000004', 'company', 'active',
  (SELECT id FROM admins WHERE username = 'admin'),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO vendors (store_name, owner_name, email, phone, business_type, status)
VALUES
  ('Sole Traders', 'Zarghuna Yusuf', 'zarghuna@soletraders.af', '+93700000005', 'company', 'disabled'),
  ('Mountain Kicks', 'Hamid Ahmadi', 'hamid@mountainkicks.af', '+93700000006', 'individual', 'rejected')
ON CONFLICT (email) DO NOTHING;

UPDATE vendors
SET rejection_reason = 'Incomplete business documentation provided.'
WHERE email = 'hamid@mountainkicks.af';
