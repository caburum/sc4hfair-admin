<script lang="ts">
	import DebugInfo from '$lib/components/DebugInfo.svelte';

	let { data, form } = $props();
</script>

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
