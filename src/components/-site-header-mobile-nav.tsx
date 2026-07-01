import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { HeaderUser } from "#/components/-site-header-types";

const RECIPES_PATHS = [
	"/recipes",
	"/my-recipes",
	"/liked-recipes",
	"/my-collections",
];

const topLevelLinkProps = {
	activeOptions: { exact: true } as const,
	activeProps: { className: "font-medium text-stone-900" },
	inactiveProps: { className: "text-stone-600" },
	className: "py-2 text-sm hover:text-stone-900 transition-colors",
};

const subLinkProps = {
	activeOptions: { exact: true } as const,
	activeProps: { className: "font-medium text-stone-900" },
	inactiveProps: { className: "text-stone-600" },
	className: "block py-2 text-sm hover:text-stone-900 transition-colors",
};

interface Props {
	user: HeaderUser | null;
	pathname: string;
	onNavigate: () => void;
	onSignOut: () => void;
	onOpenLanguage: () => void;
}

export function MobileNav({
	user,
	pathname,
	onNavigate,
	onSignOut,
	onOpenLanguage,
}: Props) {
	const { t } = useTranslation();
	const [recipesOpen, setRecipesOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const recipesActive = RECIPES_PATHS.includes(pathname);

	return (
		<div className="md:hidden border-t border-stone-200 px-4 py-3 flex flex-col gap-1">
			{user ? (
				<>
					<button
						type="button"
						onClick={() => setRecipesOpen((o) => !o)}
						aria-expanded={recipesOpen}
						className={`flex items-center justify-between py-2 text-sm transition-colors ${
							recipesActive ? "font-medium text-stone-900" : "text-stone-600"
						}`}
					>
						{t("nav.recipes")}
						<ChevronDown
							size={14}
							className={`transition-transform ${recipesOpen ? "rotate-180" : ""}`}
						/>
					</button>
					{recipesOpen && (
						<div className="flex flex-col pl-3 ml-1 border-l border-stone-200 mb-1">
							<Link to="/recipes" onClick={onNavigate} {...subLinkProps}>
								{t("nav.allRecipes")}
							</Link>
							<Link to="/my-recipes" onClick={onNavigate} {...subLinkProps}>
								{t("nav.myRecipes")}
							</Link>
							<Link to="/liked-recipes" onClick={onNavigate} {...subLinkProps}>
								{t("nav.likedRecipes")}
							</Link>
							<Link to="/my-collections" onClick={onNavigate} {...subLinkProps}>
								{t("nav.myCollections")}
							</Link>
						</div>
					)}
					<Link to="/weekly-plan" onClick={onNavigate} {...topLevelLinkProps}>
						{t("nav.weeklyPlan")}
					</Link>
					{user.role === "admin" && (
						<Link
							to="/admin/recipes"
							onClick={onNavigate}
							{...topLevelLinkProps}
						>
							{t("nav.admin")}
						</Link>
					)}
					<div className="border-t border-stone-200 my-2" />
					<Link
						to="/my-recipes/new"
						onClick={onNavigate}
						className="self-start h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
					>
						{t("nav.addRecipe")}
					</Link>
					<button
						type="button"
						onClick={() => setAccountOpen((o) => !o)}
						aria-expanded={accountOpen}
						className="flex items-center justify-between py-2 mt-2 text-sm text-stone-600"
					>
						{t("nav.account")}
						<ChevronDown
							size={14}
							className={`transition-transform ${accountOpen ? "rotate-180" : ""}`}
						/>
					</button>
					{accountOpen && (
						<div className="flex flex-col gap-2 pl-3 ml-1 border-l border-stone-200">
							{user.username && (
								<Link
									to="/profile/$username"
									params={{ username: user.username }}
									onClick={onNavigate}
									{...subLinkProps}
								>
									{t("nav.myProfile")}
								</Link>
							)}
							<button
								type="button"
								onClick={() => {
									onNavigate();
									onOpenLanguage();
								}}
								className="text-left py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
							>
								{t("nav.selectLanguage")}
							</button>
							<button
								type="button"
								onClick={onSignOut}
								className="self-start h-9 px-4 text-sm font-medium rounded-sm bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors"
							>
								{t("nav.signOut")}
							</button>
						</div>
					)}
				</>
			) : (
				<>
					<Link to="/recipes" onClick={onNavigate} {...topLevelLinkProps}>
						{t("nav.allRecipes")}
					</Link>
					<div className="border-t border-stone-200 my-2" />
					{pathname !== "/sign-in" && (
						<Link
							to="/sign-in"
							onClick={onNavigate}
							className="self-start h-9 px-4 text-sm font-medium rounded-sm bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors flex items-center"
						>
							{t("nav.signIn")}
						</Link>
					)}
					{pathname !== "/sign-up" && (
						<Link
							to="/sign-up"
							onClick={onNavigate}
							className="self-start h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
						>
							{t("nav.signUp")}
						</Link>
					)}
				</>
			)}
		</div>
	);
}
