# Database Migration Required

## Issue
Students who only enter their number/nickname (step 1) are appearing as "submitted" in the student list. This is because the database doesn't have the `is_in_progress` column yet.

## Solution
Run the following SQL in your Supabase SQL Editor:

```sql
-- Add is_in_progress column to responses table
ALTER TABLE responses
ADD COLUMN is_in_progress BOOLEAN DEFAULT false;

-- Set all existing responses to completed (not in progress)
UPDATE responses
SET is_in_progress = false
WHERE is_in_progress IS NULL;
```

## What This Does
- Adds a new `is_in_progress` column to track students who entered info but haven't submitted their answer yet
- Sets all existing responses to `false` (completed)
- Allows the 2-step flow to work properly:
  - Step 1: Creates a response with `is_in_progress = true`
  - Step 2: Updates the response with answer and sets `is_in_progress = false`

## After Running the Migration
Once you've run the SQL above, the app will:
- Correctly distinguish between in-progress and completed students
- Show in-progress students differently in the student list modal
- Prevent duplicate submissions properly
