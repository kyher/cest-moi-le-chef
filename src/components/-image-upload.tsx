import { useRef } from "react";
import { useTranslation } from "react-i18next";

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
	previewUrl: string | null;
	onChange: (file: File, previewUrl: string) => void;
	onRemove: () => void;
}

export function ImageUpload({ previewUrl, onChange, onRemove }: Props) {
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement>(null);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_BYTES) {
			alert(t("recipeForm.fileTooLarge"));
			e.target.value = "";
			return;
		}
		const url = URL.createObjectURL(file);
		onChange(file, url);
	}

	return (
		<div className="space-y-1">
			<span className="text-sm font-medium text-stone-700">
				{t("recipeForm.coverImage")}
			</span>

			{previewUrl ? (
				<div className="relative w-full max-w-sm">
					<img
						src={previewUrl}
						alt="Cover"
						className="w-full aspect-video object-cover rounded-sm border border-stone-200"
					/>
					<div className="flex gap-2 mt-2">
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2"
						>
							{t("recipeForm.replace")}
						</button>
						<button
							type="button"
							onClick={onRemove}
							className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
						>
							{t("recipeForm.remove")}
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="flex items-center justify-center w-full max-w-sm aspect-video rounded-sm border-2 border-dashed border-stone-300 hover:border-stone-400 transition-colors text-sm text-stone-400 hover:text-stone-600"
				>
					{t("recipeForm.addImage")}
				</button>
			)}

			<input
				ref={inputRef}
				type="file"
				accept={ACCEPTED}
				className="hidden"
				onChange={handleFileChange}
			/>
		</div>
	);
}
