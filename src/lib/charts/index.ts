/**
 * Simple seeded random number generator for deterministic color generation
 */
function seededRandom(seed: number) {
	const x = Math.sin(seed) * 10000;
	return x - Math.floor(x);
}

/**
 * Generates a visually pleasing, harmonious color based on a base green color.
 * Creates variations by distributing hue evenly across the available range to avoid opposite colors,
 * and slightly varying saturation and lightness.
 * @param index - The index in the color sequence (0-based)
 * @param length - Total number of colors needed for even distribution
 * @returns A string representing a pretty color.
 */
function generatePrettyColors(index: number, length: number = 1) {
	const [baseH, baseS, baseL] = [154.9, 100, 30]; // #009959

	// Distribute hue evenly across a 120-degree range (±60 from base) to avoid opposite colors
	const hueRange = 120; // Total range to distribute across
	const hueStep = length > 1 ? hueRange / (length - 1) : 0;
	const hueOffset = index * hueStep - hueRange / 2; // Center around base hue
	const newHue = (baseH + hueOffset + 360) % 360;

	// Use seeded random for slight saturation and lightness variations
	const seed2 = index * 78.233;
	const seed3 = index * 37.719;

	const saturationVariation = (seededRandom(seed2) - 0.5) * 20; // ±10%
	const lightnessVariation = (seededRandom(seed3) - 0.5) * 20; // ±10%

	const newSaturation = Math.max(40, Math.min(90, baseS + saturationVariation));
	const newLightness = Math.max(35, Math.min(75, baseL + lightnessVariation));

	return `hsl(${newHue}, ${newSaturation}%, ${newLightness}%)`;
}

export function addColors(inputs: string[]) {
	return inputs.map((input, index) => ({
		key: input,
		color: generatePrettyColors(index, inputs.length)
	}));
}
