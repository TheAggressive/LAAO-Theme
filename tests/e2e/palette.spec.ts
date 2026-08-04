import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// @ts-expect-error -- plain .mjs helper shared with bin/ci/palette-baseline.mjs
import { resolvePaletteInPage } from '../../bin/ci/palette-probe.mjs';
// @ts-expect-error -- plain .mjs helper shared with bin/ci/palette-baseline.mjs
import {
	isIntentionallyTransparent,
	readDeclaredPalette,
} from '../../bin/ci/theme-palette.mjs';

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
	declared: Record<string, string>;
	colors: Record<string, string>;
};

const baseline: PaletteBaseline = JSON.parse(
	readFileSync(
		path.join(__dirname, 'fixtures', 'palette-baseline.json'),
		'utf8'
	)
);

/**
 * theme.json palette, read at test time via the same helper the baseline
 * generator uses, so the two cannot disagree about what a slug is declared as.
 *
 * Slugs come from theme.json rather than from the baseline: reading them from
 * the fixture would mean a newly added colour is simply never tested.
 */
const declaredPalette: Record<string, string> = readDeclaredPalette();

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

		const resolved = await resolvePalette(
			page,
			Object.keys(declaredPalette)
		);

		// Compare as a whole object so a failure reports every drifted colour
		// at once rather than stopping at the first.
		expect(resolved).toEqual(baseline.colors);
	});

	test('the baseline covers exactly the palette in theme.json', () => {
		// Guards the seam between the two files. Without this, adding a colour
		// leaves it untested, and removing one leaves a baseline entry that
		// nothing renders — neither of which the colour comparison would catch.
		expect(Object.keys(baseline.colors).sort()).toEqual(
			Object.keys(declaredPalette).sort()
		);

		// The recorded declarations must match what theme.json says now, or the
		// baseline is describing colours the theme no longer has.
		expect(baseline.declared).toEqual(declaredPalette);
	});

	test('every palette colour is actually defined', async ({ page }) => {
		await page.goto('/');

		const slugs = Object.keys(declaredPalette);
		const resolved = await resolvePalette(page, slugs);

		// An undefined custom property leaves background-color at its initial
		// value, so a property that silently disappeared would otherwise look
		// like a legitimate transparent colour.
		//
		// Alpha is read numerically rather than by matching a formatted string:
		// the probe emits "rgba(0, 0, 0, 0.000)", so comparing against
		// "rgba(0, 0, 0, 0)" matched nothing and this test could never fail.
		const isFullyTransparent = (value: string) => {
			const alpha = value.startsWith('rgba(')
				? Number.parseFloat(value.split(',')[3] ?? '1')
				: 1;
			return alpha === 0;
		};

		// A deliberately transparent colour and a missing custom property both
		// rasterise to zero alpha, so the declaration decides which this is —
		// following var() indirection to the underlying token.
		const undefined_ = slugs.filter(
			(slug) =>
				!isIntentionallyTransparent(declaredPalette[slug]) &&
				isFullyTransparent(resolved[slug])
		);

		expect(
			undefined_,
			`these palette slugs resolved to nothing — is the slug still in theme.json?\n${undefined_.join('\n')}`
		).toHaveLength(0);
	});
});
