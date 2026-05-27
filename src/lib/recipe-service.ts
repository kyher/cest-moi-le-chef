import { prisma } from '#/db'

async function syncTags(recipeId: string, tagNames: string[], userId: string) {
  await prisma.recipeTag.deleteMany({ where: { recipeId } })
  for (const raw of tagNames) {
    const name = raw.toLowerCase().trim()
    if (!name) continue
    const tag = await prisma.tag.upsert({
      where: { name_userId: { name, userId } },
      create: { name, userId },
      update: {},
    })
    await prisma.recipeTag.create({ data: { recipeId, tagId: tag.id } })
  }
}

export function listRecipes(userId: string) {
  return prisma.recipe.findMany({
    where: { userId },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export function findRecipe(recipeId: string, userId: string) {
  return prisma.recipe.findFirst({
    where: { id: recipeId, userId },
    include: {
      tags: { include: { tag: true } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function createRecipe(
  userId: string,
  data: { title: string; ingredients?: string; method?: string; tags: string[] },
) {
  const recipe = await prisma.recipe.create({
    data: {
      title: data.title,
      ingredients: data.ingredients || null,
      method: data.method || null,
      userId,
    },
  })
  await syncTags(recipe.id, data.tags, userId)
  return recipe
}

export async function updateRecipe(
  recipeId: string,
  userId: string,
  data: { title: string; ingredients?: string; method?: string; tags: string[] },
) {
  const recipe = await prisma.recipe.update({
    where: { id: recipeId, userId },
    data: {
      title: data.title,
      ingredients: data.ingredients || null,
      method: data.method || null,
    },
  })
  await syncTags(recipe.id, data.tags, userId)
  return recipe
}

export async function removeRecipe(recipeId: string, userId: string) {
  await prisma.recipe.delete({ where: { id: recipeId, userId } })
}

export async function addNote(recipeId: string, userId: string, body: string) {
  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } })
  if (!recipe) throw new Error('Recipe not found')
  return prisma.note.create({ data: { body, recipeId } })
}

export async function removeNote(noteId: string, userId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, recipe: { userId } },
  })
  if (!note) throw new Error('Note not found')
  await prisma.note.delete({ where: { id: noteId } })
}
