<script lang="ts">
	import type { LayoutProps } from './$types';

	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import '../app.css';

	let { data, children }: LayoutProps = $props();

	let authenticated = $state(data.user !== null);
	let title = $derived(
		['sc4hfair-admin', ...page.url.pathname.split('/').slice(1)]
			.filter(Boolean)
			.reverse()
			.join(' | ')
	);

	let open = $derived(new MediaQuery('(min-width: 768px)').current);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="layout" class:open>
	<nav>
		<button class="menu-button" onclick={() => (open = !open)} aria-label="Toggle navigation">
			<div class="hamburger-icon"></div>
		</button>
		<ul>
			{#if authenticated}
				<li><a href="/users">users</a></li>
				<li><a href="/data">data</a></li>
				<li>
					<form action="/api/auth/logout" method="POST"><button type="submit">logout</button></form>
				</li>
			{:else}
				<li><a href="/login">login</a></li>
			{/if}
		</ul>
	</nav>

	<header>
		<h1>{title}</h1>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<style>
	nav {
		position: fixed;
		top: 1rem;
		bottom: 1rem;
		left: 1rem;
		width: var(--nav-open-width);
		height: calc(100% - 2rem);
		background: var(--nav);
		border-radius: 1rem;
		transition: all 0.3s ease-in-out;
		z-index: 100;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.layout:not(.open) nav {
		width: var(--nav-closed-width);
		height: var(--nav-closed-width);
		padding: 0;
		justify-content: center;
	}

	.layout:not(.open) nav ul {
		display: none;
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

	nav li:last-child {
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
		transition: all 0.3s ease-in-out;

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
			transform 0.3s ease-in-out,
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

	header {
		grid-area: header;
		margin-left: calc(var(--nav-closed-width) + var(--gap));

		display: flex;
		align-items: center;
	}

	header h1 {
		font-size: 1.5rem;
	}

	main {
		grid-area: main;
		overflow: auto;
		/* transition: margin-left 0.3s ease-in-out;
		
		margin: 1rem;
		margin-top: calc(var(--nav-closed-width) + 2rem);
		 */
	}

	header,
	main {
		transition: margin-left 0.3s ease-in-out;
	}

	.layout.open header,
	.layout.open main {
		margin-left: calc(var(--nav-open-width) + var(--gap));
	}
</style>
