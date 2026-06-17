import { prisma } from "#/db";

export async function addNote(recipeId: string, userId: string, body: string) {
	const recipe = await prisma.recipe.findFirst({
		where: { id: recipeId, OR: [{ userId }, { isPublic: true }] },
	});
	if (!recipe) throw new Error("Recipe not found");
	return prisma.note.create({ data: { body, recipeId, userId } });
}

export async function removeNote(noteId: string, userId: string) {
	const note = await prisma.note.findFirst({
		where: { id: noteId, userId },
	});
	if (!note) throw new Error("Note not found");
	await prisma.note.delete({ where: { id: noteId } });
}
