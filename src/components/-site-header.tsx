import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

interface Props {
	user: { name: string; role?: string | null } | null;
}

export function SiteHeader({ user }: Props) {
	const router = useRouter();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [mobileOpen, setMobileOpen] = useState(false);

	const close = () => setMobileOpen(false);

	const signOut = () => {
		void authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					close();
					router.navigate({ to: "/" });
				},
			},
		});
	};

	return (
		<header className="border-b border-stone-200 bg-stone-100">
			<div className="px-4 h-16 flex items-center justify-between">
				<Link
					to="/"
					onClick={close}
					className="font-serif italic text-lg text-stone-900 hover:text-stone-600 transition-colors"
				>
					c'est moi le chef
				</Link>

				{/* Desktop nav */}
				<div className="hidden md:flex items-center gap-3">
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
							<Link
								to="/liked-recipes"
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								Liked Recipes
							</Link>
							<Link
								to="/weekly-plan"
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								Weekly Plan
							</Link>
							{user?.role === "admin" && (
								<Link
									to="/admin/recipes"
									className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
								>
									Admin
								</Link>
							)}
							<Link
								to="/my-recipes/new"
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								Add Recipe
							</Link>
							<button
								type="button"
								onClick={signOut}
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

				{/* Mobile hamburger */}
				<button
					type="button"
					onClick={() => setMobileOpen((o) => !o)}
					aria-label="Toggle menu"
					aria-expanded={mobileOpen}
					className="md:hidden p-2 -mr-2 text-stone-600 hover:text-stone-900 transition-colors"
				>
					{mobileOpen ? (
						<svg
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					) : (
						<svg
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					)}
				</button>
			</div>

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="md:hidden border-t border-stone-200 px-4 py-3 flex flex-col gap-4">
					<Link
						to="/recipes"
						onClick={close}
						className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
					>
						Recipes
					</Link>
					{user ? (
						<>
							<Link
								to="/my-recipes"
								onClick={close}
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								My Recipes
							</Link>
							<Link
								to="/liked-recipes"
								onClick={close}
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								Liked Recipes
							</Link>
							<Link
								to="/weekly-plan"
								onClick={close}
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								Weekly Plan
							</Link>
							{user?.role === "admin" && (
								<Link
									to="/admin/recipes"
									onClick={close}
									className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
								>
									Admin
								</Link>
							)}
							<Link
								to="/my-recipes/new"
								onClick={close}
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								Add Recipe
							</Link>
							<button
								type="button"
								onClick={signOut}
								className="self-start h-9 px-4 text-sm font-medium rounded-sm bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors"
							>
								Sign out
							</button>
						</>
					) : (
						<>
							{pathname !== "/sign-in" && (
								<Link
									to="/sign-in"
									onClick={close}
									className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
								>
									Sign in
								</Link>
							)}
							{pathname !== "/sign-up" && (
								<Link
									to="/sign-up"
									onClick={close}
									className="self-start h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
								>
									Sign up
								</Link>
							)}
						</>
					)}
				</div>
			)}
		</header>
	);
}
