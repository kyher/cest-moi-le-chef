import { Link, createFileRoute } from '@tanstack/react-router'
import { getRecipes } from '#/lib/recipes'

export const Route = createFileRoute('/_auth/recipes/')({
  loader: () => getRecipes(),
  component: RecipeList,
})

function RecipeList() {
  const recipes = Route.useLoaderData()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900">My Recipes</h1>
        <Link
          to="/recipes/new"
          className="h-9 px-4 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
        >
          + New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p className="text-stone-500">
          No recipes yet.{' '}
          <Link to="/recipes/new" className="text-stone-800 underline underline-offset-2">
            Add your first one.
          </Link>
        </p>
      ) : (
        <div className="space-y-2">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              to="/recipes/$recipeId"
              params={{ recipeId: recipe.id }}
              className="flex items-start justify-between gap-4 p-4 bg-white border border-stone-200 hover:border-stone-400 transition-colors"
            >
              <div>
                <h2 className="font-semibold text-stone-900">{recipe.title}</h2>
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {recipe.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-xs bg-amber-50 text-stone-600 border border-amber-200"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-stone-400 whitespace-nowrap shrink-0 mt-0.5">
                {recipe._count.notes} {recipe._count.notes === 1 ? 'note' : 'notes'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
