<script lang="ts">
	import { requestsByTypeToKey } from './requests-by-[type]/types';
</script>

<h1>analytics</h1>

<ul>
	{#each Object.keys(requestsByTypeToKey) as type}
		<li><a href={`/analytics/requests-by-${type}`}>requests by {type}</a></li>
	{/each}
</ul>
