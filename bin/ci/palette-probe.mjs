/**
 * Browser-side palette probe, shared by the Playwright spec and the baseline
 * generator so the two can never measure different things.
 *
 * Resolving a custom property with getComputedStyle is not enough. Chromium
 * preserves modern colour functions verbatim — a value declared as oklch()
 * comes back as "oklch(0.5771 0.2152 27.33)", not "rgb(220, 38, 38)". Comparing
 * those strings would report a correct hsl -> oklch conversion as a change,
 * while missing a genuine colour shift rewritten in the same notation.
 *
 * So the colour is painted to a 1x1 canvas and read back. That yields the sRGB
 * bytes actually rasterised to the screen, independent of how the colour was
 * written — which is the thing worth asserting on.
 */

/**
 * Resolves palette slugs to rasterised sRGB values.
 *
 * Runs inside the page: it is passed to page.evaluate() and serialised, so it
 * must not close over anything from the module scope.
 *
 * @param {string[]} paletteSlugs Palette slugs, without the custom-property prefix.
 * @return {Record<string, string>} Map of slug to "rgb(r, g, b)" or "rgba(r, g, b, a)".
 */
export function resolvePaletteInPage(paletteSlugs) {
	const probe = document.createElement('div');
	// Off-screen but still laid out: a display:none element is not guaranteed
	// to have its custom properties resolved.
	probe.style.position = 'absolute';
	probe.style.left = '-9999px';
	document.body.appendChild(probe);

	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const context = canvas.getContext('2d', { willReadFrequently: true });

	const resolved = {};

	for (const slug of paletteSlugs) {
		probe.style.backgroundColor = '';
		probe.style.backgroundColor = `var(--wp--preset--color--${slug})`;

		const computed = window.getComputedStyle(probe).backgroundColor;

		// Assigning an unparsable value to fillStyle is a silent no-op, so
		// without a sentinel the canvas would still hold the previous slug's
		// colour and report it as this one's. Set a known value first and
		// confirm the assignment actually took.
		context.fillStyle = '#000000';
		context.fillStyle = computed;

		if (context.fillStyle === '#000000' && computed !== 'rgb(0, 0, 0)') {
			resolved[slug] = `UNPARSABLE(${computed})`;
			continue;
		}

		context.clearRect(0, 0, 1, 1);
		context.fillRect(0, 0, 1, 1);

		const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;

		resolved[slug] =
			a === 255
				? `rgb(${r}, ${g}, ${b})`
				: `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
	}

	probe.remove();
	return resolved;
}
