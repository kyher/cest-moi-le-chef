import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { adminBanUser, getAdminUsers } from "#/lib/admin-fns";

export const Route = createFileRoute("/admin/users")({
	loader: () => getAdminUsers(),
	component: AdminUsersPage,
});

type User = Awaited<ReturnType<typeof getAdminUsers>>[number];

function AdminUsersPage() {
	const users = Route.useLoaderData();
	const router = useRouter();
	const [banTarget, setBanTarget] = useState<User | null>(null);
	const [pending, setPending] = useState(false);

	if (users.length === 0) {
		return <p className="text-stone-500 text-sm">No users.</p>;
	}

	async function handleBan(
		banReason: string | undefined,
		banExpires: string | undefined,
	) {
		if (!banTarget) return;
		setPending(true);
		try {
			await adminBanUser({
				data: { userId: banTarget.id, banReason, banExpires },
			});
			toast("User banned and recipes deleted.");
			setBanTarget(null);
			await router.invalidate();
		} catch {
			toast.error("Action failed.");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="pb-12">
			<p className="text-sm text-stone-500 mb-6">
				{users.length} {users.length === 1 ? "user" : "users"}
			</p>
			<div className="space-y-3">
				{users.map((user) => (
					<UserRow key={user.id} user={user} onBan={() => setBanTarget(user)} />
				))}
			</div>
			{banTarget && (
				<BanModal
					user={banTarget}
					pending={pending}
					onConfirm={handleBan}
					onCancel={() => setBanTarget(null)}
				/>
			)}
		</div>
	);
}

function UserRow({ user, onBan }: { user: User; onBan: () => void }) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 p-4 rounded-sm border border-stone-200 bg-white">
			<div className="min-w-0">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium text-stone-900">{user.name}</p>
					<span className="text-xs text-stone-400">@{user.username}</span>
					{user.banned && (
						<span className="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700">
							Banned
						</span>
					)}
					{user.role === "admin" && (
						<span className="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700">
							Admin
						</span>
					)}
				</div>
				<p className="text-xs text-stone-500 mt-0.5">
					{user.email} · {user._count.recipes}{" "}
					{user._count.recipes === 1 ? "recipe" : "recipes"} · joined{" "}
					{new Date(user.createdAt).toLocaleDateString()}
				</p>
			</div>

			{!user.banned && user.role !== "admin" && (
				<button
					type="button"
					onClick={onBan}
					className="h-8 px-3 text-xs font-medium rounded-sm border border-red-300 text-red-700 hover:bg-red-50 transition-colors flex-shrink-0"
				>
					Ban
				</button>
			)}
		</div>
	);
}

function BanModal({
	user,
	pending,
	onConfirm,
	onCancel,
}: {
	user: User;
	pending: boolean;
	onConfirm: (
		banReason: string | undefined,
		banExpires: string | undefined,
	) => void;
	onCancel: () => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [banReason, setBanReason] = useState("");
	const [banExpires, setBanExpires] = useState("");

	useEffect(() => {
		dialogRef.current?.showModal();
		return () => dialogRef.current?.close();
	}, []);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		onConfirm(banReason.trim() || undefined, banExpires || undefined);
	}

	return (
		<dialog
			ref={dialogRef}
			onCancel={onCancel}
			className="m-auto w-full max-w-md rounded-sm border border-stone-200 p-0 shadow-lg backdrop:bg-black/40"
		>
			<form onSubmit={handleSubmit}>
				<div className="p-6 space-y-5">
					<div>
						<h2 className="text-base font-semibold text-stone-900">
							Ban {user.name}
						</h2>
						<p className="text-sm text-stone-500 mt-1">
							This will permanently delete all of their recipes and block them
							from signing in.
						</p>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="ban-reason"
							className="text-sm font-medium text-stone-700"
						>
							Reason{" "}
							<span className="text-stone-400 font-normal">(optional)</span>
						</label>
						<textarea
							id="ban-reason"
							value={banReason}
							onChange={(e) => setBanReason(e.target.value)}
							rows={3}
							placeholder="e.g. Offensive content in multiple recipes"
							className="w-full px-3 py-2 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none"
						/>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="ban-expires"
							className="text-sm font-medium text-stone-700"
						>
							Ban expires{" "}
							<span className="text-stone-400 font-normal">
								(optional — leave blank for permanent)
							</span>
						</label>
						<input
							id="ban-expires"
							type="date"
							value={banExpires}
							min={new Date().toISOString().split("T")[0]}
							onChange={(e) => setBanExpires(e.target.value)}
							className="w-full h-9 px-3 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-2 px-6 py-4 border-t border-stone-200">
					<button
						type="button"
						onClick={onCancel}
						disabled={pending}
						className="h-9 px-4 text-sm font-medium rounded-sm border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={pending}
						className="h-9 px-4 text-sm font-medium rounded-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
					>
						{pending ? "Banning…" : "Ban user"}
					</button>
				</div>
			</form>
		</dialog>
	);
}
