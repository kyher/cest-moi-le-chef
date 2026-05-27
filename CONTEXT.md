# C'est Moi Le Chef

A personal recipe manager. A single user manages their own recipes — no sharing, no collaboration.

## Language

**Recipe**:
A dish the user wants to remember how to make. Has a title (required), optional free-form ingredients and method, zero or more Notes, and zero or more Tags.
_Avoid_: Dish, meal

**Note**:
A timestamped free-form observation attached to a single Recipe — e.g. "needed more salt", "cooked for 45 min instead of 30". Many notes belong to one recipe.
_Avoid_: Comment, tip, annotation

**Tag**:
A flat, user-defined label applied to Recipes for filtering and categorisation. Tags are personal — they belong to the user, not to the system. There are no predefined tag values and no tag categories.
_Avoid_: Category, type, label

## Example dialogue

> "I want to find all my starter recipes."
> — Filter by the Tag "starter".

> "I tried this last week and the sauce split — where do I record that?"
> — Add a Note to the Recipe.

> "I want to group recipes by cuisine too."
> — Create Tags like "italian", "thai" and apply them alongside course tags.
