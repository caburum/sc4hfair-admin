<script>
	import { getColors } from '$lib/charts';
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { PieChart } from 'layerchart';

	let { data } = $props();
</script>

<PieChart
	data={data.referrals}
	key="_id"
	cRange={getColors(data.referrals.length)}
	value="count"
	outerRadius={160}
	legend={{
		placement: 'bottom',
		classes: {
			root: 'w-full',
			items: 'flex-wrap justify-center'
		}
	}}
/>

<DebugInfo {data} />
