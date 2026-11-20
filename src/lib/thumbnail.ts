export function thumbnail(image: HTMLImageElement) {
	function fit() {
		const { naturalWidth, naturalHeight, clientWidth, clientHeight } = image;
		if (!naturalWidth || !naturalHeight) return;
		image.style.objectFit = naturalWidth < clientWidth || naturalHeight < clientHeight ? "scale-down" : "cover";
	}
	const observer = new ResizeObserver(fit);
	observer.observe(image);
	image.addEventListener("load", fit);
	fit();
	return { destroy() { observer.disconnect(); image.removeEventListener("load", fit); } };
}
