<script lang="ts">
	const COUNT = 150;
	const COLORS = ['#ffD700', '#4169e1', '#dc143c', '#00ff7f', '#ff4500', '#9932cc'];

	const random = (min: number, max: number) => Math.random() * (max - min) + min;

	let confettiPieces: string[] = $state([]);

	export const fire = () => {
		confettiPieces = Array.from({ length: COUNT }).map(() => {
			const width = random(8, 16);
			const height = random(6, 12);
			const borderRadius = Math.random() > 0.5 ? '50%' : '0';

			return `background-color: ${COLORS[Math.floor(random(0, COLORS.length))]};
width: ${width}px;
height: ${height}px;
left: ${random(0, 100)}%;
top: ${random(-150, -20)}px;
border-radius: ${borderRadius};
animation-duration: ${random(3, 7)}s;
animation-delay: ${random(0, 5)}s;
--rotation-start: ${random(0, 360)}deg;
--rotation-end: ${random(360, 1080)}deg;
--drift: ${random(-100, 100)}px;`;
		});
	};
</script>

{#if confettiPieces.length > 0}
	<div class="container">
		{#each confettiPieces as piece}
			<div class="piece" style={piece}></div>
		{/each}
	</div>
{/if}

<style>
	.container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: hidden;
		z-index: 100;
	}

	.piece {
		position: absolute;
		animation-name: fall;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}

	@keyframes fall {
		0% {
			transform: translateY(0) rotateZ(var(--rotation-start));
			opacity: 1;
		}
		100% {
			transform: translateY(calc(100vh + 150px)) translateX(var(--drift))
				rotateZ(var(--rotation-end));
			opacity: 0;
		}
	}
</style>
