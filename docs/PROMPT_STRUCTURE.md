# Prompt Structure Guide

## Recommendation: Split into Focused Prompts

The implementation prompt should be **split into smaller, focused prompts** for better AI comprehension and execution. Here's the recommended structure:

## Master Documents (Reference)

### 1. `00_PROJECT_OVERVIEW.md`

- Project overview and objectives
- Technology stack
- User roles and permissions
- High-level architecture

### 2. `01_DATABASE_SCHEMA.md`

- Complete database schema
- Table definitions with all fields
- Relationships and foreign keys
- RLS policies
- Indexes

### 3. `02_PROJECT_STRUCTURE.md`

- File/folder structure
- Component organization
- Naming conventions

## Phase-Specific Prompts (Implementation)

### Phase 1: `PHASE_1_FOUNDATION.md`

**Focus:** Project setup and authentication

- Initialize Next.js 15 project
- Supabase configuration
- TailwindCSS + shadcn/ui setup
- Database schema creation
- Authentication system

**Dependencies:** None

---

### Phase 2: `PHASE_2_MULTI_TENANCY.md`

**Focus:** Multi-tenant routing

- Subdomain detection middleware
- Customer management
- RLS policies implementation
- Dynamic routing setup

**Dependencies:** Phase 1

**References:** `01_DATABASE_SCHEMA.md`

---

### Phase 3: `PHASE_3_SECTION_SYSTEM.md`

**Focus:** Section templates and builder

- Create all section components (Hero, Features, etc.)
- Section template system
- Drag-and-drop implementation
- Section editor UI

**Dependencies:** Phase 1

**References:** `02_PROJECT_STRUCTURE.md`

---

### Phase 4: `PHASE_4_LANDING_PAGES.md`

**Focus:** Landing page CRUD and rendering

- Landing page management
- Public page renderer
- Form system implementation
- Form validation

**Dependencies:** Phase 2, Phase 3

**References:** `01_DATABASE_SCHEMA.md`, `02_PROJECT_STRUCTURE.md`

---

### Phase 5: `PHASE_5_BACKOFFICE.md`

**Focus:** Admin and customer dashboards

- Admin dashboard
- Customer dashboard
- Contact management
- Form submissions viewer

**Dependencies:** Phase 4

---

### Phase 6: `PHASE_6_SEO_AEO.md`

**Focus:** SEO and AEO optimization

- Meta tags editor
- Structured data generation
- Sitemap generation
- Robots.txt
- AEO best practices

**Dependencies:** Phase 4

---

### Phase 7: `PHASE_7_ANALYTICS.md`

**Focus:** Analytics and tracking

- Event tracking system
- Analytics dashboards
- Google Analytics integration
- PostHog integration

**Dependencies:** Phase 4

---

### Phase 8: `PHASE_8_POLISH.md`

**Focus:** Final features and optimization

- Email notifications
- Spam protection
- Performance optimization
- Testing

**Dependencies:** Phase 5, Phase 6, Phase 7

## Usage Pattern

### For AI Implementation:

1. **Start with Phase 1:**

   ```
   Read: 00_PROJECT_OVERVIEW.md
   Read: 01_DATABASE_SCHEMA.md
   Read: 02_PROJECT_STRUCTURE.md
   Implement: PHASE_1_FOUNDATION.md
   ```

2. **Continue sequentially:**

   ```
   Read: PHASE_2_MULTI_TENANCY.md
   Reference: 01_DATABASE_SCHEMA.md (as needed)
   Implement: Phase 2
   ```

3. **For each phase:**
   - Read the phase-specific prompt
   - Reference master documents as needed
   - Implement the phase
   - Test and verify

### Benefits of This Structure:

✅ **Focused Context**: Each prompt is ~200-400 lines instead of 779
✅ **Clear Dependencies**: Each phase knows what's already built
✅ **Easier Iteration**: Can refine individual phases without affecting others
✅ **Better Token Efficiency**: Only load what's needed
✅ **Reduced Confusion**: AI focuses on one task at a time
✅ **Maintainable**: Update individual phases without touching others

## Alternative: Single Prompt with Sections

If you prefer a single prompt, structure it like this:

```
# Landing Page Generator - Complete Guide

## Quick Start
[Link to Phase 1]

## Implementation Phases
1. [Phase 1: Foundation](#phase-1)
2. [Phase 2: Multi-Tenancy](#phase-2)
...

## Reference Sections
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
```

Then instruct the AI:

> "Implement Phase 1 only. Reference the Database Schema section as needed. Do not implement other phases yet."

## Recommendation

**Use the split structure** - it's more maintainable and gives better results with AI assistants.
