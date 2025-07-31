<script lang="ts">
	import type { LayoutProps } from './$types';

	import { page } from '$app/state';
	import '../app.css';

	let { data, children }: LayoutProps = $props();

	let authenticated = $state(data.user !== null);
	let title = $derived(
		['sc4hfair-admin', ...page.url.pathname.split('/').slice(1)]
			.filter(Boolean)
			.reverse()
			.join(' | ')
	);

	let open = $state(false);
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
				<li>
					<form action="/api/auth/logout" method="POST"><button type="submit">logout</button></form>
				</li>
				<li><a href="/users">users</a></li>
				<li><a href="/data">data</a></li>
			{:else}
				<li><a href="/login">login</a></li>
			{/if}
		</ul>
	</nav>

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
		padding: 1.5rem 1rem;
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
		margin: 2rem 0 0 0;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	nav li {
		margin-bottom: 1.5rem;
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
		width: var(--nav-closed-width);
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

	.hamburger-icon,
	.hamburger-icon::before,
	.hamburger-icon::after {
		content: '';
		display: block;
		background-color: var(--accent-text);
		height: 0.1875rem; /* 3px -&gt; 0.1875rem */
		width: 1.5rem; /* 24px -&gt; 1.5rem */
		border-radius: 0.125rem; /* 2px -&gt; 0.125rem */
		transition:
			transform 0.3s ease-in-out,
			background-color 0.3s ease-in-out;
		position: relative;
	}

	.hamburger-icon::before {
		transform: translateY(-0.5rem); /* -8px -&gt; -0.5rem */
	}

	.hamburger-icon::after {
		transform: translateY(0.3125rem); /* 5px -&gt; 0.3125rem */
	}

	.layout.open .hamburger-icon {
		background-color: transparent;
	}

	.layout.open .hamburger-icon::before {
		transform: rotate(45deg);
	}

	.layout.open .hamburger-icon::after {
		transform: translateY(-0.1875rem) rotate(-45deg); /* Adjusted for alignment */
	}

	main {
		transition: margin-left 0.3s ease-in-out;
		overflow: auto;
		margin: 1rem;
		margin-left: calc(var(--nav-closed-width) + 2rem);
		min-height: calc(100vh - 2rem);
	}

	.layout.open main {
		margin-left: calc(var(--nav-open-width) + 2rem);
	}
</style>
