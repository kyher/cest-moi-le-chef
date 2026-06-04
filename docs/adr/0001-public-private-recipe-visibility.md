# Public/private recipe visibility

Recipes have a Visibility flag — public or private. Public recipes appear on the Home Page and are readable by anyone (authenticated or not). Private recipes are visible only to their owner. All recipes default to private on creation.

## Considered options

**Private-by-default vs public-by-default.** We chose private. Existing recipes were created under a "no sharing" contract; retroactively exposing them would violate that expectation. For new recipes, a user should make a deliberate choice to share rather than accidentally publishing a half-finished draft.

**404 vs 403 for private recipe access by non-owners.** We return 404. A 403 confirms the recipe exists, which leaks information about a user's private content. From a non-owner's perspective, a private recipe simply doesn't exist.

**Read-only public recipes.** Public recipes are read-only for non-owners — no saving, copying, liking, or commenting. These social features are deferred. The scope of this change is visibility only.
