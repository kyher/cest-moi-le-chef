import { Link } from "@tanstack/react-router";
import { ChevronDown, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { HeaderUser } from "#/components/-site-header-types";

const RECIPES_PATHS = [
	"/recipes",
	"/my-recipes",
	"/liked-recipes",
	"/my-collections",
];

const menuItemProps = {
	activeOptions: { exact: true } as const,
	activeProps: { className: "font-medium text-stone-900 bg-stone-50" },
	inactiveProps: { className: "text-stone-600" },
	className:
		"block px-4 py-2 text-sm hover:bg-stone-50 hover:text-stone-900 transition-colors",
	role: "menuitem" as const,
};

function useDropdown() {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const handlePointerDown = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	return { open, setOpen, ref };
}

interface Props {
	user: HeaderUser | null;
	pathname: string;
	onSignOut: () => void;
	onOpenLanguage: () => void;
}

export function DesktopNav({
	user,
	pathname,
	onSignOut,
	onOpenLanguage,
}: Props) {
	const { t } = useTranslation();
	const recipesDropdown = useDropdown();
	const userDropdown = useDropdown();
	const recipesActive = RECIPES_PATHS.includes(pathname);

	return (
		<div className="hidden md:flex items-center gap-3">
			{user ? (
				<div className="relative" ref={recipesDropdown.ref}>
					<button
						type="button"
						onClick={() => recipesDropdown.setOpen((o) => !o)}
						aria-haspopup="menu"
						aria-expanded={recipesDropdown.open}
						className={`flex items-center gap-1 text-sm transition-colors ${
							recipesActive
								? "font-medium text-stone-900"
								: "text-stone-600 hover:text-stone-900"
						}`}
					>
						{t("nav.recipes")}
						<ChevronDown size={14} />
					</button>
					{recipesDropdown.open && (
						<div
							role="menu"
							className="absolute left-0 top-full mt-2 w-44 bg-white border border-stone-200 rounded-sm shadow-lg py-1 z-20"
						>
							<Link
								to="/recipes"
								onClick={() => recipesDropdown.setOpen(false)}
								{...menuItemProps}
							>
								{t("nav.allRecipes")}
							</Link>
							<Link
								to="/my-recipes"
								onClick={() => recipesDropdown.setOpen(false)}
								{...menuItemProps}
							>
								{t("nav.myRecipes")}
							</Link>
							<Link
								to="/liked-recipes"
								onClick={() => recipesDropdown.setOpen(false)}
								{...menuItemProps}
							>
								{t("nav.likedRecipes")}
							</Link>
							<Link
								to="/my-collections"
								onClick={() => recipesDropdown.setOpen(false)}
								{...menuItemProps}
							>
								{t("nav.myCollections")}
							</Link>
						</div>
					)}
				</div>
			) : (
				<Link
					to="/recipes"
					activeOptions={{ exact: true }}
					activeProps={{ className: "font-medium text-stone-900" }}
					inactiveProps={{ className: "text-stone-600" }}
					className="text-sm hover:text-stone-900 transition-colors"
				>
					{t("nav.allRecipes")}
				</Link>
			)}
			{user && (
				<>
					<Link
						to="/weekly-plan"
						activeOptions={{ exact: true }}
						activeProps={{ className: "font-medium text-stone-900" }}
						inactiveProps={{ className: "text-stone-600" }}
						className="text-sm hover:text-stone-900 transition-colors"
					>
						{t("nav.weeklyPlan")}
					</Link>
					{user.role === "admin" && (
						<Link
							to="/admin/recipes"
							activeOptions={{ exact: true }}
							activeProps={{ className: "font-medium text-stone-900" }}
							inactiveProps={{ className: "text-stone-600" }}
							className="text-sm hover:text-stone-900 transition-colors"
						>
							{t("nav.admin")}
						</Link>
					)}
					<div className="border-l border-stone-300 h-4" />
					<Link
						to="/my-recipes/new"
						className="h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 transition-colors flex items-center"
					>
						{t("nav.addRecipe")}
					</Link>
					<div className="relative" ref={userDropdown.ref}>
						<button
							type="button"
							onClick={() => userDropdown.setOpen((o) => !o)}
							aria-haspopup="menu"
							aria-expanded={userDropdown.open}
							aria-label={t("nav.account")}
							className="flex items-center justify-center h-9 w-9 rounded-sm border border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
						>
							<UserIcon size={16} />
						</button>
						{userDropdown.open && (
							<div
								role="menu"
								className="absolute right-0 top-full mt-2 w-44 bg-white border border-stone-200 rounded-sm shadow-lg py-1 z-20"
							>
								{user.username && (
									<Link
										to="/profile/$username"
										params={{ username: user.username }}
										onClick={() => userDropdown.setOpen(false)}
										{...menuItemProps}
									>
										{t("nav.myProfile")}
									</Link>
								)}
								<button
									type="button"
									onClick={() => {
										userDropdown.setOpen(false);
										onOpenLanguage();
									}}
									role="menuitem"
									className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
								>
									{t("nav.selectLanguage")}
								</button>
								<button
									type="button"
									onClick={onSignOut}
									role="menuitem"
									className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
								>
									{t("nav.signOut")}
								</button>
							</div>
						)}
					</div>
				</>
			)}
			{!user && (
				<>
					<div className="border-l border-stone-300 h-4" />
					{pathname !== "/sign-in" && (
						<Link
							to="/sign-in"
							className="h-9 px-4 text-sm font-medium rounded-sm bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors flex items-center"
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
		</div>
	);
}
