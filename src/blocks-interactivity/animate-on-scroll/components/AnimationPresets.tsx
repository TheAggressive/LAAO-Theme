/**
 * AnimationPresets - One-click starting points for the Animate On Scroll
 * block.
 *
 * Each preset patches a curated set of attributes (animation or sequence,
 * timing, stagger) so new users get a polished result without touching
 * individual controls. Everything a preset sets remains editable
 * afterwards.
 *
 * @package Laao
 */

import { __ } from '@wordpress/i18n';
import { findActivePresetKey, PresetPicker } from '../../editor-shared';
import type { AnimateOnScrollAttributes } from '../types';

export interface AnimationPreset {
	name: string;
	description: string;
	attributes: Partial<AnimateOnScrollAttributes>;
}

export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
	gentleFade: {
		name: __('Gentle Fade', 'laao'),
		description: __('Soft fade-in, safe everywhere', 'laao'),
		attributes: {
			useSequence: false,
			animation: 'fade',
			direction: '',
			duration: 0.6,
			easing: 'ease-out',
			initialDelay: 0,
			staggerChildren: false,
		},
	},
	riseUp: {
		name: __('Rise Up', 'laao'),
		description: __('Content slides up as it enters', 'laao'),
		attributes: {
			useSequence: false,
			animation: 'slide',
			direction: 'up',
			slideDistance: 40,
			duration: 0.6,
			easing: 'ease-out',
			initialDelay: 0,
			staggerChildren: false,
		},
	},
	cascade: {
		name: __('Cascade', 'laao'),
		description: __(
			'Children rise one after another — great for lists and grids',
			'laao'
		),
		attributes: {
			useSequence: false,
			animation: 'slide',
			direction: 'up',
			slideDistance: 30,
			duration: 0.5,
			easing: 'ease-out',
			initialDelay: 0,
			staggerChildren: true,
			staggerPattern: 'sequential',
			staggerDelay: 0.15,
		},
	},
	zoomPop: {
		name: __('Zoom Pop', 'laao'),
		description: __('Springy zoom-in for cards and callouts', 'laao'),
		attributes: {
			useSequence: false,
			animation: 'zoom',
			direction: 'in',
			zoomInStart: 0.8,
			duration: 0.5,
			easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			initialDelay: 0,
			staggerChildren: true,
			staggerPattern: 'sequential',
			staggerDelay: 0.1,
		},
	},
	heroReveal: {
		name: __('Hero Reveal', 'laao'),
		description: __(
			'Sequence: heading fades, then content rises — for hero sections',
			'laao'
		),
		attributes: {
			useSequence: true,
			animationSequence: [
				{ animation: 'fade', direction: '' },
				{ animation: 'slide', direction: 'up', slideDistance: 40 },
				{ animation: 'slide', direction: 'up', slideDistance: 40 },
			],
			duration: 0.7,
			easing: 'ease-out',
			initialDelay: 0.1,
			staggerChildren: true,
			staggerPattern: 'sequential',
			staggerDelay: 0.2,
		},
	},
	zigZag: {
		name: __('Zig-Zag', 'laao'),
		description: __(
			'Sequence: children alternate sliding in from left and right',
			'laao'
		),
		attributes: {
			useSequence: true,
			animationSequence: [
				{ animation: 'slide', direction: 'left', slideDistance: 60 },
				{ animation: 'slide', direction: 'right', slideDistance: 60 },
			],
			duration: 0.6,
			easing: 'ease-out',
			initialDelay: 0,
			staggerChildren: true,
			staggerPattern: 'sequential',
			staggerDelay: 0.15,
		},
	},
	softFocus: {
		name: __('Soft Focus', 'laao'),
		description: __(
			'Blurred content sharpens into place — for editorial imagery',
			'laao'
		),
		attributes: {
			useSequence: false,
			animation: 'blur',
			direction: '',
			duration: 0.8,
			easing: 'ease-out',
			initialDelay: 0,
			staggerChildren: false,
		},
	},
	flipReveal: {
		name: __('Flip Reveal', 'laao'),
		description: __('Cards flip up one by one — for product grids', 'laao'),
		attributes: {
			useSequence: false,
			animation: 'flip',
			direction: 'up',
			duration: 0.6,
			easing: 'ease-out',
			initialDelay: 0,
			staggerChildren: true,
			staggerPattern: 'sequential',
			staggerDelay: 0.12,
		},
	},
};

const PRESET_TILES = Object.entries(ANIMATION_PRESETS).map(([key, preset]) => ({
	key,
	name: preset.name,
	description: preset.description,
	value: preset,
}));

interface AnimationPresetsProps {
	/** Current block attributes, used to highlight the matching preset. */
	attributes?: AnimateOnScrollAttributes;
	onApplyPreset: (_preset: AnimationPreset) => void;
}

export const AnimationPresets = ({
	attributes,
	onApplyPreset,
}: AnimationPresetsProps) => {
	const activeKey = attributes
		? findActivePresetKey(
				PRESET_TILES.map((tile) => ({
					key: tile.key,
					value: tile.value.attributes,
				})),
				attributes
			)
		: null;

	return (
		<PresetPicker
			presets={PRESET_TILES}
			activeKey={activeKey}
			onApply={(tile) => onApplyPreset(tile.value)}
		/>
	);
};
