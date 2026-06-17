# Personal Notes on any public Recipe

Any authenticated user may add personal Notes to any public Recipe, not just their own. Notes are always private to their author — the Recipe owner cannot see them.

## Considered Options

**Option A (chosen):** Extend Notes to any public Recipe, owned by the note's author via a `userId` on the `Note` model. Notes remain private to their author regardless of which Recipe they're on.

**Option B:** Allow users to fork (copy) a Recipe into their own collection, then annotate their copy. Rejected because the primary use case is experience-logging ("I tried this and needed more salt"), not recipe remixing. A fork implies intent to own and diverge from the original, which is a heavier concept not warranted here.

## Consequences

- `Note` requires a `userId` field; existing notes must be backfilled from their `recipe.userId`.
- Note privacy is now to the note's author, not the recipe owner. The recipe owner cannot read notes others have written on their recipes.
- Notes on a Recipe that is made private persist in the database but become inaccessible until the Recipe is public again, mirroring Like behaviour.
