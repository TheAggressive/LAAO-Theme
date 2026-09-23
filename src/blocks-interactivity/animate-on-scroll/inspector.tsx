/**
 * Animate On Scroll — Inspector controls.
 *
 * Extracted from edit.tsx to stay under the file-length cap. Editor-only
 * settings UI driven by the block attributes.
 *
 * @package Laao
 */

import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	BaseControl,
	Notice,
	Button,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import type {
	AnimateOnScrollAttributes,
	DetectionBoundary,
	EasingType,
	StaggerPattern,
} from './types';
import {
	getAnimationOptions,
	getDefaultDirection,
	getDirectionOptions,
} from './animation-config';
import { AnimationPresets } from './components/AnimationPresets';
import { SequenceBuilder } from './components/SequenceBuilder';
import { createStaggerSeed } from './stagger-math';

type DetectionBoundaryKey = keyof DetectionBoundary;

type ThresholdValue =
	| '0'
	| '1'
	| '0.9'
	| '0.8'
	| '0.7'
	| '0.6'
	| '0.5'
	| '0.4'
	| '0.3'
	| '0.2'
	| '0.1';

// Type guard function for runtime validation
function isValidThreshold(value: string): value is ThresholdValue {
	const validValues: ThresholdValue[] = [
		'0',
		'1',
		'0.9',
		'0.8',
		'0.7',
		'0.6',
		'0.5',
		'0.4',
		'0.3',
		'0.2',
		'0.1',
	];
	return validValues.includes(value as ThresholdValue);
}

// Safe accessor function with fallback
function getSafeThreshold(value: string): ThresholdValue {
	return isValidThreshold(value) ? value : '0.3'; // Falls back to default if invalid
}

interface AosInspectorProps {
	attributes: AnimateOnScrollAttributes;
	setAttributes: (attrs: Partial<AnimateOnScrollAttributes>) => void;
	childCount: number;
	isPreviewing: boolean;
	showNestedChildWarning: boolean;
	playPreview: () => void;
}

export function AosInspector({
	attributes,
	setAttributes,
	childCount,
	isPreviewing,
	showNestedChildWarning,
	playPreview,
}: AosInspectorProps): JSX.Element {
	return (
		<InspectorControls>
			{/* Animation Type Panel */}
			<PanelBody title={__('Animation Type', 'laao')} initialOpen={true}>
				<AnimationPresets
					attributes={attributes}
					onApplyPreset={(preset) => setAttributes(preset.attributes)}
				/>

				<div className="laao-animate-on-scroll-preview">
					<Button
						variant="secondary"
						onClick={playPreview}
						disabled={isPreviewing}
						__next40pxDefaultSize
					>
						{isPreviewing
							? __('Playing…', 'laao')
							: __('Preview animation', 'laao')}
					</Button>
					{attributes.useSequence && (
						<p className="components-base-control__help laao-animate-on-scroll-preview__help">
							{__(
								'Sequence mode previews each direct child’s step in the canvas (types cycle when there are more children than steps).',
								'laao'
							)}
						</p>
					)}
				</div>

				{showNestedChildWarning && (
					<Notice status="warning" isDismissible={false}>
						{__(
							'Stagger and sequence only animate direct children. This block has a single Group/columns wrapper — move paragraphs or cards out of the Group, or they will animate as one unit.',
							'laao'
						)}
					</Notice>
				)}

				<ToggleControl
					label={__('Use Animation Sequence', 'laao')}
					checked={attributes.useSequence}
					onChange={(useSequence) => {
						setAttributes({ useSequence });
						// Initialize sequence with current animation if starting sequence mode
						if (
							useSequence &&
							(!attributes.animationSequence ||
								attributes.animationSequence.length === 0)
						) {
							setAttributes({
								animationSequence: [
									{
										animation: attributes.animation,
										direction: attributes.direction || '',
									},
								],
							});
						}
					}}
					help={__(
						'Apply different animations to each child element in sequence',
						'laao'
					)}
					__nextHasNoMarginBottom
				/>

				{!attributes.useSequence ? (
					<>
						<SelectControl
							label={__('Animation Type', 'laao')}
							value={attributes.animation}
							options={getAnimationOptions()}
							onChange={(animation) => {
								setAttributes({
									animation,
									direction: getDefaultDirection(animation),
								});
							}}
							__next40pxDefaultSize
						/>
						{getDirectionOptions(attributes.animation).length >
							0 && (
							<SelectControl
								label={__('Direction', 'laao')}
								value={attributes.direction}
								options={getDirectionOptions(
									attributes.animation
								)}
								onChange={(direction) => {
									setAttributes({ direction });
								}}
								__next40pxDefaultSize
								__nextHasNoMarginBottom
							/>
						)}
					</>
				) : (
					<BaseControl
						label={__('Animation Sequence', 'laao')}
						__nextHasNoMarginBottom
					>
						<SequenceBuilder
							sequence={attributes.animationSequence}
							childCount={childCount}
							onChange={(animationSequence) =>
								setAttributes({ animationSequence })
							}
							fallbackAnimation={attributes.animation}
							fallbackDirection={attributes.direction}
						/>
					</BaseControl>
				)}

				<ToggleControl
					label={__('Reverse on Scroll Back', 'laao')}
					checked={attributes.reverseOnScrollBack}
					onChange={(reverseOnScrollBack) =>
						setAttributes({ reverseOnScrollBack })
					}
					help={__(
						'Animate elements out when scrolling back up past them. If stagger children is enabled, children will animate in reverse order.',
						'laao'
					)}
					__nextHasNoMarginBottom
				/>
			</PanelBody>

			{/* Animation Customization Panel - Only show for single animation mode */}
			{!attributes.useSequence && (
				<PanelBody
					title={__('Animation Customization', 'laao')}
					initialOpen={false}
				>
					{attributes.animation === 'slide' && (
						<RangeControl
							label={__('Slide Distance (px)', 'laao')}
							value={attributes.slideDistance}
							onChange={(slideDistance) =>
								setAttributes({ slideDistance })
							}
							min={10}
							max={200}
							step={5}
							help={__(
								'Distance the element slides during animation',
								'laao'
							)}
						/>
					)}

					{attributes.animation === 'zoom' && (
						<>
							<RangeControl
								label={__('Zoom In Start Scale', 'laao')}
								value={attributes.zoomInStart}
								onChange={(zoomInStart) =>
									setAttributes({ zoomInStart })
								}
								min={0.1}
								max={0.9}
								step={0.1}
								help={__(
									'Starting scale for zoom in animation',
									'laao'
								)}
							/>
							<RangeControl
								label={__('Zoom Out Start Scale', 'laao')}
								value={attributes.zoomOutStart}
								onChange={(zoomOutStart) =>
									setAttributes({ zoomOutStart })
								}
								min={1.1}
								max={3}
								step={0.1}
								help={__(
									'Starting scale for zoom out animation',
									'laao'
								)}
							/>
						</>
					)}

					{attributes.animation === 'rotate' && (
						<RangeControl
							label={__('Rotation Angle (degrees)', 'laao')}
							value={attributes.rotationAngle}
							onChange={(rotationAngle) =>
								setAttributes({ rotationAngle })
							}
							min={15}
							max={360}
							step={15}
							help={__(
								'Angle of rotation during animation',
								'laao'
							)}
						/>
					)}

					{attributes.animation === 'blur' && (
						<RangeControl
							label={__('Blur Amount (px)', 'laao')}
							value={attributes.blurAmount}
							onChange={(blurAmount) =>
								setAttributes({ blurAmount })
							}
							min={1}
							max={50}
							step={1}
							help={__(
								'Intensity of blur effect during animation',
								'laao'
							)}
						/>
					)}

					{attributes.animation === 'flip' && (
						<RangeControl
							label={__('Perspective (px)', 'laao')}
							value={attributes.perspective}
							onChange={(perspective) =>
								setAttributes({ perspective })
							}
							min={500}
							max={3000}
							step={100}
							help={__(
								'3D perspective depth for flip animation',
								'laao'
							)}
						/>
					)}

					{attributes.animation === 'bounce' && (
						<>
							<RangeControl
								label={__('Bounce Distance (px)', 'laao')}
								value={attributes.bounceDistance}
								onChange={(bounceDistance) =>
									setAttributes({ bounceDistance })
								}
								min={10}
								max={100}
								step={5}
								help={__(
									'Distance for standard and spring bounce animations',
									'laao'
								)}
							/>
							{attributes.direction === 'elastic' && (
								<RangeControl
									label={__('Elastic Distance (px)', 'laao')}
									value={attributes.elasticDistance}
									onChange={(elasticDistance) =>
										setAttributes({ elasticDistance })
									}
									min={20}
									max={150}
									step={5}
									help={__(
										'Distance for elastic bounce animation',
										'laao'
									)}
								/>
							)}
						</>
					)}
				</PanelBody>
			)}

			{/* Timing Panel */}
			<PanelBody title={__('Timing', 'laao')} initialOpen={false}>
				<RangeControl
					label={__('Duration (seconds)', 'laao')}
					value={attributes.duration}
					onChange={(duration) => setAttributes({ duration })}
					min={0.1}
					max={2}
					step={0.1}
					help={__(
						'How long the animation takes to complete',
						'laao'
					)}
				/>

				<SelectControl
					label={__('Easing Function', 'laao')}
					value={attributes.easing}
					options={[
						{
							label: __('Ease (Default)', 'laao'),
							value: 'ease',
						},
						{ label: __('Linear', 'laao'), value: 'linear' },
						{ label: __('Ease In', 'laao'), value: 'ease-in' },
						{
							label: __('Ease Out', 'laao'),
							value: 'ease-out',
						},
						{
							label: __('Ease In Out', 'laao'),
							value: 'ease-in-out',
						},
						{
							label: __('Overshoot', 'laao'),
							value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
						},
						{
							label: __('Bounce', 'laao'),
							value: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
						},
						{
							label: __('Elastic', 'laao'),
							value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
						},
					]}
					onChange={(easing) =>
						setAttributes({ easing: easing as EasingType })
					}
					help={__(
						'The timing function for the animation transition',
						'laao'
					)}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				<RangeControl
					label={__('Initial Delay (seconds)', 'laao')}
					value={attributes.initialDelay}
					onChange={(initialDelay) => setAttributes({ initialDelay })}
					min={0}
					max={2}
					step={0.1}
					help={__(
						"Delay before animation starts. When stagger is enabled, this delay is added to each child's stagger delay.",
						'laao'
					)}
				/>

				<ToggleControl
					label={__('Stagger Children', 'laao')}
					checked={attributes.staggerChildren}
					onChange={(staggerChildren) =>
						setAttributes({ staggerChildren })
					}
					help={sprintf(
						/* translators: %d: number of direct child blocks. */
						_n(
							'Cascade each direct child with a delay between them. Currently %d direct child — add siblings (not a wrapping Group) for a cascade.',
							'Cascade each direct child with a delay between them. Currently %d direct children. Nested Groups count as one child.',
							childCount,
							'laao'
						),
						childCount
					)}
					__nextHasNoMarginBottom
				/>
				{attributes.staggerChildren && (
					<>
						<SelectControl
							label={__('Stagger Pattern', 'laao')}
							value={attributes.staggerPattern}
							options={[
								{
									label: __('Sequential', 'laao'),
									value: 'sequential',
								},
								{ label: __('Wave', 'laao'), value: 'wave' },
								{
									label: __('Random', 'laao'),
									value: 'random',
								},
							]}
							onChange={(staggerPattern) => {
								const next = staggerPattern as StaggerPattern;
								const updates: Partial<AnimateOnScrollAttributes> =
									{
										staggerPattern: next,
									};
								if (
									next === 'random' &&
									!attributes.staggerSeed
								) {
									updates.staggerSeed = createStaggerSeed();
								}
								setAttributes(updates);
							}}
							help={__(
								'How the stagger delay is applied to children',
								'laao'
							)}
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>

						{attributes.staggerPattern === 'sequential' && (
							<RangeControl
								label={__('Stagger Delay (seconds)', 'laao')}
								value={attributes.staggerDelay}
								onChange={(staggerDelay) =>
									setAttributes({ staggerDelay })
								}
								min={0.1}
								max={1}
								step={0.1}
								help={__(
									'Delay between each child element animation',
									'laao'
								)}
							/>
						)}

						{attributes.staggerPattern === 'wave' && (
							<>
								<RangeControl
									label={__('Wave Frequency', 'laao')}
									value={attributes.staggerWaveFrequency}
									onChange={(staggerWaveFrequency) =>
										setAttributes({ staggerWaveFrequency })
									}
									min={1}
									max={10}
									step={1}
									help={__(
										'Number of wave cycles across all children',
										'laao'
									)}
								/>
								<RangeControl
									label={__('Base Delay (seconds)', 'laao')}
									value={attributes.staggerDelay}
									onChange={(staggerDelay) =>
										setAttributes({ staggerDelay })
									}
									min={0}
									max={1}
									step={0.1}
									help={__(
										'Base delay for wave pattern',
										'laao'
									)}
								/>
							</>
						)}

						{attributes.staggerPattern === 'random' && (
							<>
								<RangeControl
									label={__(
										'Min Random Delay (seconds)',
										'laao'
									)}
									value={attributes.staggerRandomMin}
									onChange={(staggerRandomMin) =>
										setAttributes({ staggerRandomMin })
									}
									min={0}
									max={2}
									step={0.1}
									help={__(
										'Minimum random delay for each child',
										'laao'
									)}
								/>
								<RangeControl
									label={__(
										'Max Random Delay (seconds)',
										'laao'
									)}
									value={attributes.staggerRandomMax}
									onChange={(staggerRandomMax) =>
										setAttributes({ staggerRandomMax })
									}
									min={0}
									max={2}
									step={0.1}
									help={__(
										'Maximum random delay for each child',
										'laao'
									)}
								/>
								<div className="laao-animate-on-scroll-preview">
									<Button
										variant="secondary"
										onClick={() =>
											setAttributes({
												staggerSeed:
													createStaggerSeed(),
											})
										}
										__next40pxDefaultSize
									>
										{__('Reshuffle delays', 'laao')}
									</Button>
									<p className="components-base-control__help laao-animate-on-scroll-preview__help">
										{__(
											'Random delays are seeded so the cascade stays the same across reloads. Reshuffle picks a new pattern.',
											'laao'
										)}
									</p>
								</div>
							</>
						)}
					</>
				)}
			</PanelBody>

			{/* Trigger Settings Panel */}
			<PanelBody
				title={__('Trigger Settings', 'laao')}
				initialOpen={false}
			>
				<SelectControl
					label={__('Visibility Trigger', 'laao')}
					value={getSafeThreshold(attributes.threshold)}
					options={[
						{
							label: __('100% of Element', 'laao'),
							value: '1',
						},
						{
							label: __('90% of Element', 'laao'),
							value: '0.9',
						},
						{
							label: __('80% of Element', 'laao'),
							value: '0.8',
						},
						{
							label: __('70% of Element', 'laao'),
							value: '0.7',
						},
						{
							label: __('60% of Element', 'laao'),
							value: '0.6',
						},
						{
							label: __('50% of Element', 'laao'),
							value: '0.5',
						},
						{
							label: __('40% of Element', 'laao'),
							value: '0.4',
						},
						{
							label: __('30% of Element (Default)', 'laao'),
							value: '0.3',
						},
						{
							label: __('20% of Element', 'laao'),
							value: '0.2',
						},
						{
							label: __('10% of Element', 'laao'),
							value: '0.1',
						},
						{ label: __('0% of Element', 'laao'), value: '0' },
					]}
					onChange={(threshold) =>
						setAttributes({
							threshold: getSafeThreshold(threshold),
						})
					}
					help={__(
						"What percentage of the target's visibility should be in the Detection Boundary before the animation triggers.",
						'laao'
					)}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				<BaseControl
					id="detection-boundary"
					label={__('Detection Boundary', 'laao')}
					help={__(
						'Negative values delay trigger until element is further in viewport. -50% means element must be halfway into viewport before triggering.',
						'laao'
					)}
					__nextHasNoMarginBottom
				>
					<div className="laao-animate-on-scroll-detection-boundary">
						{(['top', 'right', 'bottom', 'left'] as const).map(
							(direction) => {
								const boundaryKey =
									direction as DetectionBoundaryKey;
								return (
									<div
										key={direction}
										className="laao-animate-on-scroll-detection-boundary__field"
									>
										<UnitControl
											id={`boundary-${direction}`}
											label={
												direction
													.charAt(0)
													.toUpperCase() +
												direction.slice(1)
											}
											value={
												attributes.detectionBoundary[
													boundaryKey
												]
											}
											onChange={(value) =>
												setAttributes({
													detectionBoundary: {
														...attributes.detectionBoundary,
														[boundaryKey]: value,
													},
												})
											}
											units={[
												{
													value: '%',
													label: '%',
													default: 0,
												},
												{
													value: 'px',
													label: 'px',
													default: 0,
												},
											]}
											__next40pxDefaultSize={true}
										/>
									</div>
								);
							}
						)}
					</div>
				</BaseControl>
			</PanelBody>

			{/* Debug Panel */}
			<PanelBody
				title={__('Debug & Accessibility', 'laao')}
				initialOpen={false}
			>
				<ToggleControl
					label={__('Debug Mode', 'laao')}
					checked={attributes.debugMode}
					onChange={(debugMode) => setAttributes({ debugMode })}
					help={__(
						'Shows visual indicators for the Detection Boundary & Visibility Trigger',
						'laao'
					)}
					__nextHasNoMarginBottom
				/>

				<ToggleControl
					label={__('Respect Reduced Motion', 'laao')}
					checked={attributes.respectReducedMotion}
					onChange={(respectReducedMotion) =>
						setAttributes({ respectReducedMotion })
					}
					help={__(
						'Disable animations for users who prefer reduced motion',
						'laao'
					)}
					__nextHasNoMarginBottom
				/>

				<ToggleControl
					label={__('Screen Reader Announcements', 'laao')}
					checked={attributes.announceToScreenReader}
					onChange={(announceToScreenReader) =>
						setAttributes({ announceToScreenReader })
					}
					help={__(
						'Announce when content animates into view. Off by default — enable only when a single block is critical to understand.',
						'laao'
					)}
					__nextHasNoMarginBottom
				/>
			</PanelBody>
		</InspectorControls>
	);
}
