# Reflection

**Name / Andrew ID: Takeshi Koey / tkoey**

**Recitation group members (Task 2): Alex Feies**

---

### 1. Valid but weak

"returns exactly five colors" (Wordle). It matches the spec — the result is always five colors — but every public mutant also returns length 5, so it kills none of them. It would catch a bug that returned four colors, or appended an extra one, e.g. `['G','G','G','G']` when the guess is the secret.

### 2. A generator problem, not a property problem

`mergesIntegerNeighbors` was flaky: the differential property is right (a point is covered iff the input covers it), but sampling one random point rarely landed in a one-unit gap like 2.5 between `[0,2]` and `[3,3]`. I fixed it by checking every integer and half-integer in range, so that gap is always tested.

Before:
```
  ~ mergesIntegerNeighbors  flaky: killed in 2/5 runs  by: covers a point exactly when the input covers it
      Counterexample: [[[10,12],[13,13]],12.5]
      AssertionError: expected true to be false
```

After:
```
  ✔ mergesIntegerNeighbors  killed  by: covers a point exactly when the input covers it
      Counterexample: [[[0,2],[3,3]]]
      AssertionError: expected true to be false
```

### 3. Reading a counterexample

```
  ✔ ignoresCounts  killed  by: never credits a letter more times than the secret contains it
      Counterexample: ["AAABA","ABAAB"]
      AssertionError: expected 2 to be less than or equal to 1
```

`AAABA` has one `B`. `ABAAB` has two `B`s, neither on the secret's `B`. The spec says a letter may be green/yellow only as many times as it appears in the secret, so the second `B` must be black. `ignoresCounts` paints yellow whenever the letter appears anywhere, so both `B`s are yellow (2 > 1).

### 4. Your project

`Wildcard.match` in `packages/opencode/src/util/wildcard.ts`. It checks whether a string matches a glob (`*` / `?`), and it normalizes `\` to `/` so Windows paths work.

- **Invariant:** `Wildcard.match(s, "*")` is always true. The pattern `*` means “anything.”
- **Metamorphic:** flipping `\` and `/` in the string and the pattern does not change the result, because the function normalizes slashes first.

**Generator:** random path segments plus a pattern built from those segments with some `*` / `?` inserted (so matches actually happen). A naive `fc.string()` pair almost never matches, and it would miss `\` vs `/` and the `"ls *"` case (space + star should also match `"ls"` with no args).

