-- ============================================================
-- WE UNITED — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- Fixed UUIDs for consistent cross-table references
do $$
declare
  chapter_id   uuid := 'a1000000-0000-0000-0000-000000000001';
  member1_id   uuid := 'b1000000-0000-0000-0000-000000000001';
  member2_id   uuid := 'b1000000-0000-0000-0000-000000000002';
  member3_id   uuid := 'b1000000-0000-0000-0000-000000000003';
  meeting1_id  uuid := 'c1000000-0000-0000-0000-000000000001';
  meeting2_id  uuid := 'c1000000-0000-0000-0000-000000000002';
begin

  -- ── Step 1: Create auth.users rows first (required by profiles FK) ──
  insert into auth.users (
    id, instance_id, aud, role,
    email, email_confirmed_at,
    encrypted_password,
    raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values
    (
      member1_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'priya@nexorademo.in', now(),
      '$2a$10$PgjZCqJJJo3M9GQKioApwORjAMeGJQJl2c2U9SKvmb0.hpWF6WWZK',
      '{"full_name":"Priya Krishnamurthy"}',
      now(), now(), '', '', '', ''
    ),
    (
      member2_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'arjun@nexorademo.in', now(),
      '$2a$10$PgjZCqJJJo3M9GQKioApwORjAMeGJQJl2c2U9SKvmb0.hpWF6WWZK',
      '{"full_name":"Arjun Mehta"}',
      now(), now(), '', '', '', ''
    ),
    (
      member3_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'sunita@nexorademo.in', now(),
      '$2a$10$PgjZCqJJJo3M9GQKioApwORjAMeGJQJl2c2U9SKvmb0.hpWF6WWZK',
      '{"full_name":"Sunita Rao"}',
      now(), now(), '', '', '', ''
    )
  on conflict (id) do nothing;


  -- ── Step 2: Chapter ──
  insert into chapters (id, name, location, city, state, meeting_day, meeting_time, meeting_venue, description)
  values (
    chapter_id,
    'We United - Chennai',
    'Anna Nagar', 'Chennai', 'Tamil Nadu',
    'Tuesday', '07:00:00',
    'Hotel Residency Towers, T.T.K. Road, Chennai',
    'One of Chennai''s most active We United chapters with 30+ members across diverse industries.'
  )
  on conflict (id) do nothing;


  -- ── Step 3: Profiles ──
  -- The handle_new_user() trigger auto-creates a basic profile row on auth.users insert.
  -- We upsert here to fill in the full business details.
  insert into profiles (id, full_name, email, phone, role, chapter_id, business_name, business_category, business_tagline, bio)
  values
    (
      member1_id, 'Priya Krishnamurthy', 'priya@nexorademo.in', '+91 98400 11111',
      'chapter_admin', chapter_id,
      'Priya Designs Studio', 'Interior Design',
      'Transforming spaces, transforming lives',
      'Award-winning interior designer with 12 years of experience in residential and commercial projects.'
    ),
    (
      member2_id, 'Arjun Mehta', 'arjun@nexorademo.in', '+91 98400 22222',
      'member', chapter_id,
      'Mehta Financial Services', 'Finance',
      'Your wealth, our priority',
      'Certified financial planner helping businesses and individuals achieve their financial goals.'
    ),
    (
      member3_id, 'Sunita Rao', 'sunita@nexorademo.in', '+91 98400 33333',
      'member', chapter_id,
      'HealthFirst Clinic', 'Healthcare',
      'Compassionate care, expert treatment',
      'MBBS, MD — General Physician with 8 years of clinical experience.'
    )
  on conflict (id) do update set
    full_name         = excluded.full_name,
    phone             = excluded.phone,
    role              = excluded.role,
    chapter_id        = excluded.chapter_id,
    business_name     = excluded.business_name,
    business_category = excluded.business_category,
    business_tagline  = excluded.business_tagline,
    bio               = excluded.bio;

  -- Set chapter admin
  update chapters set chapter_admin_id = member1_id where id = chapter_id;


  -- ── Step 4: Referrals ──
  insert into referrals (sender_id, receiver_id, referred_person_name, referred_person_contact, business_category, description, estimated_value, actual_value, status, chapter_id)
  values
    (member2_id, member1_id, 'Ravi Kumar',     '+91 98765 10001', 'Interior Design',
     'Client looking to renovate their 3BHK apartment in Adyar. Budget ₹15L.',        1500000, 0,     'pending',   chapter_id),
    (member1_id, member2_id, 'Shalini Venkat', '+91 98765 10002', 'Finance',
     'Business owner needs investment planning for ₹50L surplus funds.',                50000,  0,     'accepted',  chapter_id),
    (member3_id, member2_id, 'Mohan Das',      '+91 98765 10003', 'Finance',
     'Patient referred for tax-saving mutual fund advice.',                              25000,  0,     'accepted',  chapter_id),
    (member2_id, member3_id, 'Ananya Suresh',  '+91 98765 10004', 'Healthcare',
     'Client needs a reliable GP for corporate health check-up package.',               80000,  80000, 'completed', chapter_id),
    (member1_id, member3_id, 'Prakash Nair',   '+91 98765 10005', 'Healthcare',
     'Colleague looking for a trusted physician for annual health check.',               15000,  0,     'rejected',  chapter_id)
  on conflict do nothing;


  -- ── Step 5: Meetings ──
  insert into meetings (id, chapter_id, title, meeting_date, start_time, end_time, venue, agenda, status, created_by)
  values
    (
      meeting1_id, chapter_id,
      'Weekly Chapter Meeting #47',
      current_date - interval '7 days',
      '07:00:00', '09:00:00',
      'Hotel Residency Towers, T.T.K. Road, Chennai',
      E'1. Member introductions (60 seconds each)\n2. Education slot: Arjun Mehta on "Tax Saving Strategies Q4"\n3. Open networking referrals\n4. Visitor introductions\n5. Announcements',
      'completed', member1_id
    ),
    (
      meeting2_id, chapter_id,
      'Weekly Chapter Meeting #48',
      current_date + interval '7 days',
      '07:00:00', '09:00:00',
      'Hotel Residency Towers, T.T.K. Road, Chennai',
      E'1. Member introductions (60 seconds each)\n2. Education slot: Sunita Rao on "Preventive Health for Entrepreneurs"\n3. Open networking referrals\n4. Visitor introductions\n5. Q4 chapter goals review',
      'scheduled', member1_id
    )
  on conflict (id) do nothing;


  -- ── Step 6: Attendance ──
  insert into attendance (meeting_id, user_id, status, marked_by)
  values
    (meeting1_id, member1_id, 'present', member1_id),
    (meeting1_id, member2_id, 'present', member1_id),
    (meeting1_id, member3_id, 'absent',  member1_id)
  on conflict do nothing;

end $$;

-- ============================================================
-- SEED COMPLETE ✓
--   1 chapter (We United - Chennai) · 3 auth users · 3 member profiles
--   5 referrals · 2 meetings · 3 attendance records
-- Demo passwords for all 3 users: Demo@1234
-- ============================================================
