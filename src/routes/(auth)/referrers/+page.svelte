<script lang="ts">
	import { enhance } from '$app/forms';
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { onMount } from 'svelte';

	let { data, form } = $props();

	let gpsError = $state(''),
		gps = $state<GeolocationCoordinates | null>(null);

	const MAX_GPS_AGE = 60_000;
	onMount(() => {
		if (navigator.geolocation) {
			const watchID = navigator.geolocation.watchPosition(
				({ coords, timestamp }) => {
					if (timestamp < Date.now() - MAX_GPS_AGE) {
						gpsError = 'gps data is too old';
					}
					if (coords.accuracy > 100) {
						gpsError = 'gps accuracy is too low, try using a mobile device';
					}
					gps = coords;
				},
				({ message }) => {
					gps = null;
					gpsError = message;
				},
				{
					enableHighAccuracy: true,
					maximumAge: MAX_GPS_AGE,
					timeout: 30_000
				}
			);
			return () => {
				navigator.geolocation.clearWatch(watchID);
			};
		} else {
			gpsError = 'geolocation is not supported by this browser';
		}
	});
</script>

<h1>referrer management</h1>

<p>each poster hung around the fair has a unique tracking id, which are associated to locations</p>

<h2>create</h2>
<form class="card" method="post" action="?/create" use:enhance>
	<label>
		id:
		<!-- todo: qr scanner -->
		<input
			type="text"
			name="id"
			required
			oninput={({ currentTarget }) => {
				// if id is a url, extract the ?referrer from it
				try {
					const url = new URL(currentTarget.value);
					const referrer = url.searchParams.get('referrer');
					if (referrer) {
						currentTarget.value = referrer;
					}
				} catch {
					return;
				}
			}}
		/>
	</label>

	<label>
		name:
		<input type="text" name="name" required />
	</label>

	<!-- todo: map preview -->

	<p>{gpsError || (!gps ? 'waiting for gps...' : '')}</p>
	<pre>gps: {JSON.stringify(gps, null, '\t')}</pre>

	<input type="hidden" name="latitude" value={gps?.latitude} />
	<input type="hidden" name="longitude" value={gps?.longitude} />
	<input type="hidden" name="accuracy" value={gps?.accuracy} />

	<p>{form?.message}</p>

	<button type="submit" disabled={!gps || !!gpsError}>create</button>
</form>

<h2>list</h2>
<ul>
	{#each data.referrers as referrer}
		<li>
			<code>{referrer.id}</code>: {referrer.name} <code>{JSON.stringify(referrer.location)}</code>
		</li>
	{/each}
</ul>

<DebugInfo data={{ data, form }} />

<style>
	input {
		width: 100%;
	}
</style>
