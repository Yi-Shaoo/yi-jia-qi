/** 地点 → spots 集合里的文档 id（和旧版同一个哈希，旧数据能对上） */
export function spotKey(name: string): string {
	let h = 5381;
	for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) | 0;
	return `s${(h >>> 0).toString(36)}`;
}

export function spotColorIndex(name: string): number {
	return Math.abs(parseInt(spotKey(name).slice(1), 36)) % 6;
}
