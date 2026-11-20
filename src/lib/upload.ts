import { accountApi, ApiError } from "./api";

export function photoFailure(error: unknown): { message: string; retryable: boolean } {
	if (error instanceof ApiError) {
		if (error.status === 413) return { message: "照片太大，请缩小后重新选择。", retryable: false };
		if (error.status === 415) return { message: "服务器不支持这种图片格式，请重新选择。", retryable: false };
		if (error.status === 401) return { message: "登录已失效，请重新登录。", retryable: false };
		if (error.status === 403) return { message: "没有保存照片的权限。", retryable: false };
		if ([408, 425, 429].includes(error.status) || error.status >= 500) return { message: "服务器暂不可用，请稍后重试。", retryable: true };
		if (error.status >= 400) return { message: "服务器未接受这张照片，请重新选择。", retryable: false };
	}
	if (error instanceof Error) {
		if (error.message === "decode") return { message: "无法读取为图片，请重新选择 JPG、PNG 等图片。", retryable: false };
		if (error.message === "encode") return { message: "浏览器没能转换这张照片，请缩小图片或重新选择。", retryable: false };
		if (error.message === "upload-receipt") return { message: "未收到照片上传确认，请重试。", retryable: true };
		if (error instanceof TypeError || error.name === "NetworkError" || error.name === "TimeoutError") {
			return { message: "网络连接失败，请检查网络后重试。", retryable: true };
		}
	}
	return { message: "照片上传失败，请重试。", retryable: true };
}

export function photoErrorMessage(error: unknown): string {
	return photoFailure(error).message;
}

export async function toJpeg(file: File, max = 1800): Promise<Blob> {
	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () => reject(new Error("decode"));
			image.src = url;
		});
		if (!img.naturalWidth || !img.naturalHeight) throw new Error("decode");
		try {
			const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
			const canvas = document.createElement("canvas");
			canvas.width = Math.max(1, Math.round(img.naturalWidth * k));
			canvas.height = Math.max(1, Math.round(img.naturalHeight * k));
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("encode");
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			return await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.85);
			});
		} catch {
			throw new Error("encode");
		}
	} finally {
		URL.revokeObjectURL(url);
	}
}

export async function uploadPhoto(file: File, api = accountApi()): Promise<string> {
	const blob = await toJpeg(file);
	const fd = new FormData();
	fd.append("file", blob, "photo.jpg");
	const r = await api<{ id?: unknown } | null>("/files", { method: "POST", body: fd });
	if (typeof r?.id !== "string" || !/^[0-9a-f]{32}$/.test(r.id)) throw new Error("upload-receipt");
	return r.id;
}

export async function deletePhoto(id: string) {
	await accountApi()(`/files/${id}`, { method: "DELETE" }).catch(() => {});
}
