/**
 * The block editor must be able to name every palette colour.
 *
 * WordPress resolves the label under a colour swatch with
 * extractColorNameFromCurrentValue(), which normalises through colord — and
 * colord 2.9.3, the version WordPress 7.0.2 bundles, has no oklch parser.
 * A palette declared in bare oklch() therefore collapses to #000000 for every
 * entry, the first entry matches every time, and the editor labels every
 * colour with the first colour's name.
 *
 * theme.json avoids this by holding the oklch values in settings.custom and
 * pointing the palette at them with var(). isSimpleCSSColor() returns false for
 * anything containing var(), so WordPress skips colord entirely and compares
 * the strings — which is exact.
 *
 * This is a unit test rather than an E2E one because it asserts a property of
 * theme.json against the resolver WordPress actually uses, with no site
 * required. Verified against the reference implementation in the Aggressive
 * Apparel theme, which has this defect in 9 of its 12 palette entries.
 */

import { extractColorNameFromCurrentValue } from '@wordpress/components/build/color-palette/utils';

import themeJson from '../../theme.json';

const palette = themeJson.settings.color.palette.map((entry) => ({
	name: entry.name,
	color: entry.color,
}));

describe('theme.json palette in the block editor', () => {
	it('declares at least one colour', () => {
		expect(palette.length).toBeGreaterThan(0);
	});

	it.each(palette)(
		'labels $name correctly in the colour picker',
		({ name, color }) => {
			expect(
				extractColorNameFromCurrentValue(color, palette, false)
			).toBe(name);
		}
	);

	it('declares no palette colour in a notation colord cannot parse', () => {
		// The failure above is silent and easy to reintroduce, so state the
		// underlying rule too: a value is safe if WordPress skips colord for it
		// (var(), color-mix()), or if colord can genuinely parse it.
		const colordCannotParse = /^\s*(oklch|oklab|lch|lab|color)\(/i;

		const unsafe = palette.filter(
			({ color }) =>
				colordCannotParse.test(color) &&
				!color.includes('var(') &&
				!color.includes('color-mix(')
		);

		expect(unsafe.map((entry) => `${entry.name}: ${entry.color}`)).toEqual(
			[]
		);
	});
});
