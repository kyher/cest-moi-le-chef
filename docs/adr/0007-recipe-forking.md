# 0007 — Recipe Forking

## Status
Accepted

## Context
Users want to create personal variations of existing public Recipes — or their own Recipes — without starting from scratch. This requires a mechanism to copy a Recipe into the user's own account as an independent, editable starting point.

ADR 0001 noted that "public recipes are read-only for non-owners (no saves, copies, likes, comments in initial scope)". This ADR revisits that constraint.

ADR 0005 rejected recipe forking as a mechanism for the personal-notes use case ("too heavy"). This ADR introduces forking as a standalone feature unrelated to notes.

## Decision

### A Fork is a full independent copy
A Fork copies `title`, `ingredients`, `method`, `totalTime`, `servings`, and Tags (by name) from the source Recipe into a new Recipe owned by the forking user. Cover Image is **not** copied — two Recipes sharing an R2 image URL would create a cross-recipe dependency with no clean deletion semantics.

### Attribution uses a live reference, not a tombstone
The Fork stores a `forkedFrom` field pointing at the source Recipe's ID. Attribution is shown in the UI ("forked from [title]") as a live link to the original. If the original is deleted, made private, or its author is banned, the lookup returns nothing and attribution is silently omitted — no orphaned text, no broken links.

**Rejected: tombstone** — storing the original title at fork-time on the Fork record would preserve attribution after deletion, but surfaces a Recipe name that may have been removed for moderation reasons (ban, admin action). Silent omission is safer.

### Forks default to private
Consistent with all new Recipes (ADR 0001). The forking user explicitly publishes if desired.

### Forking is available on any visible Recipe
Any authenticated user can Fork any public Recipe, including their own. An owner can also Fork their own private Recipes (visible on My Recipes). This enables variation workflows without manually duplicating content.

### Fork flow: instant create → redirect to edit
The Fork is created immediately on action; the user is redirected to the edit page pre-filled with the copied content. No confirmation step — the Fork is private by default and trivially deletable, so accidental forks carry no meaningful consequence. A toast notification confirms the action.

### Title is not modified
The Fork's title starts identical to the source Recipe's title. Attribution is surfaced via the UI on the detail and edit pages, not encoded into the title.

## Consequences
- The `Recipe` model gains a nullable `forkedFromId` field (self-referential optional relation).
- Tags are copied by name: if the forking user already has a Tag with that name, it is reused; otherwise a new Tag is created under their account.
- When a Recipe is deleted or a user is banned, existing Forks are unaffected — only the `forkedFrom` reference resolves to nothing.
- Attribution UI must handle the null/missing case gracefully on both the detail and edit pages.
