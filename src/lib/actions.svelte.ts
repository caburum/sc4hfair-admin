import type { Action } from 'svelte/action';

export const selectOnClick: Action<HTMLPreElement> = (node) => {
	const select = () => {
		const range = document.createRange();
		range.selectNodeContents(node);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	};

	$effect(() => {
		node.addEventListener('click', select);
		return () => {
			node.removeEventListener('click', select);
		};
	});
};
