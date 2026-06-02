import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const session = await getSession();
		if (session) throw redirect({ to: "/recipes" });
	},
	component: HomePage,
});

function HomePage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
			<h1 className="text-4xl font-bold text-stone-900 mb-3">
				C'est moi le chef
			</h1>
			<p className="text-stone-500 mb-8">Your personal recipe collection.</p>
			<div className="flex gap-3">
				<Link
					to="/sign-in"
					className="h-9 px-6 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
				>
					Sign in
				</Link>
				<Link
					to="/sign-up"
					className="h-9 px-6 text-sm font-medium border border-stone-300 text-stone-700 hover:border-stone-500 transition-colors flex items-center"
				>
					Create an account
				</Link>
			</div>
		</div>
	);
}
