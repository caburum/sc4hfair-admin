<script lang="ts">
	import { page } from '$app/state';
	import Clover from '$lib/assets/Clover.svelte';
	import { isPermitted } from '$lib/auth';
	import { MediaQuery } from 'svelte/reactivity';
	import '../app.css';

	let { data, children } = $props();

	let route = $derived(
		['sc4hfair-admin', ...page.url.pathname.split('/').slice(1)].filter(Boolean)
	);

	let open = $derived(new MediaQuery('(min-width: 768px)').current);
</script>

<svelte:head>
	<title>{route.toReversed().join(' | ')}</title>
</svelte:head>

<div class="layout" class:open>
	<nav>
		<button class="menu-button" onclick={() => (open = !open)} aria-label="Toggle navigation">
			<div class="hamburger-icon"></div>
		</button>
		<ul>
			{#if data.user !== null}
				<li><a href="/">info</a></li>
				<!-- todo: centralize permissions by route -->
				{#if isPermitted(data.user.roles, ['admin'])}
					<li><a href="/users">users</a></li>
				{/if}
				{#if isPermitted(data.user.roles, ['data'])}
					<li>
						<a href="/data">data</a>
						<ul>
							<li><a href="/data/import">import</a></li>
						</ul>
					</li>
				{/if}
				{#if isPermitted(data.user.roles, ['analytics'])}
					<li><a href="/analytics">analytics</a></li>
					<li><a href="/referrers">referrers</a></li>
				{/if}
				{#if isPermitted(data.user.roles, ['dev'])}
					<li><a href="/webhook">deploy</a></li>
				{/if}
				<li>
					<form action="/api/auth/logout" method="POST"><button type="submit">logout</button></form>
				</li>
			{:else}
				<li><a href="/login">login</a></li>
			{/if}
		</ul>
	</nav>

	<header>
		<a href="/" data-sveltekit-reload={true} onclick={() => (window.location.href = '/')}>
			<Clover />
		</a>
		<h1>
			{#each route as segment, i}
				<span>
					<a href={'/' + route.slice(1, i + 1).join('/')}>{segment}</a>
				</span>
			{/each}
		</h1>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<style>
	.layout {
		display: grid;
		grid-template:
			'header' var(--nav-closed-width)
			'main' auto / auto;
		min-height: 100vh;
		padding: var(--gap);
		gap: var(--gap);
		overflow: hidden;
	}

	header,
	main {
		transition: margin-left var(--transition-duration) ease-in-out;
	}

	.layout.open header,
	.layout.open main {
		margin-left: calc(var(--nav-open-width) + var(--gap));
	}

	header {
		grid-area: header;
		margin-left: calc(var(--nav-closed-width) + var(--gap));

		display: flex;
		align-items: center;
		overflow: hidden;
	}

	header :global(svg) {
		height: 2rem;
		width: 2rem;
		margin-right: 0.5rem;
	}

	header h1 {
		font-size: 1.5rem;
		flex: 1;
		max-width: 100%;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		direction: rtl;
		white-space: nowrap;
	}

	header h1 span:not(:first-child)::before {
		content: ' ▸ ';
	}

	header a {
		color: inherit;
		text-decoration: none;
	}

	main {
		grid-area: main;
		overflow: auto;

		display: flex;
		flex-direction: column;
		gap: var(--gap);
	}

	main :global(> *) {
		/* let flex handle the space between elements */
		margin: 0;
	}

	/* navigation button & menu */

	nav {
		position: fixed;
		top: 1rem;
		bottom: 1rem;
		left: 1rem;
		width: var(--nav-open-width);
		height: calc(100% - 2rem);
		background: var(--nav);
		border-radius: 1rem;
		transition: all var(--transition-duration) ease-in-out;
		z-index: 100;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.layout:not(.open) nav {
		width: var(--nav-closed-width);
		height: var(--nav-closed-width);
	}

	nav ul {
		list-style: none;
		padding: 0;
		margin: var(--gap);
		margin-top: var(--nav-closed-width);
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: var(--gap);
	}

	nav > ul ul {
		margin: 0;
		margin-top: var(--gap);
		margin-left: var(--gap);
	}

	nav li:not(:first-child):last-child {
		margin-top: auto;
	}

	nav a,
	nav a:hover,
	nav button {
		text-decoration: none;
		color: var(--accent-text);
		display: block;
		white-space: nowrap;
	}

	nav form button {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		font-size: inherit;
		font-family: inherit;
		font-weight: inherit;
		text-align: left;
		width: 100%;
	}

	.menu-button {
		position: absolute;
		width: 100%;
		height: var(--nav-closed-width);
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		transition: all var(--transition-duration) ease-in-out;

		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 100;
	}

	.hamburger-icon {
		--bar-height: 0.1875rem;
		--gap: calc(var(--bar-height) * 2);
		--spacing: calc(var(--gap) + var(--bar-height));

		position: relative;
	}

	.hamburger-icon,
	.hamburger-icon::before,
	.hamburger-icon::after {
		background-color: var(--accent-text);
		height: var(--bar-height);
		width: 1.5rem;
		border-radius: 0.125rem;
		transition:
			transform var(--transition-duration) ease-in-out,
			background-color 0.1s ease-in-out;
	}

	.hamburger-icon::before,
	.hamburger-icon::after {
		content: '';
		position: absolute;
		left: 0;
	}
	.hamburger-icon::before {
		transform: translateY(calc(-1 * var(--spacing)));
	}
	.hamburger-icon::after {
		transform: translateY(var(--spacing));
	}

	.layout.open .hamburger-icon {
		background-color: transparent;
	}
	.layout.open .hamburger-icon::before {
		transform: rotate(45deg);
	}
	.layout.open .hamburger-icon::after {
		transform: rotate(-45deg);
	}
</style>
