/**
 * Hero Carousel — background motion variants.
 *
 * Shared by the carousel inspector and per-slide Cover overrides so the
 * option lists stay in sync. Variant slugs live in `motion-variants.json`
 * (also loaded by render.php).
 *
 * @package Laao
 */

import { __ } from '@wordpress/i18n';

import variants from './motion-variants.json';

/**
 * Concrete per-slide motion classes (excludes carousel meta modes).
 * JSON imports as `string[]`; assert through `unknown` to the tuple shape
 * that matches `motion-variants.json` (kept in sync with render.php).
 */
export const HERO_MOTION_VARIANTS = variants as unknown as readonly [
	'zoom-in',
	'zoom-out',
	'pan-left',
	'pan-right',
	'pan-up',
	'pan-down',
	'diagonal',
	'zoom-pan',
	'punch-in',
	'pull-back',
	'breathe',
	'idle-sway',
	'blur-sharp',
	'brightness',
	'colorize',
	'clip-reveal',
	'slide-in',
	'scale-edge',
	'tilt',
	'orbit',
	'grain',
];

export type HeroMotionVariant = (typeof HERO_MOTION_VARIANTS)[number];

/** Carousel-level attribute values (variants + assignment modes). */
export type HeroMotionMode =
	'none' | HeroMotionVariant | 'alternate' | 'random';

const VARIANT_LABELS: Record<HeroMotionVariant, string> = {
	'zoom-in': __('Zoom in', 'laao'),
	'zoom-out': __('Zoom out', 'laao'),
	'pan-left': __('Pan left', 'laao'),
	'pan-right': __('Pan right', 'laao'),
	'pan-up': __('Pan up', 'laao'),
	'pan-down': __('Pan down', 'laao'),
	diagonal: __('Diagonal drift', 'laao'),
	'zoom-pan': __('Zoom + pan', 'laao'),
	'punch-in': __('Punch in', 'laao'),
	'pull-back': __('Pull back', 'laao'),
	breathe: __('Breathing', 'laao'),
	'idle-sway': __('Idle sway', 'laao'),
	'blur-sharp': __('Blur to sharp', 'laao'),
	brightness: __('Brightness lift', 'laao'),
	colorize: __('Colorize', 'laao'),
	'clip-reveal': __('Clip reveal', 'laao'),
	'slide-in': __('Slide in', 'laao'),
	'scale-edge': __('Scale from edge', 'laao'),
	tilt: __('Tilt zoom', 'laao'),
	orbit: __('Orbit drift', 'laao'),
	grain: __('Film grain drift', 'laao'),
};

/** Carousel inspector options (includes alternate / random). */
export const HERO_MOTION_MODES: Array<{
	label: string;
	value: HeroMotionMode;
}> = [
	{ label: __('None', 'laao'), value: 'none' },
	...HERO_MOTION_VARIANTS.map((value) => ({
		label: VARIANT_LABELS[value],
		value,
	})),
	{
		label: __('Alternate per slide', 'laao'),
		value: 'alternate',
	},
	{
		label: __('Random per slide', 'laao'),
		value: 'random',
	},
];

/** Per-slide Cover override options (inherit + none + concrete variants). */
export const HERO_MOTION_OVERRIDE_OPTIONS: Array<{
	label: string;
	value: string;
}> = [
	{
		label: __('Inherit from carousel', 'laao'),
		value: '',
	},
	{ label: __('None', 'laao'), value: 'none' },
	...HERO_MOTION_VARIANTS.map((value) => ({
		label: VARIANT_LABELS[value],
		value,
	})),
];
