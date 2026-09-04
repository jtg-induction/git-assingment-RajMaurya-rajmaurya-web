# Assignment: Pick a Bug Fix with `git cherry-pick` (with conflict)

## Scenario
The `hotfix/cache-bug` branch contains a critical fix that reduces the cache TTL to prevent stale order data. However, it also contains unfinished experimental features (`src/utils/cartHelper.js`). You only want the bug fix commit on your branch, without the experimental work.

The catch? Your current branch, `feature/cherry-pick`, also modified the cache TTL for performance testing. Cherry-picking the bug fix will result in a merge conflict that you must resolve.

## Your Tasks

### Step 1: Find the commit hash
View the commit history of the `hotfix/cache-bug` branch:
```bash
git log hotfix/cache-bug --oneline
```
Find the commit with the message `"fix: reduce cache TTL to prevent stale order data and add verification test"`. Note its commit hash.

### Step 2: Cherry-pick the commit
Ensure you are on the `feature/cherry-pick` branch, then run:
```bash
git cherry-pick <commit-hash>
```

Git will pause and tell you there is a conflict in `src/config/constants.js`.

### Step 3: Resolve the conflict
Open `src/config/constants.js`. You will see conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
Resolve the conflict by keeping the hotfix change (TTL of 15) and removing the markers. Save the file.

### Step 4: Complete the cherry-pick
```bash
git add src/config/constants.js
git cherry-pick --continue
```
Leave the commit message as is and save it.

### Step 5: Verify
```bash
npm run test tests/cache.test.js
```
The test should pass, confirming that the TTL was correctly set to 15!

```bash
git log -3 --oneline
```
You should see the fix commit at the top of your branch history, and `src/config/constants.js` should have `CACHE_TTL_SECONDS: 15`. `src/utils/cartHelper.js` should not exist.

## Expected Final State
- The `feature/cherry-pick` branch has exactly one new commit on top of your feature commit.
- The new commit is the one containing the cache TTL fix and the test case.
- The conflict in `src/config/constants.js` is resolved to keep the hotfix value.
- Running `npm run test tests/cache.test.js` passes successfully.
