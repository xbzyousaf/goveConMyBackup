# GovScale Alliance - Demo Setup Instructions

## Overview
This guide explains how to set up test accounts for partners to explore the GovScale Alliance platform.

## Test User Profiles

Three pre-configured test profiles are available:

### 1. Startup Stage User
- **Profile ID**: `test-user-startup-001`
- **Maturity Stage**: Startup
- **Readiness Score**: 35%
- **Progress**: Just getting started with compliance (2/7 milestones complete)
- **Subscription**: Freemium
- **Scenario**: New government contractor learning the ropes

### 2. Growth Stage User
- **Profile ID**: `test-user-growth-002`
- **Maturity Stage**: Growth
- **Readiness Score**: 72%
- **Progress**: Strong foundation, actively pursuing contracts
- **Subscription**: Growth tier
- **Scenario**: Established contractor with 2 wins, improving capture process

### 3. Scale Stage User
- **Profile ID**: `test-user-scale-003`
- **Maturity Stage**: Scale
- **Readiness Score**: 88%
- **Progress**: Advanced with multiple IDIQ contracts
- **Subscription**: Scale tier
- **Scenario**: Mature contractor optimizing operations

## Setup Process

### Step 1: Seed the Database
Run this command in the Replit shell:
```bash
psql $DATABASE_URL -f scripts/seed-test-users.sql
```

### Step 2: Have Partners Sign Up
Partners need to:
1. Visit the application URL
2. Click "Sign In" (uses Replit Auth)
3. Create a free Replit account if they don't have one
4. Authorize the application

### Step 3: Get Their Replit User IDs
After they sign up, check the database for their user IDs:
```bash
psql $DATABASE_URL -c "SELECT id FROM users ORDER BY created_at DESC LIMIT 3;"
```

### Step 4: Assign Test Profiles
For each partner, assign them to a test profile:

**Example for Partner 1 (Startup profile):**
```bash
psql $DATABASE_URL -c "UPDATE user_maturity_profiles SET user_id = 'THEIR_REPLIT_USER_ID' WHERE user_id = 'test-user-startup-001';"
psql $DATABASE_URL -c "UPDATE user_journeys SET user_id = 'THEIR_REPLIT_USER_ID' WHERE user_id = 'test-user-startup-001';"
```

**Example for Partner 2 (Growth profile):**
```bash
psql $DATABASE_URL -c "UPDATE user_maturity_profiles SET user_id = 'THEIR_REPLIT_USER_ID' WHERE user_id = 'test-user-growth-002';"
psql $DATABASE_URL -c "UPDATE user_journeys SET user_id = 'THEIR_REPLIT_USER_ID' WHERE user_id = 'test-user-growth-002';"
```

**Example for Partner 3 (Scale profile):**
```bash
psql $DATABASE_URL -c "UPDATE user_maturity_profiles SET user_id = 'THEIR_REPLIT_USER_ID' WHERE user_id = 'test-user-scale-003';"
psql $DATABASE_URL -c "UPDATE user_journeys SET user_id = 'THEIR_REPLIT_USER_ID' WHERE user_id = 'test-user-scale-003';"
```

## What Partners Will See

### Startup User Experience
- Welcome dashboard showing 35% readiness
- Business Structure process at 28% complete
- 2 completed milestones (Business Registration, EIN)
- Recommendations to obtain CAGE code and complete SAM.gov registration
- Access to foundational content and resources

### Growth User Experience
- Dashboard showing 72% readiness score
- Completed Business Structure (100%)
- Business Strategy in progress (50%)
- Execution started (25%)
- 8 completed milestones across all processes
- Recommendations to improve capture management and proposal win rates

### Scale User Experience
- Dashboard showing 88% readiness (advanced)
- All processes substantially complete
- 11 completed milestones demonstrating maturity
- Focus on optimization and scaling delivery
- Recommendations for leadership development and strategic growth

## Quick Demo Commands

**Seed all test data:**
```bash
psql $DATABASE_URL -f scripts/seed-test-users.sql
```

**Check test profiles:**
```bash
psql $DATABASE_URL -c "SELECT user_id, maturity_stage, readiness_score FROM user_maturity_profiles WHERE user_id LIKE 'test-user-%';"
```

**Reset test data:**
```bash
psql $DATABASE_URL -c "DELETE FROM user_journeys WHERE user_id LIKE 'test-user-%';"
psql $DATABASE_URL -c "DELETE FROM user_maturity_profiles WHERE user_id LIKE 'test-user-%';"
```

## Tips for Partners

When exploring the demo, partners should:
1. Check the **Dashboard** to see their maturity stage and readiness score
2. Explore **Process Guidance** pages (Business Structure, Strategy, Execution)
3. Review milestone tracking and completion status
4. See how recommendations change based on maturity stage
5. Navigate between different sections to understand the full platform

## Support

If partners encounter any issues:
- Make sure they've signed in with Replit Auth
- Verify their user ID was correctly assigned to a test profile
- Check that the database seed script ran successfully
- Refresh the page after profile assignment

---
*Powered by Tullis Strategic Solutions LLC*
