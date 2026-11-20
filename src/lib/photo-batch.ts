import { accountApi } from "./api";
import { photoFailure, uploadPhoto } from "./upload";

export interface SelectedPhoto {
	file: File;
	asset?: string;
	error?: ReturnType<typeof photoFailure>;
}

type BatchOptions<T> = {
	upload?: typeof uploadPhoto;
	onProgress?: (position: number, total: number) => void;
	addToAlbum?: (item: T, asset: string) => Promise<unknown>;
};

export async function uploadBatch<T extends SelectedPhoto>(items: T[], { upload, onProgress, addToAlbum }: BatchOptions<T> = {}) {
	const api = accountApi();
	const send = upload ?? ((file: File) => uploadPhoto(file, api));
	const pending = items.filter((item) => item.error?.retryable !== false);
	for (const [i, item] of pending.entries()) {
		onProgress?.(i + 1, pending.length);
		try {
			item.asset ??= await send(item.file);
			await addToAlbum?.(item, item.asset);
			item.error = undefined;
		} catch (e) {
			const failure = photoFailure(e);
			item.error = item.asset && failure.retryable ? { message: "照片已上传，但未能确认存入相册，请重试保存。", retryable: true } : failure;
		}
	}
}
