<script lang="ts">
	import { page } from '$app/state';
</script>

<h1>{page.status} {page.error?.message}</h1>

{#if page.status === 404}
	<p>This route could not be found.</p>
{:else if page.status === 401}
	<p>You are not authenticated.</p>
{:else if page.status === 403}
	<p>You do not have permission to access this tool.</p>
	<p>
		If you just received access, please log out first. If you are still having issues, contact a
		site administrator.
	</p>
	<p>Your current roles: {page.data?.user?.roles.join(', ')}</p>
{/if}

{#if page.error?.stack}
	<pre style="color: var(--grey)">{page.error.stack}</pre>
{/if}
