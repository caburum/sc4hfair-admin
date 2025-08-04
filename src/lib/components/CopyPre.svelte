<script lang="ts">
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	let pre: HTMLPreElement;
</script>

<div>
	<button
		onclick={({ currentTarget }) => {
			currentTarget.classList.add('accent');
			pre.textContent && navigator.clipboard.writeText(pre.textContent);
			setTimeout(() => {
				currentTarget.classList.remove('accent');
			}, 500);
		}}>📋</button
	>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<pre
		bind:this={pre}
		onclick={({ currentTarget }) => {
			const range = document.createRange();
			range.selectNodeContents(currentTarget);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}}>{@render children()}</pre>
</div>

<style>
	div {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--gap);
		align-items: center;
	}
	button {
		height: fit-content;
		transition: background-color 2s ease-in-out;
	}
	button:global(.accent) {
		transition: none;
	}
</style>
