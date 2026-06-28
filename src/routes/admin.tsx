import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "#/components/-site-header";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ to: "/sign-in" });
		if (session.user.role !== "admin") throw redirect({ to: "/" });
		return { session };
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { session } = Route.useRouteContext();
	const { t } = useTranslation();
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	const navLink = (to: string, label: string) => (
		<Link
			to={to}
			className={`text-sm font-medium transition-colors ${
				pathname.startsWith(to)
					? "text-stone-900 border-b-2 border-stone-900 pb-1"
					: "text-stone-500 hover:text-stone-900"
			}`}
		>
			{label}
		</Link>
	);

	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session.user} />
			<div className="w-3/4 mx-auto">
				<div className="pt-8 pb-4 flex items-center justify-between border-b border-stone-200 mb-8">
					<h1 className="text-2xl font-bold font-serif text-stone-900">
						{t("admin.title")}
					</h1>
					<nav className="flex gap-6">
						{navLink("/admin/recipes", t("admin.recipes"))}
						{navLink("/admin/users", t("admin.users"))}
					</nav>
				</div>
				<Outlet />
			</div>
		</div>
	);
}
