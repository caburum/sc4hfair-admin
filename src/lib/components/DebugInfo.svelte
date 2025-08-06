<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		data,
		open = $bindable(),
		children
	}: {
		data?: any;
		open: boolean;
		children?: Snippet;
	} = $props();
</script>

<details {open}>
	<summary>debug info</summary>
	{#if data !== undefined}<pre>{JSON.stringify(data, null, '\t')}</pre>{/if}
	{#if children}{@render children()}{/if}
</details>

<style>
	details {
		margin-top: auto !important;
	}
	details summary {
		font-size: 1.5em;
		font-weight: 600;
	}
</style>
