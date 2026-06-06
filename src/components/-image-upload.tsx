import { useRef } from "react";

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
	previewUrl: string | null;
	onChange: (file: File, previewUrl: string) => void;
	onRemove: () => void;
}

export function ImageUpload({ previewUrl, onChange, onRemove }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > MAX_BYTES) {
			alert("File too large. Maximum size is 5 MB.");
			e.target.value = "";
			return;
		}
		const url = URL.createObjectURL(file);
		onChange(file, url);
	}

	return (
		<div className="space-y-1">
			<span className="text-sm font-medium text-stone-700">Cover Image</span>

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
							Replace
						</button>
						<button
							type="button"
							onClick={onRemove}
							className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
						>
							Remove
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="flex items-center justify-center w-full max-w-sm aspect-video rounded-sm border-2 border-dashed border-stone-300 hover:border-stone-400 transition-colors text-sm text-stone-400 hover:text-stone-600"
				>
					Add cover image
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
