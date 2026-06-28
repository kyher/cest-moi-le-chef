import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "#/lib/auth-client";

interface Props {
	user: { name: string; role?: string | null } | null;
}

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "fr", label: "Français" },
] as const;

function LanguageDropdown() {
	const { i18n } = useTranslation();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	const current = i18n.resolvedLanguage ?? "en";

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-label="Select language"
				aria-expanded={open}
				className="flex items-center text-stone-500 hover:text-stone-900 transition-colors"
			>
				<Globe2 size={16} />
			</button>
			{open && (
				<div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 shadow-sm py-1 z-20 min-w-[8rem]">
					{LANGUAGES.map(({ code, label }) => (
						<button
							key={code}
							type="button"
							onClick={() => {
								void i18n.changeLanguage(code);
								setOpen(false);
							}}
							className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-stone-50 ${
								current === code
									? "text-stone-900 font-medium"
									: "text-stone-600"
							}`}
						>
							{label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function SiteHeader({ user }: Props) {
	const { t } = useTranslation();
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
						{t("nav.recipes")}
					</Link>
					{user ? (
						<>
							<Link
								to="/my-recipes"
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.myRecipes")}
							</Link>
							<Link
								to="/liked-recipes"
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.likedRecipes")}
							</Link>
							<Link
								to="/weekly-plan"
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.weeklyPlan")}
							</Link>
							{user?.role === "admin" && (
								<Link
									to="/admin/recipes"
									className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
								>
									{t("nav.admin")}
								</Link>
							)}
							<Link
								to="/my-recipes/new"
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.addRecipe")}
							</Link>
							<button
								type="button"
								onClick={signOut}
								className="h-9 px-4 text-sm font-medium rounded-sm bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors"
							>
								{t("nav.signOut")}
							</button>
						</>
					) : (
						<>
							{pathname !== "/sign-in" && (
								<Link
									to="/sign-in"
									className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
								>
									{t("nav.signIn")}
								</Link>
							)}
							{pathname !== "/sign-up" && (
								<Link
									to="/sign-up"
									className="h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
								>
									{t("nav.signUp")}
								</Link>
							)}
						</>
					)}
					<LanguageDropdown />
				</div>

				{/* Mobile hamburger */}
				<button
					type="button"
					onClick={() => setMobileOpen((o) => !o)}
					aria-label={t("nav.toggleMenu")}
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
						{t("nav.recipes")}
					</Link>
					{user ? (
						<>
							<Link
								to="/my-recipes"
								onClick={close}
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.myRecipes")}
							</Link>
							<Link
								to="/liked-recipes"
								onClick={close}
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.likedRecipes")}
							</Link>
							<Link
								to="/weekly-plan"
								onClick={close}
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.weeklyPlan")}
							</Link>
							{user?.role === "admin" && (
								<Link
									to="/admin/recipes"
									onClick={close}
									className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
								>
									{t("nav.admin")}
								</Link>
							)}
							<Link
								to="/my-recipes/new"
								onClick={close}
								className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.addRecipe")}
							</Link>
							<button
								type="button"
								onClick={signOut}
								className="self-start h-9 px-4 text-sm font-medium rounded-sm bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors"
							>
								{t("nav.signOut")}
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
									{t("nav.signIn")}
								</Link>
							)}
							{pathname !== "/sign-up" && (
								<Link
									to="/sign-up"
									onClick={close}
									className="self-start h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
								>
									{t("nav.signUp")}
								</Link>
							)}
						</>
					)}
					<div className="flex items-center gap-2">
						<LanguageDropdown />
					</div>
				</div>
			)}
		</header>
	);
}
