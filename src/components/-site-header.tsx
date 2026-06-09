import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";

interface Props {
	user: { name: string } | null;
}

export function SiteHeader({ user }: Props) {
	const router = useRouter();
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<header className="border-b border-stone-200 bg-stone-100 px-4 h-16 flex items-center justify-between">
			<Link
				to="/"
				className="font-serif italic text-lg text-stone-900 hover:text-stone-600 transition-colors"
			>
				c'est moi le chef
			</Link>
			<div className="flex items-center gap-3">
				<Link
					to="/recipes"
					className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
				>
					Recipes
				</Link>
				{user ? (
					<>
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
							className="h-9 px-4 text-sm font-medium rounded-sm bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors"
						>
							Sign out
						</button>
					</>
				) : (
					<>
						{pathname !== "/sign-in" && (
							<Link
								to="/sign-in"
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								Sign in
							</Link>
						)}
						{pathname !== "/sign-up" && (
							<Link
								to="/sign-up"
								className="h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
							>
								Sign up
							</Link>
						)}
					</>
				)}
			</div>
		</header>
	);
}
