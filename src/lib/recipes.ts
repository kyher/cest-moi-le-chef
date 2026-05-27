import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";
import { prisma } from "#/db";

async function requireUser() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

async function syncTags(recipeId: string, tagNames: string[], userId: string) {
  await prisma.recipeTag.deleteMany({ where: { recipeId } });
  for (const raw of tagNames) {
    const name = raw.toLowerCase().trim();
    if (!name) continue;
    const tag = await prisma.tag.upsert({
      where: { name_userId: { name, userId } },
      create: { name, userId },
      update: {},
    });
    await prisma.recipeTag.create({ data: { recipeId, tagId: tag.id } });
  }
}

export const getRecipes = createServerFn().handler(async () => {
  const user = await requireUser();
  return prisma.recipe.findMany({
    where: { userId: user.id },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
});

export const getRecipe = createServerFn()
  .inputValidator((d: { recipeId: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    return prisma.recipe.findFirst({
      where: { id: data.recipeId, userId: user.id },
      include: {
        tags: { include: { tag: true } },
        notes: { orderBy: { createdAt: "desc" } },
      },
    });
  });

export const createRecipe = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      title: string;
      ingredients?: string;
      method?: string;
      tags: string[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const user = await requireUser();
    const recipe = await prisma.recipe.create({
      data: {
        title: data.title,
        ingredients: data.ingredients || null,
        method: data.method || null,
        userId: user.id,
      },
    });
    await syncTags(recipe.id, data.tags, user.id);
    return recipe;
  });

export const updateRecipe = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      recipeId: string;
      title: string;
      ingredients?: string;
      method?: string;
      tags: string[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const user = await requireUser();
    const recipe = await prisma.recipe.update({
      where: { id: data.recipeId, userId: user.id },
      data: {
        title: data.title,
        ingredients: data.ingredients || null,
        method: data.method || null,
      },
    });
    await syncTags(recipe.id, data.tags, user.id);
    return recipe;
  });

export const deleteRecipe = createServerFn({ method: "POST" })
  .inputValidator((d: { recipeId: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    await prisma.recipe.delete({
      where: { id: data.recipeId, userId: user.id },
    });
  });

export const addNote = createServerFn({ method: "POST" })
  .inputValidator((d: { recipeId: string; body: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const recipe = await prisma.recipe.findFirst({
      where: { id: data.recipeId, userId: user.id },
    });
    if (!recipe) throw new Error("Recipe not found");
    return prisma.note.create({
      data: { body: data.body, recipeId: data.recipeId },
    });
  });

export const deleteNote = createServerFn({ method: "POST" })
  .inputValidator((d: { noteId: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const note = await prisma.note.findFirst({
      where: { id: data.noteId, recipe: { userId: user.id } },
    });
    if (!note) throw new Error("Note not found");
    await prisma.note.delete({ where: { id: data.noteId } });
  });
