import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getRecipe, updateRecipe } from '#/lib/recipes'

export const Route = createFileRoute('/_auth/recipes/$recipeId/edit')({
  loader: ({ params }) => getRecipe({ data: { recipeId: params.recipeId } }),
  component: EditRecipe,
})

function EditRecipe() {
  const recipe = Route.useLoaderData()
  if (!recipe) return <div className="p-8 text-stone-500">Recipe not found.</div>
  return <EditForm recipe={recipe} />
}

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipe>>>

function EditForm({ recipe }: { recipe: Recipe }) {
  const router = useRouter()
  const initialTags = recipe.tags.map(({ tag }) => tag.name)

  const [title, setTitle] = useState(recipe.title)
  const [ingredients, setIngredients] = useState(recipe.ingredients ?? '')
  const [method, setMethod] = useState(recipe.method ?? '')
  const [hours, setHours] = useState(recipe.totalTime ? String(Math.floor(recipe.totalTime / 60)) : '')
  const [minutes, setMinutes] = useState(recipe.totalTime ? String(recipe.totalTime % 60) : '')
  const [tags, setTags] = useState<string[]>(initialTags)
  const [tagInput, setTagInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  function addTag(value: string) {
    const name = value.toLowerCase().trim()
    if (name && !tags.includes(name)) setTags([...tags, name])
    setTagInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setPending(true)
    setError('')
    try {
      const h = parseInt(hours) || 0
      const m = parseInt(minutes) || 0
      const totalTime = h * 60 + m || undefined
      await updateRecipe({
        data: {
          recipeId: recipe.id,
          title: title.trim(),
          ingredients: ingredients || undefined,
          method: method || undefined,
          totalTime,
          tags,
        },
      })
      await router.navigate({ to: '/recipes/$recipeId', params: { recipeId: recipe.id } })
    } catch {
      setError('Failed to save changes.')
      setPending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        className="text-sm text-stone-500 hover:text-stone-800 mb-6 inline-block"
      >
        ← {recipe.title}
      </Link>
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Edit Recipe</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium text-stone-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-700">Tags</label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-50 text-stone-700 border border-amber-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-stone-400 hover:text-stone-700 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag(tagInput)
              }
            }}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder="Type a tag and press Enter"
            className="w-full h-9 px-3 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-700">Total Time</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0"
              className="w-20 h-9 px-3 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            <span className="text-sm text-stone-500">hr</span>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
              className="w-20 h-9 px-3 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
            <span className="text-sm text-stone-500">min</span>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="ingredients" className="text-sm font-medium text-stone-700">
            Ingredients
          </label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-y"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="method" className="text-sm font-medium text-stone-700">
            Method
          </label>
          <textarea
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-9 px-6 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
