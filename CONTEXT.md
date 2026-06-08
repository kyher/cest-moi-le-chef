# C'est Moi Le Chef

A recipe manager for multiple users. Each user manages their own recipes. Recipes can be public (visible to anyone) or private (visible only to their owner).

## Language

**Recipe**:
A dish the user wants to remember how to make. Has a title (required), optional free-form ingredients and method, zero or more Notes, and zero or more Tags.
_Avoid_: Dish, meal

**Note**:
A timestamped free-form observation attached to a single Recipe — e.g. "needed more salt", "cooked for 45 min instead of 30". Many notes belong to one recipe. Notes are always private to the owner, regardless of the Recipe's visibility.
_Avoid_: Comment, tip, annotation

**Tag**:
A flat, user-defined label applied to Recipes for filtering and categorisation. Tags are personal — they belong to the user, not to the system. There are no predefined tag values and no tag categories. On the Recipes Page, tags from different users compose into a shared filter vocabulary, matched case-insensitively by name across all public recipes.
_Avoid_: Category, type, label

**Visibility**:
Whether a Recipe is public or private. Public recipes are visible to anyone (authenticated or not) and appear on the Recipes Page. Private recipes are visible only to their owner and appear only on My Recipes. All recipes default to private on creation. Notes are always private regardless of Visibility. Non-owners requesting a private recipe receive a 404.
_Avoid_: Status, access level, sharing

**Recipes Page**:
The publicly accessible feed of all public recipes from all users, available at `/recipes`. Supports the same Search and Filter capabilities as My Recipes. Tag filters on the Recipes Page match case-insensitively across all users' public recipes. Visible to authenticated and non-authenticated users alike. Linked from the nav bar ("Recipes") and from the marketing page at `/`.
_Avoid_: Home page, landing page, public feed, discover page

**My Recipes**:
The authenticated owner's complete recipe list, accessible at `/my-recipes`. Shows all of the owner's recipes regardless of Visibility — both public and private. Supports Search, Filter, and per-recipe Visibility toggling.
_Avoid_: Dashboard, recipe list

**Cover Image**:
An optional single photograph attached to a Recipe, used as a visual identifier when browsing. Stored as a file on the server filesystem; the Recipe holds the URL path. Access is not restricted by Visibility — anyone who knows the URL can fetch it. Filenames are random UUIDs to prevent enumeration.
_Avoid_: Photo, thumbnail, hero image

**Total Time**:
The estimated duration to prepare and cook a Recipe from start to finish, stored as an integer number of minutes. Optional — a Recipe without a Total Time is valid. Displayed in compact format (e.g. "1h 30m", "45m"). Entered as separate hours and minutes fields.
_Avoid_: Cook time, prep time, duration

**Filter**:
A constraint applied to a Recipe list to narrow results. Filters are expressed as URL search params and evaluated server-side. Tag filters use AND logic (a recipe must match all selected Tags). The Total Time filter is a maximum threshold expressed as a preset bucket (≤15m, ≤30m, ≤1h, ≤2h); recipes with no Total Time are excluded when this filter is active. On My Recipes, only Tags applied to at least one of the user's own recipes are offered. On the Recipes Page, only Tags applied to at least one public recipe are offered, matched case-insensitively across all users.
_Avoid_: Search, query

**Search**:
A free-text constraint on Recipe title, distinct from Filter. Expressed as the URL param `q` and evaluated server-side as a case-insensitive substring match. Composes with Filters — both can be active simultaneously. Rendered as a standalone input above the filter panel. Counts toward the "has active constraints" state alongside Filters; "Clear all" resets Search and all Filters together.
_Avoid_: Filter, query

**Username**:
A unique, permanent handle chosen by a User at sign-up, used to address their Profile. Stored and matched case-insensitively; always lowercase. Valid characters: `[a-z0-9_-]`, 3–30 characters. Separate from `name` — a user has both a display name ("John Smith") and a username ("johnsmith42"). Cannot be changed after sign-up.
_Avoid_: Handle, display name, user ID

**Profile**:
A public page at `/profile/:username` showing a User's `name`, `username`, and all of their public Recipes as an unfiltered list. Accessible to authenticated and unauthenticated users alike. Reached by clicking the username attribution on a public Recipe — both on the Home Page and on the Recipe detail page.
_Avoid_: User page, public profile, account page

## Example dialogue

> "I want to find all my starter recipes."
> — Filter by the Tag "starter".

> "I tried this last week and the sauce split — where do I record that?"
> — Add a Note to the Recipe.

> "I want to group recipes by cuisine too."
> — Create Tags like "italian", "thai" and apply them alongside course tags.
