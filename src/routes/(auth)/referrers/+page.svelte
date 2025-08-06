<script lang="ts">
	import { enhance } from '$app/forms';
	import Spinner from '$lib/assets/Spinner.svelte';
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { BarqodeStream, type DetectedBarcode } from 'barqode';
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
					if (coords.accuracy > 10) {
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

	let id = $state(''),
		qrLoading = $state(true);

	const extractReferrer = (urlOrId: string) => {
		try {
			const parsedUrl = new URL(urlOrId);
			return parsedUrl.searchParams.get('referrer') || false;
		} catch {
			return false;
		}
	};

	function onCameraOn() {
		qrLoading = false;
	}

	function onDetect(detectedCodes: DetectedBarcode[]) {
		for (const detectedCode of detectedCodes) {
			const extractedId = extractReferrer(detectedCode.rawValue);
			if (extractedId) {
				id = extractedId;
				break;
			}
		}
	}

	const rootStyles = getComputedStyle(document.documentElement),
		green = rootStyles.getPropertyValue('--accent'),
		red = rootStyles.getPropertyValue('--red');

	function track(detectedCodes: DetectedBarcode[], ctx: CanvasRenderingContext2D) {
		for (const detectedCode of detectedCodes) {
			const [firstPoint, ...otherPoints] = detectedCode.cornerPoints;

			// must be kept performant
			ctx.strokeStyle = detectedCode.rawValue.includes('referrer=') ? green : red;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(firstPoint.x, firstPoint.y);

			for (const { x, y } of otherPoints) {
				ctx.lineTo(x, y);
			}

			ctx.lineTo(firstPoint.x, firstPoint.y);
			ctx.closePath();
			ctx.stroke();
		}
	}
</script>

<h1>referrer management</h1>

<p>each poster hung around the fair has a unique tracking id, which are associated to locations</p>

<h2>create</h2>
<form class="card" method="post" action="?/create" use:enhance>
	<div class="qrScanner">
		<BarqodeStream {onCameraOn} {onDetect} {track}>
			<div class="loader"><Spinner loading={qrLoading} /></div>
		</BarqodeStream>
	</div>

	<label>
		id:
		<input
			type="text"
			name="id"
			required
			onchange={() => (id = extractReferrer(id) || id)}
			bind:value={id}
		/>
	</label>

	<label>
		name:
		<input type="text" name="name" />
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
	.qrScanner {
		width: 100%;
		max-width: 400px;
		aspect-ratio: 4/3;
	}

	.loader {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	input {
		width: 100%;
	}
</style>
