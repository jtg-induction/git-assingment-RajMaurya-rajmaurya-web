# Assignment: Sync a Dependent Branch with Its Base Branch

## Scenario
You are on `feature/dependent-feature`, which was created from `feature/base-feature`.
Your branch adds a **User Profile API** that allows users to view and update their profiles.
This depends on the JWT authentication infrastructure from `feature/base-feature`.

While you were building the profile API, the security team discovered a **critical vulnerability**
in the JWT validation code on `feature/base-feature` and pushed an emergency security patch.

The patch on `feature/base-feature`:
1. Fixes a vulnerability where tokens without an `iss` (issuer) claim were being accepted
2. Adds `src/middleware/rateLimit.js` — a configurable rate limiting middleware
3. Updates `src/config/constants.js` with new security-related constants
4. **Also modified `src/routes/userRoutes.js`** to add the rate limiter to auth endpoints

**The problem**: You also modified `src/routes/userRoutes.js` to add your 3 new profile routes.
So when you sync with `feature/base-feature`, you will get a **conflict in userRoutes.js**.

## Your Tasks

### Step 1: Understand what changed on the base branch
```bash
git log --oneline feature/base-feature    # See the security patch commit
git diff HEAD feature/base-feature        # See all differences
git diff HEAD feature/base-feature -- src/routes/userRoutes.js   # See the route conflict
```

### Step 2: Bring in the security patch
Choose either merge or rebase:
```bash
git merge feature/base-feature
# OR
git rebase feature/base-feature
```
You will get a conflict in `src/routes/userRoutes.js`.

### Step 3: Resolve the conflict in `src/routes/userRoutes.js`
- **Your changes**: Added 3 profile routes (`GET /me/profile`, `PUT /me/profile`, `DELETE /me`)
- **Base branch changes**: Added `authRateLimiter` to `POST /register` and `POST /login`
- **Resolution**: Keep BOTH — apply rate limiting to auth routes AND include your profile routes

### Step 4: Verify the security patch is applied
```bash
git show feature/base-feature:src/middleware/authenticate.js | grep "iss"
# Should show the issuer claim check
cat src/middleware/authenticate.js  # Your branch should also have it now
cat src/middleware/rateLimit.js     # Should now exist on your branch
```

### Step 5: Complete the operation
```bash
# If merging:
git add src/routes/userRoutes.js
git merge --continue

# If rebasing:
git add src/routes/userRoutes.js
git rebase --continue
```

## Expected Final State
- `src/middleware/authenticate.js` has the `iss` claim security fix
- `src/middleware/rateLimit.js` exists (from base branch security patch)
- `src/routes/userRoutes.js` has: rate limiting on auth routes AND your 3 profile routes
- `src/controllers/userController.js` has the `getProfile`, `updateProfile`, `deleteAccount` controllers
