<script lang="ts">
	import DebugInfo from '$lib/components/DebugInfo.svelte';

	let { data } = $props();
</script>

<h1>welcome, {data.profile?.name}</h1>
<p>This app is the new home for all tools needed to run the 4-H Fair app!</p>

<DebugInfo {data} />
