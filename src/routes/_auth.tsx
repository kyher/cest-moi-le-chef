import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/sign-in" });
		}
		return { session };
	},
	component: AuthLayout,
});

function AuthLayout() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex flex-col">
			<header className="border-b border-neutral-200 dark:border-neutral-800 px-4 h-14 flex items-center justify-between">
				<Link
					to="/"
					className="font-bold text-stone-900 hover:text-stone-600 transition-colors"
				>
					c'est moi le chef
				</Link>
				<div className="flex items-center gap-3">
					<Link
						to="/my-recipes"
						className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
					>
						My Recipes
					</Link>
					<button
						type="button"
						onClick={() => {
							void authClient.signOut({
								fetchOptions: {
									onSuccess: () => router.navigate({ to: "/" }),
								},
							});
						}}
						className="h-9 px-4 text-sm font-medium bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors"
					>
						Sign out
					</button>
				</div>
			</header>
			<div className="w-3/4 mx-auto">
				<Outlet />
			</div>
		</div>
	);
}
