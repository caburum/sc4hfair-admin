<script lang="ts">
	import { enhance } from '$app/forms';
	import Spinner from '$lib/assets/Spinner.svelte';
	import DebugInfo from '$lib/components/DebugInfo.svelte';
	import { BarqodeStream, type DetectedBarcode } from 'barqode';
	import { geoMercator } from 'd3-geo';
	import { Chart, Circle, GeoPoint, GeoTile, Layer, Text, Tooltip } from 'layerchart';
	import { boundingBox } from './geo';

	let { data, form } = $props();

	let paused = $state(true),
		id = $state(''),
		qrLoading = $state(true),
		gpsWatchId = $state<number | null>(null),
		gpsError = $state(''),
		gps = $state<GeolocationCoordinates | null>(null);

	const MAX_GPS_AGE = 60_000;
	const gpsSuccessCallback = ({ coords, timestamp }: GeolocationPosition) => {
		if (timestamp < Date.now() - MAX_GPS_AGE) {
			gpsError = 'gps data is too old';
		} else if (coords.accuracy > 10) {
			gpsError = 'gps accuracy is too low, try using a mobile device';
		} else if (gpsError) gpsError = ''; // reset error if gps is valid
		gps = coords;
	};
	const gpsErrorCallback = ({ message }: GeolocationPositionError) => {
		gps = null;
		gpsError = message;
	};

	$effect(() => {
		if (!navigator.geolocation) {
			gpsError = 'geolocation is not supported by this browser';
		} else if (paused) {
			gpsError = 'gps paused';
		} else {
			gpsWatchId = navigator.geolocation.watchPosition(gpsSuccessCallback, gpsErrorCallback, {
				enableHighAccuracy: true,
				maximumAge: MAX_GPS_AGE,
				timeout: 30_000
			});
		}

		return () => {
			if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
		};
	});

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
			if (extractedId && extractedId !== 'sh') {
				id = extractedId;
				break;
			}
		}
	}

	// todo: add autosave?
	function track(detectedCodes: DetectedBarcode[], ctx: CanvasRenderingContext2D) {
		for (const detectedCode of detectedCodes) {
			const [firstPoint, ...otherPoints] = detectedCode.cornerPoints;

			let detected = detectedCode.rawValue.includes('referrer=');

			// must be kept performant
			ctx.strokeStyle = detected ? '#009959' : '#b00020';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(firstPoint.x, firstPoint.y);

			for (const { x, y } of otherPoints) {
				ctx.lineTo(x, y);
			}

			ctx.lineTo(firstPoint.x, firstPoint.y);
			ctx.closePath();
			ctx.stroke();

			if (detected) break; // stop at first detected code
		}
	}

	let doubleScale = $derived(false); //(devicePixelRatio.current ?? 0) > 1);
	const ACCESS_TOKEN =
			'pk.eyJ1IjoiNGhjb21wdXRlcnMiLCJhIjoiY21keHdqcjlyMWsyZTJrb29razB2eThiayJ9.RBL6prZa_aBtfX9gg34NnQ',
		STYLE = '4hcomputers/cmdxtrs22015y01s200c5eo4h',
		mapboxServiceUrl = (x: number, y: number, z: number) => {
			return `https://api.mapbox.com/styles/v1/${STYLE}/tiles/${z}/${x}/${y}${
				doubleScale ? '@2x' : ''
			}?access_token=${ACCESS_TOKEN}`;
		};
	let zoomDelta = $state(0);
</script>

<h1>referrer management</h1>

<p>each poster hung around the fair has a unique tracking id, which are associated to locations</p>

<h2>create</h2>

<button class={paused ? 'yellow' : 'accent'} onclick={() => (paused = !paused)}>
	{paused ? 'track' : 'pause'}
</button>

<form class="card" method="post" action="?/create" use:enhance>
	<div class="qrScanner">
		<BarqodeStream {onCameraOn} {onDetect} {track} {paused}>
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

	<!-- todo: don't let them move away from the code then submit -->
	<button type="submit" disabled={!gps || !!gpsError}>create</button>
</form>

<div class="relative h-[600px] overflow-hidden">
	<Chart
		geo={{
			projection: geoMercator,
			fitGeojson: boundingBox,
			applyTransform: ['translate', 'scale']
		}}
		transform={{
			initialScrollMode: 'scale'
		}}
	>
		{#snippet children({ context })}
			<Layer type="svg">
				<GeoTile url={mapboxServiceUrl} {zoomDelta} />

				{#each data.referrers as referrer (referrer.id)}
					<GeoPoint lat={referrer.location.latitude} long={referrer.location.longitude}>
						<Circle r={2} class="fill-white stroke-primary" />
						<Text
							y="-6"
							value={referrer.id}
							textAnchor="middle"
							class="stroke-surface-100 [stroke-width:2px] text-[8px]"
						/>
					</GeoPoint>
					<!-- todo: GeoCircle of accuracy -->
				{/each}

				{#if gps}
					<GeoPoint lat={gps.latitude} long={gps.longitude}>
						<Circle r={4} class="fill-primary stroke-white" />
						<Text
							y="-8"
							value="you"
							textAnchor="middle"
							class="stroke-surface-100 [stroke-width:2px] text-[10px]"
						/>
					</GeoPoint>
				{/if}
			</Layer>

			<Tooltip.Root>
				{#snippet children({ data })}
					{@const [longitude, latitude] =
						context.geo.projection?.invert?.([context.tooltip.x, context.tooltip.y]) ?? []}
					<Tooltip.Header>{data.properties.name}</Tooltip.Header>
					<Tooltip.List>
						<Tooltip.Item label="longitude" value={longitude} format="decimal" />
						<Tooltip.Item label="latitude" value={latitude} format="decimal" />
					</Tooltip.List>
				{/snippet}
			</Tooltip.Root>
		{/snippet}
	</Chart>
</div>

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
		align-self: center;
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
