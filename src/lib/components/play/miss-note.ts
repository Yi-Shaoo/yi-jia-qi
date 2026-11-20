export interface MissNoteDraft {
	text: string;
	edits: number;
	sending: boolean;
}

export async function sendMissNote(draft: MissNoteDraft, save: (text: string) => Promise<void>) {
	const text = draft.text.trim();
	if (!text || draft.sending) return;
	const edits = draft.edits;
	draft.sending = true;
	try {
		await save(text.slice(0, 40));
		if (draft.edits === edits) draft.text = "";
	} finally {
		draft.sending = false;
	}
}
