export function thumbnail(image: HTMLImageElement, liftLandscape = false) {
	function fit() {
		const { naturalWidth, naturalHeight, clientWidth, clientHeight } = image;
		if (!naturalWidth || !naturalHeight) return;
		if (liftLandscape && naturalWidth > naturalHeight) {
			image.style.aspectRatio = String(Math.max(1, naturalWidth / naturalHeight / 1.2));
		} else {
			image.style.removeProperty("aspect-ratio");
		}
		image.style.objectFit = naturalWidth < clientWidth || naturalHeight < clientHeight ? "scale-down" : "cover";
	}
	const observer = new ResizeObserver(fit);
	observer.observe(image);
	image.addEventListener("load", fit);
	fit();
	return {
		update(value: boolean) { liftLandscape = value; fit(); },
		destroy() { observer.disconnect(); image.removeEventListener("load", fit); },
	};
}
