# C'est Moi Le Chef

A recipe manager for multiple users. Each user manages their own recipes. Recipes can be public (visible to anyone) or private (visible only to their owner).

## Language

**Recipe**:
A dish the user wants to remember how to make. Has a title (required), optional free-form ingredients and method, zero or more Notes, and zero or more Tags.
_Avoid_: Dish, meal

**Note**:
A timestamped free-form observation written by an authenticated User about a Recipe — e.g. "needed more salt", "cooked for 45 min instead of 30". Any authenticated User may add Notes to any public Recipe; a User may also add Notes to their own private Recipes. Notes are always private to their author and never visible to any other User, including the Recipe owner. Notes persist when a Recipe is made private, becoming inaccessible until the Recipe is public again (mirroring Like behaviour). Many Notes may exist on one Recipe across multiple authors.
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

**Like**:
An authenticated user's expression of appreciation for another user's Recipe. A user cannot like their own recipes. Liking is a toggle — a second action removes the Like. The Like record persists when a Recipe is made private; the Recipe simply disappears from the liker's Liked Recipes page until made public again. Deleted Recipes cascade-delete their Likes.
_Avoid_: Favourite, bookmark, save, upvote

**Like Count**:
The total number of Likes on a Recipe. Visible to all users (authenticated or not) on the Recipe detail page and on Recipes Page cards.
_Avoid_: Likes, popularity score

**Liked Recipes**:
An authenticated user's list of public Recipes they have Liked, accessible at `/liked-recipes`. Recipes that have been liked but are currently private are hidden. Supports the same Search and Filter capabilities as My Recipes and the Recipes Page. The Filter panel offers only Tags applied to the user's currently visible liked Recipes. Linked from the nav bar ("Liked Recipes"), visible only when authenticated.
_Avoid_: Saved recipes, favourites, bookmarks

**Filter**:
A constraint applied to a Recipe list to narrow results. Filters are expressed as URL search params and evaluated server-side. Tag filters use AND logic (a recipe must match all selected Tags). The Total Time filter is a maximum threshold expressed as a preset bucket (≤15m, ≤30m, ≤1h, ≤2h); recipes with no Total Time are excluded when this filter is active. On My Recipes, only Tags applied to at least one of the user's own recipes are offered. On the Recipes Page, only Tags applied to at least one public recipe are offered, matched case-insensitively across all users. On Liked Recipes, only Tags applied to at least one of the user's currently visible liked Recipes are offered.
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
> — Add a Note to the Recipe. Notes are personal and only visible to you, whether it's your recipe or someone else's.

> "I want to group recipes by cuisine too."
> — Create Tags like "italian", "thai" and apply them alongside course tags.
