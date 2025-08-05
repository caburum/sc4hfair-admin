<script lang="ts">
	import Spinner from '$lib/assets/Spinner.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import CopyPre from '$lib/components/CopyPre.svelte';
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { type SchemaUploaderId } from '$lib/server/uploaders.js';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { source } from 'sveltekit-sse';
	import type { Log, Result } from './+server.js';
	import instructions from './instructions.js';

	let formElement: HTMLFormElement, confetti: Confetti;

	let loading = $state(false),
		log = $state<Log[]>([]),
		result = $state<Result | null>(null),
		nextStage: Result['nextStage'] = $derived(result?.nextStage || 'validate');
	const revalidate = () => {
		result = null;
		nextStage = 'validate';
		checkbox = false;
		log = [];
	};

	let schema = $state<SchemaUploaderId | undefined>(),
		json = $state<string | undefined>(),
		dataset = $state('complete'),
		checkbox = $state(false),
		confirmed = $derived(nextStage !== 'import' || checkbox);

	onMount(revalidate);

	async function onsubmit(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
		event.preventDefault();

		loading = true;
		log = []; // reset log

		const data = new FormData(event.currentTarget),
			wasImport = nextStage === 'import'; // if this succeeds, 🎉

		let unsubscribes: (() => void)[] = [];

		const connection = source(event.currentTarget.action, {
			cache: false,
			options: {
				method: 'POST',
				body: data,
				openWhenHidden: true
			},
			open: (event) => {
				console.log('sse connection opened', event);
			},
			close: (event) => {
				console.log('sse connection closed', event);
				loading = false;
				if (wasImport) confetti.fire();
				unsubscribes.forEach((fn) => fn());
			},
			error: ({ error }) => {
				log.push({
					message: `error during sse connection: ${error}`
				});
			}
		});

		unsubscribes.push(
			connection
				.select('log')
				.json<Log>()
				.subscribe((data) => data && log.push(data)),
			connection
				.select('result')
				.json<Result>()
				.subscribe((data) => {
					result = data;
				})
		);
	}
</script>

<Confetti bind:this={confetti} />

<h1>data import</h1>

<form class="card" method="post" bind:this={formElement} {onsubmit}>
	<div>
		type:
		{#each ['schedule', 'foodVendors'] as s}
			<label>
				<input type="radio" value={s} name="schema" bind:group={schema} />
				{s}
			</label>
		{/each}
	</div>

	{#if schema}
		{@const blanks = instructions[schema]}
		<ol>
			<li>download the {@html blanks[0]} (ensure all are listed)</li>
			<li>
				use an ai to extract the data. include the schedule pdf, schema, and tent slug file. you can
				use this prompt:<br />
				<CopyPre>{blanks[1]}</CopyPre>
			</li>
			<li>
				take the {blanks[2]} along with the {@html blanks[0]}. use an ai to double check them:<br />
				<!-- prettier-ignore -->
				<CopyPre>note all inconsistencies in the data, not formatting, between the input file and the parsed json file. for example, ensure the number of items is the same.</CopyPre>
			</li>
			<li>
				rerun the first ai with the output of the second ai. ensure the output is correct and
				continue checking for inconsistencies.
			</li>
			<li>once the output is satisfactory, click verify to preview the changes</li>
			<li>once that is satisfactory, click import to add the data to the app</li>
			<li>todo: publish, maybe redirect to status pages with deploy button if not automatic</li>
		</ol>

		<!-- todo: better ui -->
		<textarea rows="10" name="json" bind:value={json} oninput={revalidate}></textarea>

		<div>
			<label>
				<input
					type="radio"
					name="dataset"
					bind:group={dataset}
					value="complete"
					onchange={revalidate}
				/>
				this is the <strong>complete</strong> dataset, archive any items not included
			</label>
			<br />
			<label>
				<input
					type="radio"
					name="dataset"
					bind:group={dataset}
					value="partial"
					onchange={revalidate}
				/>
				this is a <strong>partial</strong> dataset, only add/update the included items
			</label>
		</div>

		{#if !confirmed}
			<p>please acknowledge the effects before proceeding (scroll down)</p>
		{:else if nextStage === 'import'}
			<p>this may take over a minute to complete</p>
		{/if}

		<input type="hidden" name="stage" value={nextStage} />
		<div class="buttons">
			<button disabled={!confirmed || loading} type="submit" id="submit">{nextStage}</button>
			<Spinner {loading} />
		</div>
	{/if}
</form>

{#if log.length}
	<h2>log</h2>
	<ul>
		{#each log as entry}
			<li><code>[{entry.ts}]</code> {entry.message}</li>
		{/each}
	</ul>
{/if}

{#if result?.valid === false || result?.errors.length}
	<h2>errors</h2>
	<p>please ask your ai about these errors</p>
	<CopyPre>"errors": {JSON.stringify(result.errors, null, '\t')}</CopyPre>
{:else if result?.nextStage === 'import' && result?.valid && json && Array.isArray(JSON.parse(json))}
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
						{@const value = item[key]}
						{#if typeof value === 'string'}
							<td>{value}</td>
						{:else}
							<td><pre>{JSON.stringify(value, null, '\t')}</pre></td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<p>
		this will
		<strong style="color: var(--green)">create {result?.created?.length}</strong>,
		<strong style="color: var(--yellow)">update {result?.updated?.length}</strong>, and
		<strong style="color: var(--red)">archive {result?.archived?.length}</strong> items.
	</p>
	<label>
		<input type="checkbox" bind:checked={checkbox} />
		i understand this will modify the data in the app, and i have verified the data is correct
	</label>
	<a href="#submit">back to top</a>
{/if}

<DebugInfo data={{ result, log }} />

<style>
	ul {
		list-style: none;
		padding: 0;
	}
</style>
