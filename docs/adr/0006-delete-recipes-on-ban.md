# Delete all Recipes on Ban

When an Admin bans a User, all of their Recipes are hard-deleted immediately.

## Considered Options

**Option A (chosen):** Hard-delete all Recipes on ban. Content is removed from the database immediately and permanently. Sessions are invalidated and the User cannot sign in again.

**Option B:** Force-private all Recipes on ban. Recipes are made private (invisible to the public) but retained in the database. The User is blocked from signing in but their data survives.

Option A was chosen because the primary reason to ban a user is that their content is harmful or offensive. Leaving that content in the database — even private — preserves data with no upside: there is no appeal process and no admin UI to review or restore it. Hard-delete removes the problem completely and keeps the database clean.

## Consequences

- A ban is irreversible through the app. Restoring a banned user requires direct database intervention.
- Cascade deletes remove the User's Recipes, Tags, Likes, and Notes atomically via existing foreign key constraints.
- If a future appeal or restoration workflow is added, it cannot recover deleted Recipes — this would need to be reconsidered at that point.
