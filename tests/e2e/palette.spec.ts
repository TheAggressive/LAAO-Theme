import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// @ts-expect-error -- plain .mjs helper shared with bin/ci/palette-baseline.mjs
import { resolvePaletteInPage } from '../../bin/ci/palette-probe.mjs';

/**
 * Palette colour contract.
 *
 * WordPress emits every theme.json palette entry as a CSS custom property.
 * This resolves each one through the browser and compares the result against a
 * committed baseline of rgb() values.
 *
 * Why resolved rgb rather than the declared string: the point is to catch a
 * change in the colour a visitor actually sees, not a change in how it happens
 * to be written. Rewriting hsl(0, 72.2%, 50.6%) as oklch(...) must be a no-op
 * here; a rewrite that shifts the colour must not be.
 *
 * Why this rather than screenshots: pixel comparison is flaky across platforms
 * (font rendering differs between a dev machine and a CI runner) and tells you
 * only that *something* moved. This says exactly which colour changed and by
 * how much.
 *
 * Regenerate the baseline with: pnpm palette:baseline
 */

type PaletteBaseline = {
	generatedFrom: string;
	note: string;
	colors: Record<string, string>;
};

const baseline: PaletteBaseline = JSON.parse(
	readFileSync(
		path.join(__dirname, 'fixtures', 'palette-baseline.json'),
		'utf8'
	)
);

/**
 * Resolves every palette slug to its rasterised sRGB value.
 *
 * @param page  Playwright page, already navigated.
 * @param slugs Palette slugs to resolve.
 * @return Map of slug to rasterised colour string.
 */
async function resolvePalette(
	page: import('@playwright/test').Page,
	slugs: string[]
): Promise<Record<string, string>> {
	return page.evaluate(resolvePaletteInPage, slugs);
}

test.describe('theme.json colour palette', () => {
	test('every palette colour resolves to its baseline rgb value', async ({
		page,
	}) => {
		await page.goto('/');

		const slugs = Object.keys(baseline.colors);
		const resolved = await resolvePalette(page, slugs);

		// Compare as a whole object so a failure reports every drifted colour
		// at once rather than stopping at the first.
		expect(resolved).toEqual(baseline.colors);
	});

	test('every palette colour is actually defined', async ({ page }) => {
		await page.goto('/');

		const slugs = Object.keys(baseline.colors);
		const resolved = await resolvePalette(page, slugs);

		// An undefined custom property leaves background-color at its initial
		// value, so the property silently disappearing would otherwise look
		// like a legitimate transparent colour.
		const undefined_ = slugs.filter(
			(slug) =>
				slug !== 'laao-transparent' &&
				resolved[slug] === 'rgba(0, 0, 0, 0)'
		);

		expect(
			undefined_,
			`these palette slugs resolved to nothing — is the slug still in theme.json?\n${undefined_.join('\n')}`
		).toHaveLength(0);
	});
});
