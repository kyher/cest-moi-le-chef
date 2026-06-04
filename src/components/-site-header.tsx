import { Link, useRouter } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";

interface Props {
	user: { name: string } | null;
}

export function SiteHeader({ user }: Props) {
	const router = useRouter();

	return (
		<header className="border-b border-neutral-200 dark:border-neutral-800 px-4 h-14 flex items-center justify-between">
			<Link
				to="/"
				className="font-bold text-stone-900 hover:text-stone-600 transition-colors"
			>
				c'est moi le chef
			</Link>
			<div className="flex items-center gap-3">
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
							className="h-9 px-4 text-sm font-medium bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors"
						>
							Sign out
						</button>
					</>
				) : (
					<>
						<Link
							to="/sign-in"
							className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
						>
							Sign in
						</Link>
						<Link
							to="/sign-up"
							className="h-9 px-4 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
						>
							Sign up
						</Link>
					</>
				)}
			</div>
		</header>
	);
}
