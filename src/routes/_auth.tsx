import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SiteHeader } from "#/components/-site-header";
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
	const { session } = Route.useRouteContext();

	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={session.user} />
			<div className="w-3/4 mx-auto">
				<Outlet />
			</div>
		</div>
	);
}
