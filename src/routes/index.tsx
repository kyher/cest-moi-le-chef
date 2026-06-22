import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "#/components/-site-header";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/")({
	loader: () => getSession(),
	component: MarketingPage,
});

function MarketingPage() {
	const session = Route.useLoaderData();

	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session?.user ?? null} />
			<main className="flex-1 flex flex-col items-center justify-start pt-10 pb-10 sm:justify-center sm:py-20 px-4">
				<div className="max-w-xl text-center space-y-6">
					<h1 className="text-4xl sm:text-5xl font-bold font-serif text-stone-900">
						c'est moi le chef
					</h1>
					<p className="text-lg text-stone-600">
						Your personal recipe book — private by default, shareable when
						you're ready.
					</p>
					<p className="text-stone-500">
						Store your recipes exactly how you make them. Add notes after each
						cook. Share your best ones with anyone, or keep them to yourself.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
						{!session && (
							<Link
								to="/sign-up"
								className="h-11 px-6 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center justify-center"
							>
								Sign up — it's free
							</Link>
						)}
						<Link
							to="/recipes"
							className="h-11 px-6 text-sm font-medium rounded-sm border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-center"
						>
							Browse recipes
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
