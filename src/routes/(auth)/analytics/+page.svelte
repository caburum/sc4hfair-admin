<script lang="ts">
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { AreaChart } from 'layerchart';

	let { data } = $props();

	const series = $derived(
		data.versionShare.length > 0 ?
			Object.keys(data.versionShare[0])
				.filter((key) => key !== 'startTime')
				.map((key) => ({
					key,
					color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
				}))
		:	[]
	);

	const chartData = $derived(
		data.versionShare.map((d) => ({
			...d,
			x: new Date(d.startTime)
		}))
	);
</script>

<h1>analytics</h1>

<AreaChart data={data.versionShare} x="startTime" {series} seriesLayout="stack" />

<DebugInfo {data} />
