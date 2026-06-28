import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";

import "#/i18n/index";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	notFoundComponent: NotFound,
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "C'est moi le chef",
			},
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍳</text></svg>",
			},
		],
	}),
	shellComponent: RootDocument,
});

function NotFound() {
	const { t } = useTranslation();
	return (
		<div className="min-h-screen flex flex-col items-center justify-center px-4">
			<div className="text-center space-y-4">
				<h1 className="text-5xl font-bold font-serif text-stone-900">404</h1>
				<p className="text-lg text-stone-600">{t("notFound.title")}</p>
				<Link
					to="/"
					className="inline-flex h-11 px-6 text-sm font-medium rounded-sm border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors items-center justify-center"
				>
					{t("notFound.goHome")}
				</Link>
			</div>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const { i18n } = useTranslation();

	useEffect(() => {
		document.documentElement.lang = i18n.resolvedLanguage ?? "en";
	}, [i18n.resolvedLanguage]);

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Toaster />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
