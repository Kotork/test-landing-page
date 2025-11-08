# How to Use These Prompts with AI

## Quick Start Guide

This guide explains how to use the split prompt documents to get an AI to implement the Landing Page Generator project.

## Method 1: Phase-by-Phase Implementation (Recommended)

This is the most effective approach - implement one phase at a time.

### Step 1: Start with Phase 1

**Copy and paste this prompt to your AI:**

```
I want to implement Phase 1 of the Landing Page Generator project.

Please read these documents in order:
1. docs/prompts/00_PROJECT_OVERVIEW.md - for project context
2. docs/prompts/01_DATABASE_SCHEMA.md - for database structure reference
3. docs/prompts/02_PROJECT_STRUCTURE.md - for file organization
4. docs/prompts/PHASE_1_FOUNDATION.md - for implementation instructions

Then implement Phase 1 according to the instructions. The project already exists, so verify existing setup before creating new files. Reference the master documents as needed for context.

Important: Only implement Phase 1. Do not proceed to other phases yet.
```

### Step 2: After Phase 1 is Complete

**For Phase 2, use this prompt:**

```
Phase 1 is complete. Now implement Phase 2: Multi-Tenancy.

Please read:
- docs/prompts/PHASE_2_MULTI_TENANCY.md (when available)
- Reference docs/prompts/00_PROJECT_OVERVIEW.md and 01_DATABASE_SCHEMA.md as needed

Implement Phase 2 according to the instructions.
```

**Continue this pattern for each phase.**

## Method 2: Single Comprehensive Prompt

If you want to provide all context at once (for AI with large context windows):

```
I want to build a Landing Page Generator application. Please read all these documents:

1. docs/prompts/00_PROJECT_OVERVIEW.md
2. docs/prompts/01_DATABASE_SCHEMA.md
3. docs/prompts/02_PROJECT_STRUCTURE.md
4. docs/prompts/PHASE_1_FOUNDATION.md

Then implement Phase 1 only. The project already exists, so check for existing files before creating new ones.

After Phase 1, I'll provide Phase 2 instructions.
```

## Method 3: Using File Paths Directly

If your AI can read files directly, you can reference them:

```
Read the following files and implement Phase 1:
- docs/prompts/00_PROJECT_OVERVIEW.md
- docs/prompts/01_DATABASE_SCHEMA.md
- docs/prompts/02_PROJECT_STRUCTURE.md
- docs/prompts/PHASE_1_FOUNDATION.md

Implement according to PHASE_1_FOUNDATION.md instructions.
```

## Method 4: Copy-Paste Content (For AI Without File Access)

If the AI cannot read files, copy the content directly:

1. Open each document
2. Copy the entire content
3. Paste into your prompt like this:

```
I want to implement Phase 1 of a Landing Page Generator. Here are the instructions:

[Paste 00_PROJECT_OVERVIEW.md content]

[Paste 01_DATABASE_SCHEMA.md content]

[Paste 02_PROJECT_STRUCTURE.md content]

[Paste PHASE_1_FOUNDATION.md content]

Please implement Phase 1 according to these instructions. The project already exists.
```

## Best Practices

### 1. Always Include Context

Always provide the master documents (00, 01, 02) along with the phase-specific prompt. This gives the AI full context.

### 2. Be Explicit About Scope

Always specify which phase to implement. Say "implement Phase 1 only" to prevent the AI from jumping ahead.

### 3. Mention Existing Project

Always mention that the project already exists so the AI checks for existing files before creating new ones.

### 4. Reference Documents

When asking questions or making changes, reference specific documents:
- "According to 01_DATABASE_SCHEMA.md, the users table should..."
- "Following 02_PROJECT_STRUCTURE.md, create the file at..."

### 5. Verify After Each Phase

After each phase, verify the implementation before moving to the next phase.

## Example Conversation Flow

### Initial Prompt:
```
I want to implement Phase 1 of the Landing Page Generator project.

Please read:
- docs/prompts/00_PROJECT_OVERVIEW.md
- docs/prompts/01_DATABASE_SCHEMA.md
- docs/prompts/02_PROJECT_STRUCTURE.md
- docs/prompts/PHASE_1_FOUNDATION.md

Then implement Phase 1. The project already exists, so verify existing setup first.
```

### After Phase 1 Complete:
```
Phase 1 is done. Now implement Phase 2.

Please read:
- docs/prompts/PHASE_2_MULTI_TENANCY.md
- Reference 00_PROJECT_OVERVIEW.md and 01_DATABASE_SCHEMA.md as needed

Implement Phase 2 according to instructions.
```

### If AI Asks Questions:
```
According to 01_DATABASE_SCHEMA.md, the users table has these fields: id, email, role, customer_id.

According to 02_PROJECT_STRUCTURE.md, create the file at lib/supabase/client.ts.
```

## Troubleshooting

### AI Tries to Implement Multiple Phases

**Solution:** Be more explicit:
```
ONLY implement Phase 1. Do NOT implement Phase 2, Phase 3, or any other phases. Stop after Phase 1 is complete.
```

### AI Creates Files in Wrong Locations

**Solution:** Reference the structure document:
```
According to 02_PROJECT_STRUCTURE.md, the file should be at lib/supabase/client.ts, not lib/client.ts.
```

### AI Doesn't Check for Existing Files

**Solution:** Remind it:
```
Remember: The project already exists. Check if files exist before creating them. Use "Create or update" approach.
```

### AI Asks About Missing Information

**Solution:** Point to the reference documents:
```
The database schema is in 01_DATABASE_SCHEMA.md. The project structure is in 02_PROJECT_STRUCTURE.md.
```

## Using with Different AI Tools

### ChatGPT / Claude / Gemini

1. Copy the prompt from Method 1 or 2
2. Paste into the chat
3. If files aren't accessible, use Method 4 (copy-paste content)

### Cursor / GitHub Copilot

1. These can read files directly
2. Use Method 3 (file paths)
3. Or reference files in comments:
   ```typescript
   // See docs/prompts/PHASE_1_FOUNDATION.md for implementation details
   ```

### VS Code with AI Extensions

1. Open the prompt document
2. Select "Use as context" or similar option
3. Ask: "Implement Phase 1 according to this document"

## Template Prompts

### Phase 1 Template:
```
Implement Phase 1: Foundation

Read these documents:
- docs/prompts/00_PROJECT_OVERVIEW.md
- docs/prompts/01_DATABASE_SCHEMA.md
- docs/prompts/02_PROJECT_STRUCTURE.md
- docs/prompts/PHASE_1_FOUNDATION.md

The project already exists. Verify setup, then implement according to PHASE_1_FOUNDATION.md.

Only implement Phase 1. Do not proceed to other phases.
```

### Subsequent Phases Template:
```
Phase [N-1] is complete. Now implement Phase [N]: [Phase Name]

Read:
- docs/prompts/PHASE_[N]_[NAME].md
- Reference 00_PROJECT_OVERVIEW.md, 01_DATABASE_SCHEMA.md, 02_PROJECT_STRUCTURE.md as needed

Implement according to instructions.
```

## Tips for Best Results

1. **Start Small**: Implement one phase at a time
2. **Verify**: Check each phase before moving forward
3. **Be Specific**: Always mention which phase to implement
4. **Provide Context**: Always include master documents
5. **Iterate**: Don't hesitate to ask for clarifications or corrections
6. **Reference**: When asking questions, reference specific documents

## Next Steps

1. Start with Phase 1 using the template above
2. Verify Phase 1 implementation
3. Move to Phase 2 when ready
4. Continue sequentially through all phases

Remember: The split structure is designed to make implementation manageable. Take it one phase at a time!



