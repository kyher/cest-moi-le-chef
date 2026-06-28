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

function LanguageModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const { i18n, t } = useTranslation();
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen) {
			dialog.showModal();
		} else {
			dialog.close();
		}
	}, [isOpen]);

	const current = i18n.resolvedLanguage ?? "en";

	return (
		<dialog
			ref={dialogRef}
			onCancel={onClose}
			className="m-auto w-full max-w-xs rounded-sm border border-stone-200 p-0 shadow-lg backdrop:bg-black/40"
		>
			<div className="p-6">
				<h2 className="text-base font-semibold text-stone-900 mb-4">
					{t("nav.selectLanguage")}
				</h2>
				<div className="flex flex-col gap-2">
					{LANGUAGES.map(({ code, label }) => (
						<button
							key={code}
							type="button"
							onClick={() => {
								void i18n.changeLanguage(code);
								onClose();
							}}
							className={`w-full text-left px-4 py-2.5 text-sm rounded-sm border transition-colors ${
								current === code
									? "border-stone-800 bg-stone-800 text-white font-medium"
									: "border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
							}`}
						>
							{label}
						</button>
					))}
				</div>
			</div>
		</dialog>
	);
}

export function SiteHeader({ user }: Props) {
	const { t } = useTranslation();
	const router = useRouter();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [mobileOpen, setMobileOpen] = useState(false);
	const [langModalOpen, setLangModalOpen] = useState(false);

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

				<div className="flex items-center gap-2">
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
					</div>

					{/* Globe button — all viewports */}
					<button
						type="button"
						onClick={() => setLangModalOpen(true)}
						aria-label={t("nav.selectLanguage")}
						className="flex items-center text-stone-500 hover:text-stone-900 transition-colors p-1"
					>
						<Globe2 size={16} />
					</button>

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
				</div>
			)}

			<LanguageModal
				isOpen={langModalOpen}
				onClose={() => setLangModalOpen(false)}
			/>
		</header>
	);
}
