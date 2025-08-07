<script lang="ts">
	import type { Referrer } from '$lib/types';
	import { geoMercator } from 'd3-geo';
	import { Chart, Circle, GeoCircle, GeoPoint, Layer, Text, Tooltip } from 'layerchart';
	import MapTile from './MapTile.svelte';
	import { boundingBox } from './geo';

	const {
		referrers,
		gps
	}: {
		referrers: Referrer[];
		gps?: GeolocationCoordinates | null;
	} = $props();
</script>

<div class="relative h-[600px] cursor-grab touch-none overflow-hidden select-none">
	<Chart
		data={referrers}
		x={(d) => d.location.longitude}
		y={(d) => d.location.latitude}
		geo={{
			projection: geoMercator,
			fitGeojson: boundingBox,
			applyTransform: ['translate', 'scale']
		}}
		transform={{
			initialScrollMode: 'scale'
			// initialTranslate: { x: 0, y: 0 },
			// initialScale: 10_000_000
		}}
		tooltip={{
			mode: 'quadtree',
			radius: 30
		}}
	>
		{#snippet children({ context })}
			<div class="absolute right-0 z-[100] m-(--spacing)">
				<button class="aspect-square" onclick={context.transform.zoomIn}>+</button>
				<button class="aspect-square" onclick={context.transform.zoomOut}>-</button>
			</div>

			<Layer type="svg">
				<MapTile />

				{#each referrers as referrer (referrer.id)}
					<GeoPoint lat={referrer.location.latitude} long={referrer.location.longitude}>
						<Circle r={3} class="fill-white stroke-primary" />
						<Text
							y="0"
							value={referrer.name || referrer.id}
							textAnchor="middle"
							class="stroke-surface-100 [stroke-width:2px] text-[.5em]"
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
					<GeoCircle
						center={[gps.latitude, gps.longitude]}
						radius={(gps.accuracy / 1000 / 6371) * (180 / Math.PI)}
						precision={10}
						class="fill-primary/20 stroke-primary/50"
					/>
				{/if}
			</Layer>

			<Tooltip.Root {context}>
				{#snippet children({ data })}
					<Tooltip.Header>{data.name ? `${data.name} (${data.id})` : data.id}</Tooltip.Header>
					<Tooltip.List>
						<Tooltip.Item label="longitude" value={data.location.longitude} />
						<Tooltip.Item label="latitude" value={data.location.latitude} />
					</Tooltip.List>
				{/snippet}
			</Tooltip.Root>
		{/snippet}
	</Chart>
</div>
