<script lang="ts">
	import { AUTH_BASE } from '$lib/auth.js';

	async function login(provider: 'google') {
		location.href = `${AUTH_BASE}/api/auth/${provider}-init?redirect=${encodeURIComponent(globalThis.location.origin)}`;
	}
</script>

<button onclick={() => login('google')}>login with google</button>

<!-- todo: login with password for fixed roles -->
