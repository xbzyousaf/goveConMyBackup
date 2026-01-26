# GovScale Alliance - AI-Powered Growth Platform

## Overview

GovScale Alliance is a professional, enterprise-grade AI-driven platform designed to guide government contractors from startup to scale. It assesses user maturity, provides proven guidance through core business processes (Business Structure, Strategy, Execution), and delivers a corporate-polished user experience emphasizing measurable outcomes and data-driven insights. The platform aims to accelerate business development for government contractors through proven frameworks and expert guidance.

## Recent Changes (November 2025)

**Completed Features:**
- ✅ AI-powered maturity assessment chatbot with JSON parsing, validation, and error handling
- ✅ Personalized dashboard showing maturity stage, readiness score, and process progress
- ✅ **All Three Process Guidance Pages** (Business Structure, Strategy, Execution) with milestone tracking
- ✅ Dynamic process guidance system with stage-specific milestones (4-9 per process/stage)
- ✅ Complete user flow: Assessment → Profile Creation → Dashboard → Process Guidance
- ✅ Stage validation system that auto-remediates legacy data (fixes "foundation" → correct stage)
- ✅ Real-time progress synchronization between journeys and maturity profiles
- ✅ Independent progress tracking across all three core processes
- ✅ **Rebranded to match Tullis Strategic corporate aesthetic**
- ✅ Professional blue color scheme (215° 85% 50%) with enterprise polish
- ✅ Results-driven messaging emphasizing proven performance and measurable outcomes
- ✅ Corporate-focused design guidelines with clean, professional styling
- ✅ **Custom Email/Password Authentication System (PRODUCTION-READY)**
  - Email/password signup with bcrypt password hashing (10 salt rounds)
  - Email verification using 32-byte random tokens with 24-hour expiry
  - SendGrid integration for verification and welcome emails
  - Session-based authentication with PostgreSQL session storage (independent of Replit Auth)
  - Complete signup flow: Signup → Email Verification → Login → Dashboard
  - Secure password requirements (minimum 8 characters, client-side validation)
  - **Removed Replit Auth dependency** - app now works independently on any platform
  - Demo accounts available: demo-startup@govscale.test, demo-growth@govscale.test, demo-scale@govscale.test (password: Demo2025!)

**Latest Fix (November 12, 2025):**
- ✅ Added Header navigation component to Dashboard with profile dropdown menu and logout button
- ✅ Fixed logout endpoint to use `/api/auth/logout` (POST request)
- ✅ Users can now logout by clicking profile icon → "Log out"

**Deferred for Later:**
- Stripe subscription implementation (schema fields prepared, integration installed but not activated)
- Enhanced password security (backend strength validation, complexity requirements)
- Authentication rate limiting and brute-force protection

## User Preferences

Preferred communication style: Simple, everyday language.
Design aesthetic: Match Tullis Strategic Solutions (tullisstrategic.com) - corporate, professional, results-driven with proven performance messaging.
Stripe integration: Deferred until after MVP completion.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI**: shadcn/ui (Radix UI based), Tailwind CSS with custom design tokens, professional government contractor aesthetic, custom color palette (Primary Blue), Inter font, dark mode support.
- **State Management**: TanStack Query for server state; local React state for UI.

### Backend

- **Framework**: Express.js (Node.js) with TypeScript.
- **API**: RESTful architecture (`/api/*` routes).
- **Authentication**: 
  - **Custom Email/Password Auth**: bcrypt password hashing (10 salt rounds), email verification tokens, session-based authentication
  - **Session Management**: PostgreSQL-backed session storage (`connect-pg-simple`, `server/session.ts`)
  - **Session Security**: Secure cookies in production (HTTPS), sameSite: 'lax', httpOnly, 7-day expiry
  - **Routes**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/verify-email`, `/api/auth/logout`, `/api/auth/current-user`
  - **Middleware**: Custom `isAuthenticated` middleware validates `req.session.userId`
- **Core Platform APIs**: Handles user authentication, AI assessments, user maturity profiles, and personalized dashboard data.
- **Content & Learning APIs**: Manages content library browsing, item retrieval, user activity tracking, and journey milestones.
- **Vendor Ecosystem APIs**: Facilitates vendor listing, profiling, AI vetting, service requests, AI matching, and analytics.

### Data Storage

- **Database**: PostgreSQL via Neon Serverless, Drizzle ORM for type-safe queries.
- **Schema Design**:
    - `users`: Stores user data with support for both custom auth (email/password) and Replit Auth. Includes email verification fields (`isEmailVerified`, `emailVerificationToken`, `emailVerificationExpiry`) and password reset tokens.
    - `user_maturity_profiles`: Tracks maturity stage, readiness score, process progress, and subscription tier.
    - `assessments`: Historical AI assessment records with conversation history and recommendations.
    - `user_journeys`: Monitors milestone completion across core processes (stores `completedMilestones` array and `progressPercentage`).
    - `user_content_activity`: Records engagement with learning content.
    - `content_library`: Stores educational resources with access controls.
    - `vendor_profiles`: Manages vendor information, journey stage, and analytics.
    - `service_requests`: Links users to vendors with status tracking.
    - `messages`, `reviews`, `transactions`: Support in-app communication, feedback, and payment processing.
    - `sessions`: Stores Express session data for both custom auth and Replit Auth.
- **Enums**: Defines types for user roles, maturity stages, core processes, content types, subscription tiers, vendor journey stages, service request statuses, and service categories.

### Core Platform Features

- **AI-Powered Maturity Assessment**: Conversational chatbot using OpenAI to assess readiness, assign maturity stage, and provide personalized recommendations.
- **Three Core Process Frameworks**: Guides users through Business Structure, Business Strategy, and Execution with milestones and content.
- **Personalized Dashboard**: Displays maturity stage, progress, recommendations, and relevant content/vendors.
- **Smart Vendor Matching**: AI-driven system matching users to vetted vendors based on maturity, service needs, and budget.
- **Searchable Learning Hub**: Content library filtered by process, maturity stage, and subscription tier, with engagement tracking.

### Subscription & Monetization

- **User Tiers**: Freemium, Startup, Growth, Scale with varying access levels.
- **Vendor Tiers**: Basic, Professional, Enterprise for profile visibility, leads, and analytics.
- **Monetization**: Primarily SaaS subscription fees; future consideration for lead credit and revenue share models.

## External Dependencies

- **Authentication**: Custom email/password system with bcrypt (bcryptjs package)
- **Database**: Neon Serverless PostgreSQL.
- **AI Services**: OpenAI API for assessments, vendor vetting, and smart matching (using `gpt-4o-mini`).
- **Email Communications**: SendGrid (`@sendgrid/mail`) for email verification, welcome emails, and notifications.
- **Payment Processing**: Stripe for subscription management and payments (integration installed but not activated).
- **Development Tools**: ESbuild for server bundling.