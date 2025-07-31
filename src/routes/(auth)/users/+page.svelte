<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { isPermitted, ROLES, type Role } from '$lib/auth';
	import { SvelteMap } from 'svelte/reactivity';
	import type { PageProps } from './$types';
	import type { Change, DbUser } from './+page.server';

	let { data }: PageProps = $props();

	let roleChanges: Map<string, Change[]> = new SvelteMap();

	const availableRoles = new SvelteMap(
		Object.entries(ROLES)
			.sort(([, a], [, b]) => a - b)
			.map(([role]) => [role as Role, isPermitted(data.user!.roles, [role as Role])])
	);

	const myMaxRole = data.user!.roles.reduce((max, role) => {
		return availableRoles.get(role) ? role : max;
	}, '' as Role);

	function handleRoleChange(user: DbUser, role: Role, checked: boolean) {
		if (
			user.id === data.user!.sub &&
			role === myMaxRole &&
			!confirm(
				'You are attempting to change your own highest role. Are you sure you want to do this?'
			)
		) {
			return;
		}

		let changes = roleChanges.get(user.id) ?? [];

		changes = changes.filter((change) => change.role !== role);

		changes.push({
			user,
			role,
			action: checked ? 'add' : 'remove'
		});

		changes = changes.filter(
			(change) =>
				!(
					(change.action === 'remove' && !user.roles?.includes(change.role)) ||
					(change.action === 'add' && user.roles?.includes(change.role))
				)
		);

		if (changes.length === 0) {
			roleChanges.delete(user.id);
		} else {
			roleChanges.set(user.id, changes);
		}
	}

	function isRoleChecked(user: DbUser, role: Role): boolean {
		const hasRole = user.roles?.includes(role) || false;
		const pendingChange = roleChanges.get(user.id)?.find((change) => change.role === role);

		if (pendingChange) {
			return pendingChange.action === 'add';
		}
		return hasRole;
	}

	function getAllChanges() {
		return Array.from(roleChanges.values()).flat();
	}
</script>

<h1>user management</h1>

<p>
	You may promote users to your role or lower. Affected users must sign out to apply changes. Roles
	include:
</p>
<ul>
	<li>live: access to realtime fair operational tools (like notifications)</li>
	<li>data: access to data management tools</li>
	<li>admin: access to all of the above</li>
	<li>dev: access to all of the above, with advanced development/debugging tools</li>
</ul>

{#if getAllChanges().length > 0}
	<section class="change-summary">
		<h2>pending changes</h2>
		<div>
			{#each getAllChanges() as change}
				<div>
					<strong>{change.user.name} &lt;{change.user.email}&gt;</strong>:
					<span class="action {change.action}">{change.action}</span>
					role <strong>{change.role}</strong>
				</div>
			{/each}
		</div>
		<div class="change-actions">
			<form
				action="?/apply"
				method="POST"
				use:enhance={({ formData }) => {
					formData.set('changes', JSON.stringify(getAllChanges()));
					return async ({ result }) => {
						if (result.type === 'success') {
							roleChanges.clear();
							invalidateAll();
						} else {
							alert('failed to apply changes');
						}
					};
				}}
			>
				<button class="button yellow" type="submit">Apply Changes</button>
			</form>
			<button class="button grey" onclick={() => roleChanges.clear()}>Clear Changes</button>
		</div>
	</section>
{/if}

<table>
	<thead>
		<tr>
			<th>name</th>
			<th>email</th>
			<th>roles</th>
		</tr>
	</thead>
	<tbody>
		{#each data.users as user}
			<tr>
				<td
					>{user.name || 'N/A'}
					<span class="current-roles">
						{#if user.roles && user.roles.length > 0}
							{#each user.roles as role}
								<span class="role-badge accent">{role}</span>
							{/each}
						{/if}
					</span></td
				>
				<td>{user.email || 'N/A'}</td>
				<td class="role-checkboxes">
					{#each availableRoles as [role, permitted]}
						<label class="role-checkbox">
							<input
								type="checkbox"
								disabled={!permitted}
								checked={isRoleChecked(user, role)}
								onchange={(e) => handleRoleChange(user, role, e.currentTarget.checked)}
							/>
							{role}
						</label>
					{/each}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.table-container {
		overflow-x: auto;
		margin-bottom: 2rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		overflow-x: auto;
	}

	th,
	td {
		padding: 0.5rem;
		text-align: left;
		border-bottom: 1px solid var(--light);
	}

	th {
		background-color: var(--light-2);
		font-weight: 600;
	}

	tr:hover {
		background-color: var(--light);
	}

	.current-roles {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.role-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.role-checkboxes {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.role-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.role-checkbox * {
		margin: 0;
	}

	.role-checkbox:has([disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.change-summary {
		background: var(--light);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.change-summary h2 {
		margin: 0 0 1rem 0;
	}

	.action.add {
		color: var(--green);
		font-weight: 600;
	}

	.action.remove {
		color: var(--red);
		font-weight: 600;
	}

	.change-actions {
		margin-top: 1rem;
		display: flex;
		gap: 1rem;
	}
</style>
