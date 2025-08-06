<script lang="ts">
	import { page } from '$app/state';
	import { addColors } from '$lib/charts';
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { AreaChart } from 'layerchart';

	let { data } = $props();

	const series = $derived(
		data.requests.length > 0 ?
			addColors(Object.keys(data.requests[0]).filter((key) => key !== 'startTime'))
		:	[]
	);

	let expand = $state(false);
</script>

<h1>requests by {page.params.type}</h1>

<label>
	<input type="checkbox" bind:checked={expand} />
	show by share
</label>

<AreaChart
	data={data.requests}
	x="startTime"
	{series}
	seriesLayout={expand ? 'stackExpand' : 'stack'}
	legend={{ placement: 'top-right' }}
/>

<!-- todo: add pie chart for shares over whole period -->

<DebugInfo {data} />
