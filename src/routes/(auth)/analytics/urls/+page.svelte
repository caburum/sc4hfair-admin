<script lang="ts">
	import DebugInfo from '$lib/components/DebugInfo.svelte';

	let { data } = $props();
</script>

<h1>urls</h1>

<table>
	<thead>
		<tr>
			<th>url</th>
			<th>count</th>
		</tr>
	</thead>
	<tbody>
		{#each data.urls as { _id, count } (_id)}
			<tr>
				<td>{_id}</td>
				<td>{count}</td>
			</tr>
		{/each}
	</tbody>
</table>

<DebugInfo {data} />
