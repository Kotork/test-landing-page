# Implementation Prompts - Usage Guide

## Quick Start

**👉 See [`HOW_TO_USE.md`](./HOW_TO_USE.md) for detailed instructions on using these prompts with AI tools.**

## Overview

This directory contains split implementation prompts for building the Landing Page Generator application. The prompts are organized into master reference documents and phase-specific implementation guides.

## Structure

### Master Documents (Reference)

These documents provide foundational information that should be referenced throughout implementation:

1. **`00_PROJECT_OVERVIEW.md`**

   - Project objectives and goals
   - Technology stack
   - User roles and permissions
   - Key features overview
   - Implementation phases summary

2. **`01_DATABASE_SCHEMA.md`**

   - Complete database schema
   - All table definitions
   - Relationships and foreign keys
   - Indexes
   - RLS policies

3. **`02_PROJECT_STRUCTURE.md`**
   - File and folder organization
   - Component structure
   - Naming conventions
   - Route groups

### Phase-Specific Prompts (Implementation)

These are focused prompts for implementing specific phases:

1. **`PHASE_1_FOUNDATION.md`** - Project setup, Supabase, Auth
2. **`PHASE_2_MULTI_TENANCY.md`** - Subdomain routing, RLS (Coming soon)
3. **`PHASE_3_SECTION_SYSTEM.md`** - Section templates, Builder (Coming soon)
4. **`PHASE_4_LANDING_PAGES.md`** - CRUD, Renderer, Forms (Coming soon)
5. **`PHASE_5_BACKOFFICE.md`** - Admin & Customer dashboards (Coming soon)
6. **`PHASE_6_SEO_AEO.md`** - SEO/AEO optimization (Coming soon)
7. **`PHASE_7_ANALYTICS.md`** - Analytics tracking (Coming soon)
8. **`PHASE_8_POLISH.md`** - Email, Spam protection, Optimization (Coming soon)

## How to Use

### For AI Implementation

**Step 1: Start with Phase 1**

```
Read these files in order:
1. 00_PROJECT_OVERVIEW.md (context)
2. 01_DATABASE_SCHEMA.md (reference)
3. 02_PROJECT_STRUCTURE.md (reference)
4. PHASE_1_FOUNDATION.md (implement)
```

**Step 2: Continue Sequentially**

```
For each phase:
1. Read the phase-specific prompt (e.g., PHASE_2_MULTI_TENANCY.md)
2. Reference master documents as needed
3. Implement the phase
4. Test and verify
5. Move to next phase
```

### Example Prompt for AI

```
I want to implement Phase 1 of the Landing Page Generator project.

Please read:
- docs/prompts/00_PROJECT_OVERVIEW.md
- docs/prompts/01_DATABASE_SCHEMA.md
- docs/prompts/02_PROJECT_STRUCTURE.md
- docs/prompts/PHASE_1_FOUNDATION.md

Then implement Phase 1 according to the instructions. Reference the master documents as needed for context.
```

### For Human Developers

1. **Read the overview first** (`00_PROJECT_OVERVIEW.md`)
2. **Familiarize yourself with the schema** (`01_DATABASE_SCHEMA.md`)
3. **Understand the structure** (`02_PROJECT_STRUCTURE.md`)
4. **Follow phases sequentially** (PHASE_1, PHASE_2, etc.)

## Benefits of Split Structure

✅ **Focused Context**: Each prompt is 200-400 lines instead of 779
✅ **Clear Dependencies**: Each phase knows what's already built
✅ **Easier Iteration**: Refine individual phases without affecting others
✅ **Better Token Efficiency**: Only load what's needed
✅ **Reduced Confusion**: Focus on one task at a time
✅ **Maintainable**: Update individual phases independently

## Dependencies

Each phase builds on previous phases:

```
Phase 1 (Foundation)
    ↓
Phase 2 (Multi-Tenancy)
    ↓
Phase 3 (Section System)
    ↓
Phase 4 (Landing Pages)
    ↓
Phase 5 (Backoffice)
    ↓
Phase 6 (SEO/AEO)
    ↓
Phase 7 (Analytics)
    ↓
Phase 8 (Polish)
```

## Notes

- Always reference master documents when implementing
- Don't skip phases - they build on each other
- Test each phase before moving to the next
- Update types as you add new features
- Keep security and performance in mind throughout

## Questions?

If you need clarification on any phase or concept, refer back to the master documents or the main `IMPLEMENTATION_PROMPT.md` file in the parent directory.
