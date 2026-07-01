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
The publicly accessible feed of all public recipes from all users, available at `/recipes`. Supports the same Search and Filter capabilities as My Recipes. Tag filters on the Recipes Page match case-insensitively across all users' public recipes. Visible to authenticated and non-authenticated users alike. Linked from the nav bar as "All Recipes" — a plain top-level link for signed-out visitors, or nested inside the "Recipes" nav category for authenticated Users — and from the marketing page at `/`.
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

**Servings**:
The number of people a Recipe is intended to feed, stored as an optional integer. Displayed on the Recipe detail page alongside Total Time. Not filterable. Optional — a Recipe without Servings is valid.
_Avoid_: Portions, yield, serves

**Like**:
An authenticated user's expression of appreciation for another user's Recipe. A user cannot like their own recipes. Liking is a toggle — a second action removes the Like. The Like record persists when a Recipe is made private; the Recipe simply disappears from the liker's Liked Recipes page until made public again. Deleted Recipes cascade-delete their Likes.
_Avoid_: Favourite, bookmark, save, upvote

**Like Count**:
The total number of Likes on a Recipe. Visible to all users (authenticated or not) on the Recipe detail page and on Recipes Page cards.
_Avoid_: Likes, popularity score

**Liked Recipes**:
An authenticated user's list of public Recipes they have Liked, accessible at `/liked-recipes`. Recipes that have been liked but are currently private are hidden. Supports the same Search and Filter capabilities as My Recipes and the Recipes Page. The Filter panel offers only Tags applied to the user's currently visible liked Recipes. Linked from the nav bar under the "Recipes" category ("Liked Recipes"), visible only when authenticated.
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
A public page at `/profile/:username` showing a User's `name`, `username`, and all of their public Recipes as an unfiltered list. Accessible to authenticated and unauthenticated users alike. Reached by clicking the username attribution on a public Recipe (both on the Home Page and on the Recipe detail page), or, for an authenticated User viewing their own Profile, via "My Profile" inside the nav bar's User menu. There is no separate "My Profile" page or concept — the nav link opens the same public Profile, scoped to the signed-in User's own username, and shows only their public Recipes like any other visitor would see.
_Avoid_: User page, public profile, account page, My Profile page

**Role**:
A classification on a User that determines their privileges. Two values: `user` (default) and `admin`. A User's Role is assigned at the database level on bootstrap and cannot be changed through the app UI.
_Avoid_: Permission, access level, tier

**Admin**:
A User with Role `admin`. Has exclusive access to the Admin Panel and all moderation actions. There is no in-app way to grant or revoke admin status — it is managed directly in the database.
_Avoid_: Moderator, superuser, staff

**Admin Panel**:
A dedicated area of the application, accessible only to Admins, for content moderation. Located at `/admin`. Contains two sections: a Recipe list and a User list. Not linked from the main navigation for non-admin users.
_Avoid_: Dashboard, control panel, back-office

**Ban**:
An admin action that permanently blocks a User from signing in and hard-deletes all of their Recipes (including private ones) and all associated data. A banned User's sessions are invalidated immediately. Irreversible through the app — only a database intervention can restore a banned User.
_Avoid_: Suspend, deactivate, disable

**Fork**:
A copy of a Recipe — either your own or another user's public Recipe — that becomes an independent Recipe in your account. A Fork copies the title, ingredients, method, Total Time, Servings, and Tags (by name, creating new Tag records under the forking user's account as needed) but not the Cover Image. A Fork defaults to private on creation, consistent with all new Recipes. The Fork holds a `forkedFrom` reference to the original Recipe; if the original is deleted, made private, or its author is banned, the reference is silently dropped and no attribution is shown. The forking user is redirected to the edit page immediately after the Fork is created. The Fork's title starts identical to the original's; attribution ("forked from [original]") is displayed in the UI on the Recipe detail and edit pages rather than encoded in the title. You may Fork your own Recipes, including private ones — useful for creating variations.
_Avoid_: Clone, copy, remix, duplicate

**Weekly Plan**:
A single, persistent, reusable planning template per authenticated User, accessible at `/weekly-plan`. Assigns Recipes to the seven named days of the week (Monday through Sunday). Not tied to any specific calendar date — the user updates it in place week to week. A User has exactly one Weekly Plan; there is no concept of multiple named plans. Recipes eligible to be added are the user's own Recipes (public or private) and any public Recipe from any other User — no Like is required. The recipe picker uses three tabs to navigate eligible recipes: "My Recipes", "Liked Recipes", and "All Recipes" (all public recipes from all users). Plan Entries on a public Recipe from another user that becomes private are silently hidden until the Recipe is public again, mirroring Like and Collection Entry behaviour. Plan Entries on a deleted Recipe are cascade-deleted. The entire Weekly Plan can be cleared in one action, or individual Plan Entries can be removed.
_Avoid_: Meal plan, week planner, schedule, planner

**Plan Entry**:
A single Recipe assigned to a specific day within a User's Weekly Plan. Multiple Plan Entries per day are allowed. Plan Entries within a day are ordered; that order is maintained and can be changed by the user. Dragging a Plan Entry from one day to another moves it (not copies it). Reordering within a day uses the same drag-and-drop interaction.
_Avoid_: Meal, slot, assignment, item

**Shopping List**:
A read-only panel on the Weekly Plan page that aggregates the `ingredients` field from every Plan Entry in the user's Weekly Plan, to help the user prepare a physical shopping list. Grouped by Recipe, with each section headed by the Recipe title and the day it is planned for (e.g. "Pasta Bolognese · Monday"). If the same Recipe appears on multiple days, it appears once per Plan Entry — not deduplicated. Recipes with no ingredients show a placeholder rather than being silently omitted. The Shopping List trigger is hidden when the Weekly Plan is empty, consistent with the "Clear plan" button.
_Avoid_: Ingredient list, grocery list, meal list

**Collection**:
A user-created, always-private, named list of Recipes. A Collection can hold any of the owner's own Recipes (public or private) and any public Recipe from any other User — no Like is required. A Recipe can belong to multiple Collections simultaneously. Collections are flat (no nesting) and unordered. Collections are personal and never visible to other users. Accessible at `/my-collections`; each Collection has its own detail view at `/my-collections/:id`.
_Avoid_: Folder, group, playlist, board, bookmark list

**Collection Entry**:
The record linking a single Recipe to a Collection. A Recipe and Collection pair is unique — the same Recipe cannot appear twice in the same Collection. Collection Entries on a Recipe that becomes private are silently hidden until the Recipe is public again, mirroring Like and Plan Entry behaviour. Collection Entries are cascade-deleted when the Recipe is deleted or when the Collection is deleted.
_Avoid_: Item, slot, member

**My Collections**:
An authenticated user's list of all their Collections, accessible at `/my-collections`. Linked from the nav bar under the "Recipes" category, visible only when authenticated. Each Collection can be opened to view its recipes.
_Avoid_: Saved recipes, bookmarks, folders

## Example dialogue

> "I want to find all my starter recipes."
> — Filter by the Tag "starter".

> "I tried this last week and the sauce split — where do I record that?"
> — Add a Note to the Recipe. Notes are personal and only visible to you, whether it's your recipe or someone else's.

> "I want to group recipes by cuisine too."
> — Create Tags like "italian", "thai" and apply them alongside course tags.

> "I want to save this public recipe for later without liking it."
> — Add it to a Collection. Collections are private and don't require a Like.

> "I want to organise my pasta recipes and some I've found from other users."
> — Create a Collection and add both your own Recipes and any public Recipes to it.
