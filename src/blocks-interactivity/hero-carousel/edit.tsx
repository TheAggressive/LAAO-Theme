/**
 * Hero Carousel Block — Editor Component.
 *
 * Slides are core/cover inner blocks, so every slide inherits Cover's full
 * editing surface (media, focal point, overlay, duotone, inner content).
 * The editor renders slides as a horizontal snap strip that mirrors the
 * frontend track, with a "stack slides" edit mode for comfortable editing.
 *
 * @package Laao
 */

import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import type { BlockEditProps } from '@wordpress/blocks';
import type { CSSProperties } from 'react';

import type {
	HeroCarouselAttributes,
	HeroTransition,
	HeroArrowPosition,
	HeroPagination,
	HeroMotionMode,
	HeroContentAnimation,
} from './types';
import { HERO_MOTION_MODES } from './motion';

type EditProps = BlockEditProps<HeroCarouselAttributes>;

/** CSS custom properties that TypeScript doesn't include in CSSProperties. */
type EditorStyle = CSSProperties & { [key: `--${string}`]: string };

const ALLOWED_BLOCKS = ['core/cover'];

const SLIDE_TEMPLATE: Array<[string, Record<string, unknown>]> = [
	[
		'core/cover',
		{
			dimRatio: 40,
			overlayColor: 'black',
			isUserOverlayColor: true,
			minHeight: 85,
			minHeightUnit: 'vh',
			align: 'full',
		},
	],
	[
		'core/cover',
		{
			dimRatio: 40,
			overlayColor: 'black',
			isUserOverlayColor: true,
			minHeight: 85,
			minHeightUnit: 'vh',
			align: 'full',
		},
	],
];

const TRANSITIONS = [
	{ label: __('Slide', 'laao'), value: 'slide' },
	{ label: __('Fade', 'laao'), value: 'fade' },
	{ label: __('Crossfade + zoom', 'laao'), value: 'crossfade' },
];

const ARROW_POSITIONS = [
	{ label: __('Edges', 'laao'), value: 'edges' },
	{ label: __('Bottom cluster', 'laao'), value: 'bottom' },
];

const PAGINATIONS = [
	{ label: __('Dots', 'laao'), value: 'dots' },
	{ label: __('Lines', 'laao'), value: 'lines' },
	{ label: __('Numbers', 'laao'), value: 'numbers' },
	{ label: __('Fraction (2 / 5)', 'laao'), value: 'fraction' },
	{ label: __('Thumbnails', 'laao'), value: 'thumbnails' },
	{ label: __('None', 'laao'), value: 'none' },
];

const CONTENT_ANIMATIONS = [
	{ label: __('None', 'laao'), value: 'none' },
	{ label: __('Fade up', 'laao'), value: 'fade-up' },
	{ label: __('Clip reveal', 'laao'), value: 'clip' },
	{ label: __('Blur in', 'laao'), value: 'blur' },
];

export default function Edit({
	attributes,
	setAttributes,
	clientId,
}: EditProps) {
	const {
		transition,
		minHeight,
		autoplay,
		autoplaySpeed,
		loop,
		pauseOnHover,
		transitionMs,
		showArrows,
		arrowPosition,
		pagination,
		showProgress,
		deepLink,
		motion,
		motionDuration,
		contentAnimation,
		arrowColor,
		arrowBg,
		dotColor,
		dotActiveColor,
	} = attributes;

	const [isStacked, setIsStacked] = useState(false);
	const trackRef = useRef<HTMLDivElement | null>(null);
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const slideCount = useSelect(
		(select) => select(blockEditorStore).getBlockCount(clientId),
		[clientId]
	);

	/**
	 * Client id of the Cover slide that owns the current selection (Cover itself
	 * or a nested child). Empty when nothing inside this carousel is selected.
	 */
	const selectedSlideClientId = useSelect(
		(select) => {
			const {
				getSelectedBlockClientId,
				getBlockParents,
				getBlockOrder,
				getBlockName,
			} = select(blockEditorStore);
			const selectedId = getSelectedBlockClientId();
			if (!selectedId) {
				return '';
			}

			const parents = getBlockParents(selectedId);
			if (selectedId === clientId || !parents.includes(clientId)) {
				return '';
			}

			const slideIds = getBlockOrder(clientId);
			let current: string | null = selectedId;
			while (current) {
				if (
					slideIds.includes(current) &&
					getBlockName(current) === 'core/cover'
				) {
					return current;
				}
				const parentList = getBlockParents(current);
				current = parentList[parentList.length - 1] ?? null;
				if (current === clientId) {
					break;
				}
			}
			return '';
		},
		[clientId]
	);

	// Strip mode: bring the selected Cover into the horizontal track viewport.
	// Without this, clicking a partially off-screen slide selects it but leaves
	// the track scrolled elsewhere — so "some focus, some don't."
	useEffect(() => {
		if (isStacked || !selectedSlideClientId) {
			return;
		}
		const track = trackRef.current;
		if (!track) {
			return;
		}
		const slide = track.querySelector<HTMLElement>(
			`[data-block="${selectedSlideClientId}"]`
		);
		slide?.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest',
			inline: 'nearest',
		});
	}, [isStacked, selectedSlideClientId]);

	const blockProps = useBlockProps({
		className: [
			'laao-hero-editor',
			isStacked ? 'laao-hero-editor--stacked' : 'laao-hero-editor--strip',
		].join(' '),
		style: {
			'--laao-hero-min-height': minHeight,
		} as EditorStyle,
	});

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'laao-hero-editor__track',
			ref: trackRef,
		},
		{
			allowedBlocks: ALLOWED_BLOCKS,
			template: SLIDE_TEMPLATE,
			orientation: isStacked ? 'vertical' : 'horizontal',
		}
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Carousel', 'laao')} initialOpen>
					<ToggleControl
						label={__('Edit mode: stack slides', 'laao')}
						help={__(
							'Stacks all slides vertically in the editor for easy editing. Does not affect the frontend.',
							'laao'
						)}
						checked={isStacked}
						onChange={setIsStacked}
						__nextHasNoMarginBottom
					/>
					<SelectControl<string>
						label={__('Transition', 'laao')}
						value={transition}
						options={TRANSITIONS}
						onChange={(val) =>
							setAttributes({ transition: val as HeroTransition })
						}
						help={__(
							'Slide uses a native swipeable track. Fade cross-fades stacked slides; Crossfade + zoom adds a subtle scale on entry.',
							'laao'
						)}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					{transition !== 'slide' && (
						<RangeControl
							label={__('Transition duration (ms)', 'laao')}
							help={__(
								'Lower = snappier fade between slides. Higher = slower, softer crossfade.',
								'laao'
							)}
							value={transitionMs}
							onChange={(val) =>
								setAttributes({ transitionMs: val ?? 700 })
							}
							min={100}
							max={3000}
							step={50}
						/>
					)}
					<UnitControl
						label={__('Minimum height', 'laao')}
						value={minHeight}
						onChange={(val: string | undefined) =>
							setAttributes({ minHeight: val || '85svh' })
						}
						units={[
							{ value: 'svh', label: 'svh', default: 85 },
							{ value: 'vh', label: 'vh', default: 85 },
							{ value: 'px', label: 'px', default: 640 },
							{ value: 'rem', label: 'rem', default: 40 },
						]}
					/>
					<ToggleControl
						label={__('Loop', 'laao')}
						help={__(
							'Wrap from the last slide back to the first.',
							'laao'
						)}
						checked={loop}
						onChange={(val) => setAttributes({ loop: val })}
						__nextHasNoMarginBottom
					/>
				</PanelBody>

				<PanelBody title={__('Autoplay', 'laao')} initialOpen={false}>
					<ToggleControl
						label={__('Autoplay', 'laao')}
						help={__(
							'A visible pause button is always shown when autoplay is on. Autoplay is disabled for visitors who prefer reduced motion.',
							'laao'
						)}
						checked={autoplay}
						onChange={(val) => setAttributes({ autoplay: val })}
						__nextHasNoMarginBottom
					/>
					{autoplay && (
						<>
							<RangeControl
								label={__('Slide duration (seconds)', 'laao')}
								help={__(
									'How long each slide stays before advancing. Lower = faster carousel. Higher = more time to read each slide.',
									'laao'
								)}
								value={autoplaySpeed / 1000}
								onChange={(val) =>
									setAttributes({
										autoplaySpeed: Math.round(
											(val ?? 6) * 1000
										),
									})
								}
								min={2}
								max={20}
								step={0.5}
							/>
							<ToggleControl
								label={__('Pause on hover', 'laao')}
								checked={pauseOnHover}
								onChange={(val) =>
									setAttributes({ pauseOnHover: val })
								}
								__nextHasNoMarginBottom
							/>
							<ToggleControl
								label={__(
									'Show progress on active dot',
									'laao'
								)}
								checked={showProgress}
								onChange={(val) =>
									setAttributes({ showProgress: val })
								}
								__nextHasNoMarginBottom
							/>
						</>
					)}
				</PanelBody>

				<PanelBody
					title={__('Background Animation', 'laao')}
					initialOpen={false}
				>
					<SelectControl<string>
						label={__('Background motion', 'laao')}
						value={motion}
						options={HERO_MOTION_MODES}
						onChange={(val) =>
							setAttributes({ motion: val as HeroMotionMode })
						}
						help={__(
							'Ambient motion on the slide background. Transform effects pan around each Cover\u2019s focal point. Alternate switches zoom in/out; Random picks from the full motion set.',
							'laao'
						)}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					{motion !== 'none' && (
						<RangeControl
							label={__('Motion duration (seconds)', 'laao')}
							help={__(
								'How long one background motion cycle takes. Lower = faster, more noticeable motion. Higher = slower, subtler drift.',
								'laao'
							)}
							value={motionDuration}
							onChange={(val) =>
								setAttributes({ motionDuration: val ?? 12 })
							}
							min={4}
							max={30}
							step={1}
						/>
					)}
					<SelectControl<string>
						label={__('Content entrance', 'laao')}
						value={contentAnimation}
						options={CONTENT_ANIMATIONS}
						onChange={(val) =>
							setAttributes({
								contentAnimation: val as HeroContentAnimation,
							})
						}
						help={__(
							'Staggered entrance for slide content each time a slide becomes active.',
							'laao'
						)}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>

				<PanelBody title={__('Navigation', 'laao')} initialOpen={false}>
					<ToggleControl
						label={__('Show arrows', 'laao')}
						checked={showArrows}
						onChange={(val) => setAttributes({ showArrows: val })}
						__nextHasNoMarginBottom
					/>
					{showArrows && (
						<SelectControl<string>
							label={__('Arrow position', 'laao')}
							value={arrowPosition}
							options={ARROW_POSITIONS}
							onChange={(val) =>
								setAttributes({
									arrowPosition: val as HeroArrowPosition,
								})
							}
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					)}
					<SelectControl<string>
						label={__('Pagination', 'laao')}
						value={pagination}
						options={PAGINATIONS}
						onChange={(val) =>
							setAttributes({ pagination: val as HeroPagination })
						}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={__('Deep link to slides', 'laao')}
						help={__(
							'Reflects the active slide in the URL and opens the matching slide when the page loads with a #…-slide-N hash. Requires an HTML anchor (Advanced panel).',
							'laao'
						)}
						checked={deepLink}
						onChange={(val) => setAttributes({ deepLink: val })}
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>

			{/* Color panel sits above Dimensions in the Styles tab. */}
			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					panelId={clientId}
					settings={[
						{
							label: __('Arrow icon', 'laao'),
							colorValue: arrowColor || undefined,
							onColorChange: (value?: string) =>
								setAttributes({ arrowColor: value ?? '' }),
						},
						{
							label: __('Arrow background', 'laao'),
							colorValue: arrowBg || undefined,
							onColorChange: (value?: string) =>
								setAttributes({ arrowBg: value ?? '' }),
						},
						{
							label: __('Pagination', 'laao'),
							colorValue: dotColor || undefined,
							onColorChange: (value?: string) =>
								setAttributes({ dotColor: value ?? '' }),
						},
						{
							label: __('Pagination (active)', 'laao'),
							colorValue: dotActiveColor || undefined,
							onColorChange: (value?: string) =>
								setAttributes({ dotActiveColor: value ?? '' }),
						},
					]}
					__experimentalIsRenderedInSidebar
					{...colorGradientSettings}
				/>
			</InspectorControls>

			<section {...blockProps}>
				<div className="laao-hero-editor__meta">
					<span className="laao-hero-editor__badge">
						{__('Hero Carousel', 'laao')}
					</span>
					<span className="laao-hero-editor__count">
						{slideCount === 1
							? __('1 slide', 'laao')
							: `${slideCount} ${__('slides', 'laao')}`}
					</span>
				</div>
				<div {...innerBlocksProps} />
			</section>
		</>
	);
}
