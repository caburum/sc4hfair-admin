<script lang="ts">
	import DebugInfo from '$lib/components/DebugInfo.svelte';

	let { data, form } = $props();
</script>

<h1>deploy hook management</h1>

<p>
	you can manually trigger a vercel deployment if not done automatically. be mindful and stay within
	<a href="https://vercel.com/docs/limits#general-limits" target="_blank">the free plan limits</a>.
</p>

<form action="?/" method="post">
	{#each data.hooks as hook}
		<label>
			<input type="radio" name="id" value={hook} />
			{hook}
		</label>
	{/each}
	<button type="submit">trigger</button>
</form>

<DebugInfo data={form} />
