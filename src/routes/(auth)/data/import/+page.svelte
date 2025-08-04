<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import Spinner from '$lib/assets/Spinner.svelte';
	import CopyPre from '$lib/components/CopyPre.svelte';
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { type SchemaUploaderId } from '$lib/server/uploaders.js';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let { form } = $props();

	let formElement: HTMLFormElement,
		loading = $state(false),
		nextStage: import('./+page.server.js').ActionResult['nextStage'] = $derived(
			form?.nextStage || 'validate'
		),
		schema: SchemaUploaderId | undefined = $state(),
		json: string | undefined = $state(),
		checkbox: boolean = $state(false),
		confirmed: boolean = $derived(nextStage !== 'import' || checkbox);

	onMount(() => {
		// reset any previous state
		form = null;
		nextStage = 'validate';
		checkbox = false;
	});
</script>

<h1>data import</h1>

<form
	class="card"
	method="post"
	bind:this={formElement}
	use:enhance={({ formElement, formData, action, cancel }) => {
		loading = true;
		return async ({ result }) => {
			await applyAction(result);
			loading = false;
		};
	}}
>
	<div>
		type:
		{#each ['schedule'] as s}
			<label>
				<input type="radio" value={s} name="schema" bind:group={schema} />
				{s}
			</label>
		{/each}
	</div>

	{#if schema === 'schedule'}
		<ol>
			<li>download the schedule pdf, schema, and tent slugs (ensure all are listed)</li>
			<li>
				use an ai to extract the data. include the schedule pdf, schema, and tent slug file. you can
				use this prompt:<br />
				<!-- prettier-ignore -->
				<CopyPre>We need to turn the human readable schedule document I provided into a machine readable version for a CMS system. Your job is to read the PDF, and convert each event on the schedule across all days into a machine readable entry. Process each event yourself manually, do not use data analysis tools. Use the two reference documents to assist in ensuring the output is correct. The output should be formatted as a JSON array with the following entries:
title: human readable name of the event, properly capitalized
time: start time of the event as listed, in ISO format (for time zone, assume we are on east coast in August)
end_time: end time of the event formatted as above, if applicable (many events don't have this)
tent: the slug of the tent that this event is in. you are provided with the list of possible slugs, if the event is clearly not in any of those tents, you can leave it null for unknown
near: boolean that is true if the event is "near" the tent, false if the event is "in" the tent (this decides how the location will be shown in the app)
</CopyPre>
			</li>
			<li>
				take the outputed array (text surrounded by square brackets), pdf, and tent slugs files and
				use an ai to double check them:<br />
				<!-- prettier-ignore -->
				<CopyPre>note all inconsistencies between this file and the target file. ensure the event count is the same.</CopyPre>
			</li>
			<li>
				rerun the first ai with the output of the second ai. ensure the output is correct and
				continue checking for inconsistencies.
			</li>
			<li>once the output is satisfactory, click verify to preview the changes</li>
			<li>once that is satisfactory, click import to add the data to the app</li>
			<li>todo: publish</li>
		</ol>
	{/if}

	{#if schema}
		<!-- todo: better ui -->
		<textarea rows="10" name="json" bind:value={json} oninput={() => (nextStage = 'validate')}
		></textarea>

		{#if !confirmed}
			<p>please acknowledge the effects before proceeding</p>
		{/if}

		<input type="hidden" name="stage" value={nextStage} />

		<div class="buttons">
			<button disabled={!confirmed || loading} type="submit">{nextStage}</button>
			<Spinner {loading} />
		</div>
	{/if}
</form>

{#if form?.valid === false && form?.errors.length}
	<h2>errors</h2>
	<p>please ask your ai to fix these validation errors</p>
	<CopyPre>"errors": {JSON.stringify(form.errors, null, '\t')}</CopyPre>
{:else if form?.valid && json && Array.isArray(JSON.parse(json))}
	<h2>preview</h2>
	{@const parsedJson = JSON.parse(json) as any[]}
	{@const keys = parsedJson.reduce((acc, item) => {
		Object.keys(item).forEach((key) => acc.add(key));
		return acc;
	}, new SvelteSet<string>())}
	<p>
		you are about to import {parsedJson.length} items for "{schema}". please manually verify the
		data before proceeding.
	</p>
	<table>
		<thead>
			<tr>
				{#each keys as key}
					<th>{key}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each parsedJson as item}
				<tr>
					{#each keys as key}
						<td>{item[key]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<p>
		this will
		<strong style="color: var(--green)">create {form?.created.length}</strong>,
		<strong style="color: var(--yellow)">update {form?.updated.length}</strong>, and
		<strong style="color: var(--red)">archive {form?.archived.length}</strong> items.
	</p>
	<label>
		<input type="checkbox" bind:checked={checkbox} />
		i understand this will modify the data in the app, and i have verified the data is correct
	</label>
{/if}

<DebugInfo data={form} />
