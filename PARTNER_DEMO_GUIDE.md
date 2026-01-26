# GovScale Alliance - Partner Demo Access Guide

## Quick Start for Partners

Your demo accounts are now ready! Here's how to access them:

## Test Account Credentials

### Account 1: Startup Stage Demo
- **Email**: `demo-startup@govscale.test`
- **Name**: Sarah Johnson
- **Profile**: Early-stage contractor just starting compliance journey
- **Readiness Score**: 35%
- **What you'll see**: 
  - Beginning of Business Structure process (2/7 milestones complete)
  - Clear next steps and guidance for obtaining certifications
  - Freemium tier features

### Account 2: Growth Stage Demo
- **Email**: `demo-growth@govscale.test`
- **Name**: Michael Chen
- **Profile**: Established contractor actively winning contracts
- **Readiness Score**: 72%
- **What you'll see**:
  - Completed Business Structure (100%)
  - Business Strategy in progress (50%)
  - 8 completed milestones showing progression
  - Growth tier features and recommendations

### Account 3: Scale Stage Demo
- **Email**: `demo-scale@govscale.test`
- **Name**: Jennifer Martinez
- **Profile**: Mature contractor with multiple IDIQ contracts
- **Readiness Score**: 88%
- **What you'll see**:
  - All processes substantially complete
  - 11 completed milestones across all frameworks
  - Advanced optimization recommendations
  - Scale tier features

## Important: Authentication Note

**GovScale Alliance uses Replit Auth**, which means your partners will need to:

1. **Create a Replit account** (free, takes 30 seconds)
2. **Sign in with Replit** when accessing the app
3. **You'll then assign them** to one of the test profiles

## Setup Steps for You (Admin)

### Step 1: Have Partners Sign Up
Send them the app link and ask them to:
1. Click "Sign In"
2. Create a Replit account (or sign in if they have one)
3. Authorize GovScale Alliance
4. Send you their email address they used

### Step 2: Find Their Replit User IDs
After they sign up, run this command in your Replit shell:

```bash
psql $DATABASE_URL -c "SELECT id, email, first_name, last_name FROM users WHERE user_type = 'contractor' ORDER BY created_at DESC LIMIT 5;"
```

This shows you the most recent signups with their Replit user IDs.

### Step 3: Assign Them to Test Profiles

**For Partner 1 (assign to Startup demo):**
```bash
psql $DATABASE_URL -c "UPDATE user_maturity_profiles SET user_id = 'THEIR_USER_ID' WHERE user_id = 'test-user-startup-001';"
psql $DATABASE_URL -c "UPDATE user_journeys SET user_id = 'THEIR_USER_ID' WHERE user_id = 'test-user-startup-001';"
```

**For Partner 2 (assign to Growth demo):**
```bash
psql $DATABASE_URL -c "UPDATE user_maturity_profiles SET user_id = 'THEIR_USER_ID' WHERE user_id = 'test-user-growth-002';"
psql $DATABASE_URL -c "UPDATE user_journeys SET user_id = 'THEIR_USER_ID' WHERE user_id = 'test-user-growth-002';"
```

**For Partner 3 (assign to Scale demo):**
```bash
psql $DATABASE_URL -c "UPDATE user_maturity_profiles SET user_id = 'THEIR_USER_ID' WHERE user_id = 'test-user-scale-003';"
psql $DATABASE_URL -c "UPDATE user_journeys SET user_id = 'THEIR_USER_ID' WHERE user_id = 'test-user-scale-003';"
```

### Step 4: Partners Refresh and Explore

After you've assigned their accounts, have them:
1. Refresh the page
2. They'll now see their assigned demo profile
3. Explore all features!

## What to Explore

Encourage your partners to check out:

### Dashboard
- Maturity stage badge and readiness score
- Progress across all three core processes
- AI-generated recommendations

### Process Guidance Pages
- **Business Structure**: Foundation, compliance, certifications
- **Business Strategy**: Market positioning, planning
- **Execution**: Capture, proposals, delivery

### Key Features
- Milestone tracking with completion status
- Stage-specific guidance and recommendations
- Progress visualization
- Clean, professional Tullis Strategic branding

## Troubleshooting

**Partner sees empty dashboard?**
- Make sure you've assigned their user ID to a test profile
- Have them refresh the page after assignment

**How do I reset a demo profile?**
```bash
# To reassign a different person to the same profile
psql $DATABASE_URL -c "UPDATE user_maturity_profiles SET user_id = 'NEW_USER_ID' WHERE user_id = 'test-user-startup-001';"
psql $DATABASE_URL -c "UPDATE user_journeys SET user_id = 'NEW_USER_ID' WHERE user_id = 'test-user-startup-001';"
```

**Need to see current test profiles?**
```bash
psql $DATABASE_URL -c "SELECT user_id, maturity_stage, readiness_score FROM user_maturity_profiles WHERE user_id LIKE 'test-user-%';"
```

## Demo Talking Points

When presenting to partners, emphasize:

✅ **Proven Frameworks**: Not guesswork - structured, proven processes  
✅ **Measurable Results**: Specific metrics and progress tracking  
✅ **Stage-Specific Guidance**: Recommendations tailored to maturity level  
✅ **Professional Platform**: Enterprise-grade, Tullis Strategic quality  

---
*Powered by Tullis Strategic Solutions LLC*
