<script lang="ts">
	import { enhance } from '$app/forms';
	import DebugInfo from '$lib/components/DebugInfo.svelte';

	let { data, form } = $props();
</script>

<h1>data management</h1>

<a href="/data/import" class="button">import data</a>

<form class="card" method="post" use:enhance>
	<p>this cleans up old data from the previous year, and prepares the system for the new year</p>
	<button formaction="?/newYear">start new year</button>
	<button formaction="?/archiveLastYear">archive last year</button>
</form>

<h2>result</h2>
<!-- todo: associate result with button, use cards? -->
<p>{form?.message}</p>

<DebugInfo data={form} />
