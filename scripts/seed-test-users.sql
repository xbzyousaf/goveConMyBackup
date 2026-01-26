-- GovScale Alliance - Test User Seed Data
-- This script creates 3 test users at different maturity stages for demo purposes

-- Test User 1: Startup Stage (Early Journey)
-- User ID: test-user-startup-001
INSERT INTO user_maturity_profiles (
  user_id, 
  maturity_stage, 
  readiness_score, 
  current_focus,
  business_structure_progress,
  business_strategy_progress,
  execution_progress,
  subscription_tier,
  assessment_data,
  created_at,
  updated_at
) VALUES (
  'test-user-startup-001',
  'startup',
  35,
  'business_structure',
  28,
  0,
  0,
  'freemium',
  '{"stage": "startup", "strengths": ["Motivated team", "Clear vision"], "challenges": ["Limited compliance knowledge", "No certifications"], "recommendations": ["Complete business registration", "Obtain CAGE code", "Begin SAM.gov registration"]}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  maturity_stage = EXCLUDED.maturity_stage,
  readiness_score = EXCLUDED.readiness_score,
  updated_at = NOW();

-- Add some milestone progress for Startup user
INSERT INTO user_journeys (
  user_id,
  core_process,
  milestone_name,
  is_completed,
  completed_at,
  notes
) VALUES
  ('test-user-startup-001', 'business_structure', 'Register business entity', true, NOW() - INTERVAL '5 days', 'LLC registered in Delaware'),
  ('test-user-startup-001', 'business_structure', 'Obtain EIN', true, NOW() - INTERVAL '3 days', 'EIN obtained from IRS')
ON CONFLICT (user_id, core_process, milestone_name) DO NOTHING;

-- Test User 2: Growth Stage (Progressing Well)
-- User ID: test-user-growth-002
INSERT INTO user_maturity_profiles (
  user_id,
  maturity_stage,
  readiness_score,
  current_focus,
  business_structure_progress,
  business_strategy_progress,
  execution_progress,
  subscription_tier,
  assessment_data,
  created_at,
  updated_at
) VALUES (
  'test-user-growth-002',
  'growth',
  72,
  'business_strategy',
  100,
  50,
  25,
  'growth',
  '{"stage": "growth", "strengths": ["Strong compliance foundation", "Active SAM.gov registration", "2 contract wins"], "challenges": ["Limited capture management", "Proposal win rate below 30%"], "recommendations": ["Develop capture process", "Invest in BD tools", "Build strategic partnerships"]}'::jsonb,
  NOW() - INTERVAL '90 days',
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  maturity_stage = EXCLUDED.maturity_stage,
  readiness_score = EXCLUDED.readiness_score,
  updated_at = NOW();

-- Add milestone progress for Growth user
INSERT INTO user_journeys (
  user_id,
  core_process,
  milestone_name,
  is_completed,
  completed_at,
  notes
) VALUES
  ('test-user-growth-002', 'business_structure', 'Register business entity', true, NOW() - INTERVAL '200 days', 'LLC registered'),
  ('test-user-growth-002', 'business_structure', 'Obtain EIN', true, NOW() - INTERVAL '195 days', 'EIN obtained'),
  ('test-user-growth-002', 'business_structure', 'Complete SAM.gov registration', true, NOW() - INTERVAL '180 days', 'Active SAM registration'),
  ('test-user-growth-002', 'business_structure', 'Obtain CAGE code', true, NOW() - INTERVAL '180 days', 'CAGE code active'),
  ('test-user-growth-002', 'business_structure', 'Open dedicated business bank account', true, NOW() - INTERVAL '190 days', 'Business checking opened'),
  ('test-user-growth-002', 'business_strategy', 'Define target market and agencies', true, NOW() - INTERVAL '120 days', 'Focused on DoD and DHS contracts'),
  ('test-user-growth-002', 'business_strategy', 'Develop capability statement', true, NOW() - INTERVAL '100 days', 'Professional capability statement created'),
  ('test-user-growth-002', 'execution', 'Set up opportunity tracking system', true, NOW() - INTERVAL '60 days', 'Using GovWin for tracking')
ON CONFLICT (user_id, core_process, milestone_name) DO NOTHING;

-- Test User 3: Scale Stage (Advanced Journey)
-- User ID: test-user-scale-003
INSERT INTO user_maturity_profiles (
  user_id,
  maturity_stage,
  readiness_score,
  current_focus,
  business_structure_progress,
  business_strategy_progress,
  execution_progress,
  subscription_tier,
  assessment_data,
  created_at,
  updated_at
) VALUES (
  'test-user-scale-003',
  'scale',
  88,
  'execution',
  100,
  100,
  75,
  'scale',
  '{"stage": "scale", "strengths": ["Multiple IDIQ contracts", "Strong past performance", "Established teaming relationships", "50% proposal win rate"], "challenges": ["Scaling delivery teams", "Managing multiple contracts simultaneously"], "recommendations": ["Implement robust project management", "Develop leadership pipeline", "Consider strategic acquisitions"]}'::jsonb,
  NOW() - INTERVAL '365 days',
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  maturity_stage = EXCLUDED.maturity_stage,
  readiness_score = EXCLUDED.readiness_score,
  updated_at = NOW();

-- Add extensive milestone progress for Scale user
INSERT INTO user_journeys (
  user_id,
  core_process,
  milestone_name,
  is_completed,
  completed_at,
  notes
) VALUES
  ('test-user-scale-003', 'business_structure', 'Register business entity', true, NOW() - INTERVAL '400 days', 'S-Corp registered'),
  ('test-user-scale-003', 'business_structure', 'Obtain EIN', true, NOW() - INTERVAL '395 days', 'EIN obtained'),
  ('test-user-scale-003', 'business_structure', 'Complete SAM.gov registration', true, NOW() - INTERVAL '380 days', 'Active SAM registration'),
  ('test-user-scale-003', 'business_structure', 'Obtain CAGE code', true, NOW() - INTERVAL '380 days', 'CAGE code active'),
  ('test-user-scale-003', 'business_strategy', 'Define target market and agencies', true, NOW() - INTERVAL '350 days', 'Multi-agency strategy'),
  ('test-user-scale-003', 'business_strategy', 'Develop capability statement', true, NOW() - INTERVAL '340 days', 'Updated quarterly'),
  ('test-user-scale-003', 'business_strategy', 'Create competitive analysis', true, NOW() - INTERVAL '320 days', 'Ongoing competitive intel'),
  ('test-user-scale-003', 'execution', 'Set up opportunity tracking system', true, NOW() - INTERVAL '300 days', 'Enterprise CRM in place'),
  ('test-user-scale-003', 'execution', 'Develop proposal library', true, NOW() - INTERVAL '280 days', 'Extensive past performance library'),
  ('test-user-scale-003', 'execution', 'Build capture management process', true, NOW() - INTERVAL '250 days', 'Formal capture process established'),
  ('test-user-scale-003', 'execution', 'Establish contract management system', true, NOW() - INTERVAL '200 days', 'Using Deltek for contract mgmt')
ON CONFLICT (user_id, core_process, milestone_name) DO NOTHING;

-- Display summary
SELECT 
  user_id,
  maturity_stage,
  readiness_score,
  business_structure_progress,
  business_strategy_progress,
  execution_progress,
  subscription_tier
FROM user_maturity_profiles
WHERE user_id IN ('test-user-startup-001', 'test-user-growth-002', 'test-user-scale-003')
ORDER BY readiness_score;
