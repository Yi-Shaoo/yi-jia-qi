/** 小爱心特效：从某个元素中心向外飘几颗心 */
const COLORS = ["#e8577a", "#f2a3b7", "#ffc96b"];

export function reducedMotion() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function heartBurst(el: Element | null | undefined, count = 7, spread = 40) {
	if (!el || reducedMotion()) return;
	const r = el.getBoundingClientRect();
	const cx = r.left + r.width / 2;
	const cy = r.top + r.height / 2;
	for (let i = 0; i < count; i++) {
		const s = document.createElement("span");
		s.textContent = i % 3 === 1 ? "✦" : "♥";
		const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
		const dist = spread * (0.8 + Math.random() * 0.5);
		Object.assign(s.style, {
			position: "fixed",
			left: `${cx - 6}px`,
			top: `${cy - 9}px`,
			color: COLORS[i % 3],
			fontSize: `${12 + Math.random() * 8}px`,
			pointerEvents: "none",
			zIndex: "100",
		});
		s.style.setProperty("--dx", `${Math.round(Math.cos(a) * dist)}px`);
		s.style.setProperty("--dy", `${Math.round(Math.sin(a) * dist * 0.8 - 10)}px`);
		s.className = "animate-float-up";
		document.body.appendChild(s);
		setTimeout(() => s.remove(), 900);
	}
}

export function pick<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

/** 撒糖针：彩色糖针从屏幕顶端落下（配色取自布丁头上的糖针） */
const SPRINKLES = ["#a8e3f2", "#fde58a", "#caf2c0", "#d7c4ff", "#f08aa6", "#ffb4c8"];

export function sprinkleRain(count = 56) {
	if (reducedMotion()) return;
	const h = window.innerHeight;
	for (let i = 0; i < count; i++) {
		const s = document.createElement("i");
		Object.assign(s.style, {
			position: "fixed",
			left: `${Math.random() * 100}vw`,
			top: "-16px",
			width: "4px",
			height: "11px",
			borderRadius: "2px",
			background: SPRINKLES[i % SPRINKLES.length],
			pointerEvents: "none",
			zIndex: "100",
		});
		s.setAttribute("aria-hidden", "true");
		document.body.appendChild(s);
		const r0 = Math.random() * 360, dx = Math.random() * 80 - 40;
		s.animate(
			[
				{ transform: `translate(0, 0) rotate(${r0}deg)`, opacity: 1 },
				{ offset: 0.85, opacity: 1 },
				{ transform: `translate(${dx}px, ${h * (0.75 + Math.random() * 0.35)}px) rotate(${r0 + Math.random() * 720 - 360}deg)`, opacity: 0 },
			],
			{ duration: 1300 + Math.random() * 900, delay: Math.random() * 400, easing: "cubic-bezier(.3,.1,.6,1)", fill: "backwards" },
		).onfinish = () => s.remove();
	}
}
