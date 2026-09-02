# Assignment: Clean Up a Messy Sprint History with Interactive Rebase

## Scenario
The payments feature was developed during a frantic sprint. The developer committed
frequently and messily — 12 commits across 5 files, including a commit that added
massive debug logging to half the codebase.

Your job is to use `git rebase -i` to produce a single, clean, professional commit.

## Your Tasks

### Step 1: Inspect the commit history
```bash
git log --oneline
```
You will see 12 commits on this branch (on top of the initial project commit).

### Step 2: Identify the "bad" commit
Find the commit with message `"debug: add verbose logging everywhere"`. This commit
added console.log spam to `paymentService.js`, `paymentController.js`, and
`database.js`. It must be **completely dropped**.

### Step 3: Launch interactive rebase
```bash
git rebase -i HEAD~12
```

In the editor:
- Change the FIRST commit's action from `pick` to `pick` (keep it as the base)
- Change all OTHER commits (except the debug one) to `squash` or `s`
- Change the `"debug: add verbose logging everywhere"` commit to `drop` or `d`

### Step 4: Write the final commit message
After dropping and squashing, git will prompt you for a final commit message.
Use exactly:
```
feat: implement payment processing module

Adds complete payment processing support including:
- Payment model with card validation
- Payment service with amount and card number validation
- Payment controller for REST endpoints
- Payment routes (POST /api/payments, GET /api/payments/:id)
- Unit tests for payment service
- Payment limits added to app constants
```

### Step 5: Verify the result
```bash
git log --oneline          # Should show exactly 2 commits (initial + your squashed one)
git show HEAD --stat       # Should show all payment files, NO debug logs anywhere
git diff HEAD -- src/config/constants.js  # Should contain PAYMENT_LIMITS
```

## Expected Final State
- Exactly ONE new commit on top of the base commit
- The commit contains all 5 payment files with clean, production-ready code
- NO debug console.log statements anywhere in the codebase
- Commit message matches exactly what is specified above
