<script lang="ts">
	import { GeoTile } from 'layerchart';
	import { devicePixelRatio } from 'svelte/reactivity/window';

	let doubleScale = $derived((devicePixelRatio.current ?? 0) > 1);
	const ACCESS_TOKEN =
			'pk.eyJ1IjoiNGhjb21wdXRlcnMiLCJhIjoiY21keHdqcjlyMWsyZTJrb29razB2eThiayJ9.RBL6prZa_aBtfX9gg34NnQ',
		TILESET = 'mapbox.satellite,4hcomputers.39rzof7z',
		mapboxServiceUrl = (x: number, y: number, z: number) =>
			`https://${'abc'[Math.abs(x + y) % 3]}.tiles.mapbox.com/v4/${TILESET}/${z}/${x}/${y}${
				doubleScale ? '@2x' : ''
			}.png?access_token=${ACCESS_TOKEN}`;
</script>

<GeoTile url={mapboxServiceUrl} />
