import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "#/components/-site-header";
import { authClient } from "#/lib/auth-client";
import { getSession } from "#/lib/session";

export const Route = createFileRoute("/sign-in")({
	beforeLoad: async () => {
		const session = await getSession();
		if (session) throw redirect({ to: "/" });
	},
	component: SignIn,
});

function SignIn() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setPending(true);
		setError("");
		const { error } = await authClient.signIn.email({ email, password });
		setPending(false);
		if (error) {
			setError(error.message ?? "Sign in failed");
			return;
		}
		await router.navigate({ to: "/" });
	}

	return (
		<div className="min-h-screen flex flex-col">
			<SiteHeader user={null} />
			<div className="flex-1 flex items-center justify-center bg-stone-100">
				<div className="w-full max-w-sm p-8 bg-white border border-stone-200 shadow-sm">
					<h1 className="text-2xl font-bold font-serif text-stone-900 mb-6">
						Sign in
					</h1>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && <p className="text-sm text-red-600">{error}</p>}
						<div className="space-y-1">
							<label
								className="text-sm font-medium text-stone-700"
								htmlFor="email"
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full h-9 px-3 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
							/>
						</div>
						<div className="space-y-1">
							<label
								className="text-sm font-medium text-stone-700"
								htmlFor="password"
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full h-9 px-3 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
							/>
						</div>
						<button
							type="submit"
							disabled={pending}
							className="w-full h-9 px-4 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
						>
							{pending ? "Signing in…" : "Sign in"}
						</button>
					</form>
					<p className="mt-4 text-sm text-stone-500">
						No account?{" "}
						<Link
							to="/sign-up"
							className="text-stone-800 underline underline-offset-2"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
