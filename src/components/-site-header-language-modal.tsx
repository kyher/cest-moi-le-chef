import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "fr", label: "Français" },
] as const;

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

export function LanguageModal({ isOpen, onClose }: Props) {
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
