<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const AUTH_BASE = 'https://sc4hfair.app/';

	async function login(provider: 'google') {
		location.href = `${AUTH_BASE}/api/auth/${provider}-init?redirect=${encodeURIComponent(globalThis.location.origin)}`;
	}
</script>

<button onclick={() => login('google')}>login with google</button>

<!-- todo: login with password for fixed roles -->
