<script lang="ts">
	import { enhance } from '$app/forms';
	import Confetti from '$lib/components/Confetti.svelte';
	import DebugInfo from '$lib/components/DebugInfo.svelte';

	let { data, form } = $props();

	let confetti: Confetti;
</script>

<Confetti bind:this={confetti} />

<h1>deploy hook management</h1>

<p>
	you can manually trigger a vercel deployment if not done automatically. be mindful and stay within
	<a href="https://vercel.com/docs/limits#general-limits" target="_blank">the free plan limits</a>.
</p>

<form
	method="post"
	use:enhance={() => {
		return ({ result, update }) => {
			if (result.type === 'success') {
				confetti.fire();
				update();
			}
		};
	}}
>
	{#each data.hooks as hook}
		<label>
			<input type="radio" name="id" value={hook} />
			{hook}
		</label>
	{/each}
	<button type="submit">trigger</button>
</form>

<DebugInfo open data={form} />
