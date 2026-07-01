import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DesktopNav } from "#/components/-site-header-desktop-nav";
import { LanguageModal } from "#/components/-site-header-language-modal";
import { MobileNav } from "#/components/-site-header-mobile-nav";
import type { HeaderUser } from "#/components/-site-header-types";
import { authClient } from "#/lib/auth-client";

interface Props {
	user: HeaderUser | null;
}

export function SiteHeader({ user }: Props) {
	const { t } = useTranslation();
	const router = useRouter();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [mobileOpen, setMobileOpen] = useState(false);
	const [langModalOpen, setLangModalOpen] = useState(false);

	const closeMobile = () => setMobileOpen(false);
	const openLanguage = () => setLangModalOpen(true);

	const signOut = () => {
		void authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					closeMobile();
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
					onClick={closeMobile}
					className="font-serif italic text-lg text-stone-900 hover:text-stone-600 transition-colors"
				>
					c'est moi le chef
				</Link>

				<div className="flex items-center gap-2">
					<DesktopNav
						user={user}
						pathname={pathname}
						onSignOut={signOut}
						onOpenLanguage={openLanguage}
					/>

					{/* Globe button — signed-out visitors only; authenticated users find it under the User menu */}
					{!user && (
						<button
							type="button"
							onClick={openLanguage}
							aria-label={t("nav.selectLanguage")}
							className="flex items-center text-stone-500 hover:text-stone-900 transition-colors p-1"
						>
							<Globe2 size={16} />
						</button>
					)}

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

			{mobileOpen && (
				<MobileNav
					user={user}
					pathname={pathname}
					onNavigate={closeMobile}
					onSignOut={signOut}
					onOpenLanguage={openLanguage}
				/>
			)}

			<LanguageModal
				isOpen={langModalOpen}
				onClose={() => setLangModalOpen(false)}
			/>
		</header>
	);
}
