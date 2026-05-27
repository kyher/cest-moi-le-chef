import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { addNote, deleteNote, deleteRecipe, getRecipe } from '#/lib/recipes'

export const Route = createFileRoute('/_auth/recipes/$recipeId/')({
  loader: ({ params }) => getRecipe({ data: { recipeId: params.recipeId } }),
  component: RecipeDetail,
})

function RecipeDetail() {
  const recipe = Route.useLoaderData()
  if (!recipe) return <div className="p-8 text-stone-500">Recipe not found.</div>
  return <Detail recipe={recipe} />
}

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipe>>>

function Detail({ recipe }: { recipe: Recipe }) {
  const router = useRouter()
  const [noteBody, setNoteBody] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteBody.trim()) return
    setAddingNote(true)
    await addNote({ data: { recipeId: recipe.id, body: noteBody.trim() } })
    setNoteBody('')
    setAddingNote(false)
    await router.invalidate()
  }

  async function handleDeleteNote(noteId: string) {
    await deleteNote({ data: { noteId } })
    await router.invalidate()
  }

  async function handleDeleteRecipe() {
    if (!confirm('Delete this recipe? This cannot be undone.')) return
    await deleteRecipe({ data: { recipeId: recipe.id } })
    await router.navigate({ to: '/recipes' })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <Link to="/recipes" className="text-sm text-stone-500 hover:text-stone-800">
          ← Recipes
        </Link>
        <div className="flex gap-2">
          <Link
            to="/recipes/$recipeId/edit"
            params={{ recipeId: recipe.id }}
            className="h-8 px-3 text-sm font-medium border border-stone-300 text-stone-700 hover:border-stone-500 transition-colors flex items-center"
          >
            Edit
          </Link>
          <button
            onClick={handleDeleteRecipe}
            className="h-8 px-3 text-sm font-medium border border-red-200 text-red-600 hover:border-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">{recipe.title}</h1>

      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-6">
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

      {recipe.ingredients && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
            Ingredients
          </h2>
          <p className="text-sm text-stone-800 whitespace-pre-wrap">{recipe.ingredients}</p>
        </section>
      )}

      {recipe.method && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
            Method
          </h2>
          <p className="text-sm text-stone-800 whitespace-pre-wrap">{recipe.method}</p>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-4">
          Notes{recipe.notes.length > 0 ? ` (${recipe.notes.length})` : ''}
        </h2>

        <form onSubmit={handleAddNote} className="flex gap-2 mb-6">
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className="flex-1 px-3 py-2 text-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none"
          />
          <button
            type="submit"
            disabled={addingNote || !noteBody.trim()}
            className="px-4 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50 transition-colors self-end h-9"
          >
            Add
          </button>
        </form>

        {recipe.notes.length === 0 ? (
          <p className="text-sm text-stone-400">No notes yet.</p>
        ) : (
          <div className="space-y-3">
            {recipe.notes.map((note) => (
              <div key={note.id} className="flex gap-3 group">
                <div className="flex-1 p-3 bg-amber-50 border border-amber-100">
                  <p className="text-xs text-stone-400 mb-1">
                    {new Date(note.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-stone-800 whitespace-pre-wrap">{note.body}</p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-xs text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity self-start pt-3"
                >
                  delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
