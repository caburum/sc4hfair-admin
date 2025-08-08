<script lang="ts">
	import { getColors } from '$lib/charts';
	import ReferrerChart from '$lib/charts/ReferrerChart.svelte';
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { PieChart } from 'layerchart';

	let { data } = $props();

	const MODES = ['map', 'pie', 'table'] as const;
	let mode = $state<(typeof MODES)[number]>('map'),
		mapLabels = $state(true),
		pieLegend = $state(false);
</script>

<h1>referrals</h1>

<div>
	{#each MODES as m}
		<label>
			<input type="radio" value={m} bind:group={mode} />
			{m}
		</label>
	{/each}
</div>

{#if mode === 'map'}
	<label>
		<input type="checkbox" bind:checked={mapLabels} />
		show labels
	</label>
	<ReferrerChart referrers={data.referrals} labels={mapLabels} />
{:else if mode === 'pie'}
	<label>
		<input type="checkbox" bind:checked={pieLegend} />
		show legend
	</label>
	<PieChart
		data={data.referrals}
		key="id"
		label={(d) => (d.name ? `${d.name} (${d.id})` : (d.location ? '📍' : '') + d.id)}
		cRange={getColors(data.referrals.length)}
		value="count"
		outerRadius={160}
		legend={pieLegend ?
			{
				placement: 'bottom',
				classes: {
					root: 'w-full',
					items: 'flex-wrap justify-center'
				}
			}
		:	false}
	/>
{:else if mode === 'table'}
	<table>
		<thead>
			<tr>
				<th>id</th>
				<th>name</th>
				<th>count</th>
			</tr>
		</thead>
		<tbody>
			{#each data.referrals.slice().sort((a, b) => b.count - a.count) as referrer (referrer.id)}
				<tr class:yellow={!referrer.location}>
					<td>{referrer.id}</td>
					<td>{referrer.name}</td>
					<td>{referrer.count}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<DebugInfo {data} />
