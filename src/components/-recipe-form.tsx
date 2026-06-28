import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageUpload } from "#/components/-image-upload";

type FormData = {
	title: string;
	ingredients?: string;
	method?: string;
	totalTime?: number;
	servings?: number;
	isPublic: boolean;
	tags: string[];
};

type RecipeFormProps = {
	initialValues?: {
		title?: string;
		ingredients?: string;
		method?: string;
		totalTime?: number | null;
		servings?: number | null;
		tags?: string[];
		isPublic?: boolean;
		imageUrl?: string | null;
	};
	onSubmit: (
		data: FormData,
		image: { file: File | null; remove: boolean },
	) => Promise<void>;
	submitLabel: string;
	pendingLabel: string;
};

export function RecipeForm({
	initialValues,
	onSubmit,
	submitLabel,
	pendingLabel,
}: RecipeFormProps) {
	const { t } = useTranslation();
	const [title, setTitle] = useState(initialValues?.title ?? "");
	const [ingredients, setIngredients] = useState(
		initialValues?.ingredients ?? "",
	);
	const [method, setMethod] = useState(initialValues?.method ?? "");
	const [hours, setHours] = useState(
		initialValues?.totalTime
			? String(Math.floor(initialValues.totalTime / 60))
			: "",
	);
	const [minutes, setMinutes] = useState(
		initialValues?.totalTime ? String(initialValues.totalTime % 60) : "",
	);
	const [servings, setServings] = useState(
		initialValues?.servings ? String(initialValues.servings) : "",
	);
	const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
	const [tagInput, setTagInput] = useState("");
	const [isPublic, setIsPublic] = useState(initialValues?.isPublic ?? false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(
		initialValues?.imageUrl ?? null,
	);
	const [removeImage, setRemoveImage] = useState(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");

	function addTag(value: string) {
		const name = value.toLowerCase().trim();
		if (name && !tags.includes(name)) setTags([...tags, name]);
		setTagInput("");
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		setPending(true);
		setError("");
		try {
			const h = parseInt(hours, 10) || 0;
			const m = parseInt(minutes, 10) || 0;
			const totalTime = h * 60 + m || undefined;
			const parsedServings = parseInt(servings, 10) || undefined;
			await onSubmit(
				{
					title: title.trim(),
					ingredients: ingredients || undefined,
					method: method || undefined,
					totalTime,
					servings: parsedServings,
					isPublic,
					tags,
				},
				{ file: imageFile, remove: removeImage },
			);
		} catch {
			setError(t("recipeForm.saveFailed"));
			setPending(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && <p className="text-sm text-red-600">{error}</p>}

			<div className="space-y-1">
				<label htmlFor="title" className="text-sm font-medium text-stone-700">
					{t("recipeForm.title")} <span className="text-red-500">*</span>
				</label>
				<input
					id="title"
					type="text"
					required
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full h-9 px-3 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
				/>
			</div>

			<div className="space-y-1">
				<label
					htmlFor="tag-input"
					className="text-sm font-medium text-stone-700"
				>
					{t("recipeForm.tags")}
				</label>
				{tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mb-2">
						{tags.map((tag) => (
							<span
								key={tag}
								className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-sm bg-amber-50 text-stone-700 border border-amber-200"
							>
								{tag}
								<button
									type="button"
									onClick={() => setTags(tags.filter((t) => t !== tag))}
									className="text-stone-400 hover:text-stone-700 leading-none"
								>
									×
								</button>
							</span>
						))}
					</div>
				)}
				<input
					type="text"
					value={tagInput}
					onChange={(e) => setTagInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							addTag(tagInput);
						}
					}}
					onBlur={() => tagInput && addTag(tagInput)}
					id="tag-input"
					placeholder={t("recipeForm.tagsPlaceholder")}
					className="w-full h-9 px-3 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
				/>
			</div>

			<div className="space-y-1">
				<label
					htmlFor="total-time-hours"
					className="text-sm font-medium text-stone-700"
				>
					{t("recipeForm.totalTime")}
				</label>
				<div className="flex items-center gap-2">
					<input
						id="total-time-hours"
						type="number"
						min="0"
						value={hours}
						onChange={(e) => setHours(e.target.value)}
						placeholder="0"
						className="w-20 h-9 px-3 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
					/>
					<span className="text-sm text-stone-500">{t("recipeForm.hr")}</span>
					<input
						type="number"
						min="0"
						max="59"
						value={minutes}
						onChange={(e) => setMinutes(e.target.value)}
						placeholder="0"
						className="w-20 h-9 px-3 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
					/>
					<span className="text-sm text-stone-500">{t("recipeForm.min")}</span>
				</div>
			</div>

			<div className="space-y-1">
				<label
					htmlFor="servings"
					className="text-sm font-medium text-stone-700"
				>
					{t("recipeForm.servings")}
				</label>
				<div>
					<input
						id="servings"
						type="number"
						min="1"
						value={servings}
						onChange={(e) => setServings(e.target.value)}
						placeholder="0"
						className="w-20 h-9 px-3 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400"
					/>
				</div>
			</div>

			<div className="space-y-1">
				<label
					htmlFor="ingredients"
					className="text-sm font-medium text-stone-700"
				>
					{t("recipeForm.ingredients")}
				</label>
				<textarea
					id="ingredients"
					value={ingredients}
					onChange={(e) => setIngredients(e.target.value)}
					rows={6}
					className="w-full px-3 py-2 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-y"
				/>
			</div>

			<div className="space-y-1">
				<label htmlFor="method" className="text-sm font-medium text-stone-700">
					{t("recipeForm.method")}
				</label>
				<textarea
					id="method"
					value={method}
					onChange={(e) => setMethod(e.target.value)}
					rows={8}
					className="w-full px-3 py-2 text-sm rounded-sm bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-y"
				/>
			</div>

			<ImageUpload
				previewUrl={imagePreview}
				onChange={(file, url) => {
					setImageFile(file);
					setImagePreview(url);
					setRemoveImage(false);
				}}
				onRemove={() => {
					setImageFile(null);
					setImagePreview(null);
					setRemoveImage(true);
				}}
			/>

			<div className="flex items-center gap-3">
				<button
					type="button"
					role="switch"
					aria-checked={isPublic}
					onClick={() => setIsPublic(!isPublic)}
					className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
						isPublic ? "bg-amber-500" : "bg-stone-300"
					}`}
				>
					<span
						className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
							isPublic ? "translate-x-4.5" : "translate-x-0.5"
						}`}
					/>
				</button>
				<span className="text-sm text-stone-700">
					{isPublic ? t("recipeForm.public") : t("recipeForm.private")}
				</span>
			</div>

			<button
				type="submit"
				disabled={pending}
				className="h-9 px-6 text-sm font-medium rounded-sm bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
			>
				{pending ? pendingLabel : submitLabel}
			</button>
		</form>
	);
}
