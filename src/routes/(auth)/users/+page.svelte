<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { isPermitted, ROLES, type Role } from '$lib/auth';
	import { SvelteMap } from 'svelte/reactivity';
	import type { Change, DbUser } from './+page.server';

	let { data } = $props();

	let roleChanges: Map<string, Change[]> = new SvelteMap();

	const availableRoles = new SvelteMap(
		Object.entries(ROLES)
			.sort(([, a], [, b]) => a - b)
			.map(([role]) => [role as Role, isPermitted(data.user!.roles, [role as Role])])
	);

	const myMaxRole = data.user!.roles.reduce<Role | null>((max, role) => {
		return ROLES[role] > ((max && ROLES[max]) ?? -Infinity) ? role : max;
	}, null);

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

	beforeNavigate(({ cancel }) => {
		if (
			roleChanges.size > 0 &&
			!confirm('you have unsaved changes, are you sure you want to leave?')
		)
			cancel();
	});
</script>

<h1>user management</h1>

<p>
	You may promote users to your role or lower. Affected users must sign out to apply changes. Roles
	include:
</p>
<ul>
	<li>analytics: access to analytics</li>
	<li>live: access to analytics & realtime fair operational tools (like notifications)</li>
	<li>data: access to analytics & data management tools</li>
	<li>admin: access to all of the above, with user management</li>
	<li>dev: access to all of the above, with advanced development/debugging tools</li>
</ul>

{#if getAllChanges().length > 0}
	<section class="card change-summary">
		<h2>pending changes</h2>
		<ul>
			{#each getAllChanges() as change}
				<li>
					{change.user.name} &lt;{change.user.email}&gt;:
					<span class="action {change.action}">{change.action}</span>
					role {change.role}
				</li>
			{/each}
		</ul>
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
				<button class="button yellow" type="submit">apply</button>
			</form>
			<button class="button grey" onclick={() => roleChanges.clear()}>clear</button>
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
				<td>
					<span title={user.id}>{user.name || user.id}</span>
					<span class="current-roles">
						{#if user.roles && user.roles.length > 0}
							{#each user.roles as role}
								<span class="role-badge accent">{role}</span>
							{/each}
						{/if}
					</span></td
				>
				<td>{user.email || 'N/A'}</td>
				<td>
					<div class="role-checkboxes">
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
					</div>
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
		gap: 0.25rem;
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
