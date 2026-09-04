# Assignment: Rebase with Multi-File Conflicts

## Scenario
You are working on the `feature/rebase-me` branch, which adds a **Discount Code System**
to the order management API.

While you were working on this, the team merged a **Tax Calculation System** into `main`.

Both changes heavily modified the same three files:
- `src/services/orderService.js` — both changed `calculateTotal()` and `createOrder()`
- `src/models/order.js` — both added new fields to the order schema
- `src/config/constants.js` — both added new config constants

## Your Tasks

### Step 1: Inspect the situation
```bash
git log --oneline                         # See your commits on this branch
git log --oneline main                    # See what main has that you don't
git diff HEAD main -- src/services/orderService.js   # Preview the differences
```

### Step 2: Start the rebase
```bash
git rebase main
```
Git will pause with conflict markers in **3 files**. Do NOT panic.

### Step 3: Resolve conflicts in `src/config/constants.js`
- Keep BOTH the `DISCOUNT_CONFIG` block (your change) AND the `TAX_CONFIG` block (from main)
- Keep BOTH the updated `ORDER_LIMITS` sections — merge them together

### Step 4: Resolve conflicts in `src/models/order.js`
- Keep BOTH the `discountCode` + `discountAmount` fields (your change)
  AND the `taxRate` + `taxAmount` fields (from main)
- The final schema should support both discounts AND taxes

### Step 5: Resolve conflicts in `src/services/orderService.js`
- `calculateTotal()` was changed by both branches:
  - Your version: accepts a `discountAmount` parameter
  - Main's version: accepts a `taxRate` parameter
  - **Resolution**: accept BOTH parameters: `calculateTotal(subtotal, discountAmount = 0, taxRate = 0)`
- Keep BOTH `applyDiscount()` (your function) AND `calculateTax()` (main's function)
- In `createOrder()`: include BOTH discount code handling AND tax calculation

### Step 6: Mark as resolved and continue
```bash
git add src/config/constants.js src/models/order.js src/services/orderService.js
git rebase --continue
```
Write a commit message if prompted, then complete the rebase.

### Step 7: Verify
```bash
git log --oneline                         # Your commits should now be on top of main
git diff main -- src/services/orderService.js   # Should show discount + tax features
```

## Expected Final State
- This branch is cleanly rebased on top of the latest `main`
- `orderService.js` has: `applyDiscount()`, `calculateTax()`, and `calculateTotal(subtotal, discountAmount, taxRate)`
- `order.js` schema has: `discountCode`, `discountAmount`, `taxRate`, `taxAmount` fields
- `constants.js` has: both `DISCOUNT_CONFIG` and `TAX_CONFIG` sections
