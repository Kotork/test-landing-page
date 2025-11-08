# Quick Start - Copy-Paste Prompts

## For Phase 1 (Start Here)

Copy this entire prompt and paste it to your AI:

---

```
I want to implement Phase 1: Foundation of the Landing Page Generator project.

Please read these documents in order:
1. docs/prompts/00_PROJECT_OVERVIEW.md - for project context
2. docs/prompts/01_DATABASE_SCHEMA.md - for database structure reference
3. docs/prompts/02_PROJECT_STRUCTURE.md - for file organization
4. docs/prompts/PHASE_1_FOUNDATION.md - for implementation instructions

Then implement Phase 1 according to the instructions in PHASE_1_FOUNDATION.md.

IMPORTANT:
- The Next.js project already exists, so verify existing setup before creating new files
- Check if files/directories exist before creating them
- Only implement Phase 1 - do NOT proceed to other phases yet
- Reference the master documents (00, 01, 02) as needed for context

After Phase 1 is complete, I'll provide Phase 2 instructions.
```

---

## For Subsequent Phases

After each phase completes, use this template (replace [N] and [NAME]):

---

```
Phase [N-1] is complete. Now implement Phase [N]: [Phase Name]

Please read:
- docs/prompts/PHASE_[N]_[NAME].md
- Reference docs/prompts/00_PROJECT_OVERVIEW.md, 01_DATABASE_SCHEMA.md, and 02_PROJECT_STRUCTURE.md as needed

Implement Phase [N] according to the instructions.

Only implement Phase [N]. Do not proceed to other phases.
```

---

## Example: Phase 2

```
Phase 1 is complete. Now implement Phase 2: Multi-Tenancy.

Please read:
- docs/prompts/PHASE_2_MULTI_TENANCY.md
- Reference docs/prompts/00_PROJECT_OVERVIEW.md, 01_DATABASE_SCHEMA.md, and 02_PROJECT_STRUCTURE.md as needed

Implement Phase 2 according to the instructions.

Only implement Phase 2. Do not proceed to other phases.
```

---

## If AI Can't Read Files

If your AI tool cannot read files directly, copy the content of each document and paste it into your prompt:

```
I want to implement Phase 1. Here are the instructions:

[Paste content from 00_PROJECT_OVERVIEW.md]

[Paste content from 01_DATABASE_SCHEMA.md]

[Paste content from 02_PROJECT_STRUCTURE.md]

[Paste content from PHASE_1_FOUNDATION.md]

Please implement Phase 1 according to these instructions. The project already exists.
```

---

## Tips

- ✅ Always include all 4 documents (00, 01, 02, and the phase document)
- ✅ Always specify "only implement Phase X"
- ✅ Always mention "project already exists"
- ✅ Verify each phase before moving to the next

For more detailed instructions, see [HOW_TO_USE.md](./HOW_TO_USE.md)



