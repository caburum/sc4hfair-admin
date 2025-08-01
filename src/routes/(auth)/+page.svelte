<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>welcome, {data.profile?.name}</h1>
<p>This app is the new home for all tools needed to run the 4-H Fair app!</p>

<h2>your info</h2>
<pre>{JSON.stringify(data, null, '\t')}</pre>
