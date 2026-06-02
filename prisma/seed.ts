import { prisma } from "#/db";
import { auth } from "#/lib/auth";

const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password";
const TEST_NAME = "Test User";

const RECIPES: Array<{
	title: string;
	ingredients?: string;
	method?: string;
	totalTime?: number;
	tags: string[];
	notes?: string[];
}> = [
	{
		title: "Spaghetti Bolognese",
		tags: ["italian", "pasta"],
		totalTime: 90,
		ingredients: `500g beef mince
1 onion, finely chopped
2 cloves garlic, minced
2 carrots, finely diced
2 sticks celery, finely diced
400g tin chopped tomatoes
2 tbsp tomato purée
150ml red wine
500g spaghetti
Parmesan to serve`,
		method: `Fry the onion, carrot and celery in olive oil over a medium heat for 10 minutes until soft.
Add the garlic and cook for another minute.
Turn up the heat, add the mince and brown all over.
Pour in the wine and let it bubble down for a few minutes.
Stir in the tomatoes and tomato purée. Season well.
Simmer on a low heat for at least 45 minutes, stirring occasionally.
Cook the spaghetti according to packet instructions. Serve with Parmesan.`,
		notes: ["Add a splash of whole milk at the end — makes it much richer."],
	},
	{
		title: "Chicken Tikka Masala",
		tags: ["indian", "curry"],
		totalTime: 60,
		ingredients: `4 chicken breasts, cut into chunks
2 tins coconut milk
1 onion, diced
3 cloves garlic, minced
1 tbsp fresh ginger, grated
2 tbsp tikka masala paste
400g tin chopped tomatoes
Fresh coriander to serve`,
		method: `Marinate chicken in tikka paste for at least 30 minutes (overnight is better).
Fry the onion until soft, add garlic and ginger and cook for 2 minutes.
Add the remaining paste and cook for a minute.
Add the chicken and cook until sealed.
Pour in the tomatoes and coconut milk. Simmer for 20 minutes.
Serve with basmati rice and naan, topped with fresh coriander.`,
		notes: ["Marinating overnight makes a huge difference."],
	},
	{
		title: "Caesar Salad",
		tags: ["salad", "quick"],
		totalTime: 15,
		ingredients: `2 romaine lettuce hearts, roughly chopped
50g Parmesan, shaved
Croutons
Caesar dressing:
  2 anchovy fillets
  1 clove garlic
  Juice of half a lemon
  1 tsp Dijon mustard
  1 egg yolk
  100ml olive oil`,
		method: `Make the dressing: blend anchovies, garlic, lemon juice, mustard and egg yolk. Slowly whisk in the oil until emulsified. Season to taste.
Toss the lettuce with enough dressing to coat.
Scatter over croutons and Parmesan shavings.`,
	},
	{
		title: "Banana Bread",
		tags: ["baking"],
		totalTime: 75,
		ingredients: `3 very ripe bananas
175g self-raising flour
100g caster sugar
75g butter, melted
2 eggs
1 tsp vanilla extract
Pinch of salt`,
		method: `Preheat oven to 180°C. Grease a loaf tin.
Mash the bananas well in a large bowl.
Beat in the eggs, melted butter and vanilla.
Fold in the flour, sugar and salt until just combined — don't overmix.
Pour into the loaf tin and bake for 55–60 minutes until a skewer comes out clean.
Cool in the tin for 10 minutes before turning out.`,
		notes: [
			"The riper the bananas the better — almost black is ideal.",
			"Add a handful of chocolate chips or walnuts for variation.",
		],
	},
	{
		title: "Shakshuka",
		tags: ["breakfast", "eggs", "vegetarian"],
		totalTime: 30,
		ingredients: `6 eggs
2 tins chopped tomatoes
1 red pepper, sliced
1 onion, diced
3 cloves garlic, minced
1 tsp cumin
1 tsp paprika
Half tsp chilli flakes
Fresh parsley to serve
Crusty bread to serve`,
		method: `Fry the onion and pepper in olive oil until soft, about 8 minutes.
Add garlic, cumin, paprika and chilli flakes. Cook for 1 minute.
Pour in the tomatoes. Season and simmer for 10 minutes.
Make 6 wells in the sauce and crack in the eggs.
Cover and cook for 5–8 minutes until the whites are set but yolks still runny.
Scatter with parsley and serve straight from the pan with bread.`,
	},
	{
		title: "Roast Chicken",
		tags: ["roast"],
		totalTime: 90,
		ingredients: `1 whole chicken (about 1.5kg)
1 lemon, halved
1 head garlic, halved horizontally
Fresh thyme and rosemary
50g butter, softened
Salt and pepper`,
		method: `Preheat oven to 200°C.
Mix butter with thyme, salt and pepper. Rub all over the chicken and under the skin.
Stuff the cavity with the lemon, garlic and rosemary.
Roast for 20 minutes per 500g plus 20 minutes extra.
Rest for at least 15 minutes before carving.`,
		notes: ["Resting is non-negotiable — makes all the difference to the juices."],
	},
	{
		title: "Guacamole",
		tags: ["quick", "snack", "vegan"],
		totalTime: 10,
		ingredients: `3 ripe avocados
Juice of 1 lime
Half a red onion, finely diced
1 green chilli, finely chopped
Small bunch of coriander, chopped
Salt`,
		method: `Halve and stone the avocados. Scoop the flesh into a bowl.
Mash with a fork to your preferred texture — some chunks are good.
Stir in the lime juice, onion, chilli and coriander.
Season generously with salt.
Serve immediately.`,
		notes: ["Press cling film directly onto the surface to stop it browning."],
	},
	{
		title: "Slow Beef Stew",
		tags: ["slow-cook", "beef"],
		totalTime: 180,
		ingredients: `800g beef chuck, cut into large chunks
3 carrots, roughly chopped
3 potatoes, cut into chunks
2 onions, roughly chopped
3 cloves garlic, crushed
300ml beef stock
200ml red wine
2 tbsp plain flour
2 tbsp tomato purée
Fresh thyme and bay leaves`,
		method: `Toss beef in flour. Brown in batches in a heavy casserole — don't crowd the pan.
Remove the beef. Fry the onion and garlic until soft.
Add the tomato purée and cook for a minute.
Return the beef, pour over the wine and stock.
Add the thyme, bay leaves and vegetables.
Cover and cook in the oven at 160°C for 2.5–3 hours until the beef is falling apart.`,
		notes: ["Even better the next day."],
	},
	{
		title: "Pancakes",
		tags: ["breakfast", "quick"],
		totalTime: 20,
		ingredients: `200g plain flour
2 eggs
300ml milk
Pinch of salt
Butter for frying`,
		method: `Whisk flour, eggs and half the milk until smooth. Gradually add the rest of the milk. Season with salt.
Rest the batter for 10 minutes if you can.
Heat a knob of butter in a non-stick pan over a medium-high heat.
Pour in a ladleful of batter, swirl to cover the base.
Cook for about 1 minute until the edges start to curl, then flip and cook for 30 seconds.
Keep warm in a low oven while you cook the rest.`,
	},
	{
		title: "French Onion Soup",
		tags: ["soup", "french"],
		totalTime: 60,
		ingredients: `1kg onions, thinly sliced
50g butter
1 tbsp olive oil
1 tsp sugar
2 cloves garlic, crushed
200ml dry white wine
1 litre beef stock
Fresh thyme
Baguette slices and Gruyère to finish`,
		method: `Melt butter with oil in a large heavy pan. Add the onions and sugar. Cook on a low heat for 40 minutes, stirring occasionally, until deeply caramelised.
Add garlic and thyme. Cook for another 2 minutes.
Pour in the wine and reduce for a few minutes.
Add the stock and simmer for 15 minutes. Season.
Ladle into oven-proof bowls, top with a baguette slice and plenty of Gruyère.
Grill until the cheese is bubbling and golden.`,
		notes: ["Don't rush the onions — 40 minutes minimum for proper colour."],
	},
];

async function seedUser(): Promise<string> {
	const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
	if (existing) {
		console.log(`  ↩  User already exists (${TEST_EMAIL})`);
		return existing.id;
	}

	const res = await auth.handler(
		new Request("http://localhost/api/auth/sign-up/email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME }),
		}),
	);

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Failed to create user: ${res.status} ${body}`);
	}

	const user = await prisma.user.findUniqueOrThrow({ where: { email: TEST_EMAIL } });
	console.log(`  ✓  Created user ${TEST_EMAIL}`);
	return user.id;
}

async function seedRecipe(userId: string, recipe: (typeof RECIPES)[number]) {
	const existing = await prisma.recipe.findFirst({
		where: { userId, title: recipe.title },
	});

	if (existing) {
		console.log(`  ↩  Recipe already exists: "${recipe.title}"`);
		return;
	}

	const tags = await Promise.all(
		recipe.tags.map((name) =>
			prisma.tag.upsert({
				where: { name_userId: { name, userId } },
				create: { name, userId },
				update: {},
			}),
		),
	);

	await prisma.recipe.create({
		data: {
			userId,
			title: recipe.title,
			ingredients: recipe.ingredients,
			method: recipe.method,
			totalTime: recipe.totalTime,
			tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
			notes: recipe.notes
				? { create: recipe.notes.map((body) => ({ body })) }
				: undefined,
		},
	});

	console.log(`  ✓  Created recipe: "${recipe.title}"`);
}

async function main() {
	console.log("🌱 Seeding...");

	const userId = await seedUser();

	for (const recipe of RECIPES) {
		await seedRecipe(userId, recipe);
	}

	console.log("✅ Done.");
}

main()
	.catch((e) => {
		console.error("❌ Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
