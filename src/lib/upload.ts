import { api } from "./api";

/** 浏览器里把照片缩到最长边 1800px 并转成 JPG（手机 HEIC 也能在支持的浏览器里转换） */
export function toJpeg(file: File, max = 1800): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
			const c = document.createElement("canvas");
			c.width = Math.round(img.naturalWidth * k);
			c.height = Math.round(img.naturalHeight * k);
			c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
			URL.revokeObjectURL(url);
			c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("decode"));
		};
		img.src = url;
	});
}

/** 上传一张照片，返回文件 id */
export async function uploadPhoto(file: File): Promise<string> {
	const blob = await toJpeg(file);
	const fd = new FormData();
	fd.append("file", blob, "photo.jpg");
	const r = await api<{ id: string }>("/files", { method: "POST", body: fd });
	return r.id;
}

export async function deletePhoto(id: string) {
	await api(`/files/${id}`, { method: "DELETE" }).catch(() => {});
}
