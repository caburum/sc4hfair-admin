<script lang="ts">
	import DebugInfo from '$lib/components/DebugInfo.svelte';

	let { data } = $props();
</script>

<h1>interests report</h1>

<p>
	this report should be sent to 4h staff to be distributed to club leaders, select all and copy it
</p>

<article contenteditable>
	<h1>4-H Fair App Interest List Emails Report</h1>
	<p>
		As a part of the interest list feature in the 4-H Fair App, we collect the name and email of
		every person who adds a club to their interest list so that we can report this data to club
		leaders. Below is a list of names/emails who expressed interest in each club. If a club is not
		listed, this means that no fair app users added that club to their interest list. Club leaders
		should consider adding emails from this list to their club's mailing list. You can copy and
		paste from each section directly into an email recipients box.
	</p>

	{#each data.interests as { _id, users } (_id)}
		<h2>{data.clubs[_id] ?? _id}</h2>
		<ul>
			{#each users as u}
				<li>
					{u.name} &lt;{u.email}&gt;
					<ul>
						{#if u.graduation}<li>graduation year: {u.graduation}</li>{/if}
						{#if u.phone}<li>phone: {u.phone}</li>{/if}
					</ul>
				</li>
			{/each}
		</ul>

		<p>email copy paste: {users.map(({ name, email }) => `${name} <${email}>`).join(', ')}</p>
	{/each}
</article>

<DebugInfo {data} />

<style>
	article {
		background: white;
		color: black;
		font-family: sans-serif;
	}

	h1 {
		font-size: 2em;
	}

	h2 {
		break-after: avoid;
	}
</style>
