/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const baseAnimations = {
	fade: {
		label: __('Fade', 'laao'),
		hasDirection: false,
	},
	slide: {
		label: __('Slide', 'laao'),
		hasDirection: true,
		directions: [
			{ label: __('Up', 'laao'), value: 'up' },
			{ label: __('Down', 'laao'), value: 'down' },
			{ label: __('Left', 'laao'), value: 'left' },
			{ label: __('Right', 'laao'), value: 'right' },
		],
		defaultDirection: 'up',
	},
	zoom: {
		label: __('Zoom', 'laao'),
		hasDirection: true,
		directions: [
			{ label: __('In', 'laao'), value: 'in' },
			{ label: __('Out', 'laao'), value: 'out' },
		],
		defaultDirection: 'in',
	},
	flip: {
		label: __('Flip', 'laao'),
		hasDirection: true,
		directions: [
			{ label: __('Up', 'laao'), value: 'up' },
			{ label: __('Down', 'laao'), value: 'down' },
			{ label: __('Left', 'laao'), value: 'left' },
			{ label: __('Right', 'laao'), value: 'right' },
		],
		defaultDirection: 'up',
	},
	rotate: {
		label: __('Rotate', 'laao'),
		hasDirection: true,
		directions: [
			{ label: __('Left', 'laao'), value: 'left' },
			{ label: __('Right', 'laao'), value: 'right' },
		],
		defaultDirection: 'left',
	},
	blur: {
		label: __('Blur', 'laao'),
		hasDirection: false,
	},
};

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes }) {
	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Animation Settings', 'laao')}
					initialOpen={true}
				>
					<SelectControl
						label={__('Animation Type', 'laao')}
						value={attributes.animation}
						options={Object.entries(baseAnimations).map(
							([value, config]) => ({
								value,
								label: config.label,
							})
						)}
						onChange={(animation) => {
							const newDirection = baseAnimations[animation]
								.hasDirection
								? baseAnimations[animation].defaultDirection
								: '';
							setAttributes({
								animation,
								direction: newDirection,
							});
						}}
					/>
					{baseAnimations[attributes.animation]?.hasDirection && (
						<SelectControl
							label={__('Direction', 'laao')}
							value={attributes.direction}
							options={
								baseAnimations[attributes.animation].directions
							}
							onChange={(direction) => {
								console.log(direction);
								setAttributes({ direction });
							}}
						/>
					)}
					<ToggleControl
						label={__('Stagger Children', 'laao')}
						checked={attributes.staggerChildren}
						onChange={(staggerChildren) =>
							setAttributes({ staggerChildren })
						}
					/>
					{attributes.staggerChildren && (
						<RangeControl
							label={__('Stagger Delay (seconds)', 'laao')}
							value={attributes.staggerDelay}
							onChange={(staggerDelay) =>
								setAttributes({ staggerDelay })
							}
							min={0.1}
							max={1}
							step={0.1}
						/>
					)}
					<RangeControl
						label={__('Duration (seconds)', 'laao')}
						value={attributes.duration}
						onChange={(duration) => setAttributes({ duration })}
						min={0.1}
						max={2}
						step={0.1}
					/>

					<label
						htmlFor="detection-boundary"
						className="components-base-control__label"
						style={{
							display: 'block',
							marginBottom: '8px',
							fontWeight: '500',
							textTransform: 'uppercase',
							fontSize: '11px',
						}}
					>
						{__('Detection Boundary', 'laao')}
					</label>
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: '16px',
						}}
					>
						{['top', 'right', 'bottom', 'left'].map((direction) => (
							<div
								key={direction}
								style={{ flex: '0 0 calc(50% - 8px)' }}
							>
								<UnitControl
									id={`boundary-${direction}`}
									label={
										direction.charAt(0).toUpperCase() +
										direction.slice(1)
									}
									value={
										attributes.detectionBoundary[direction]
									}
									onChange={(value) =>
										setAttributes({
											detectionBoundary: {
												...attributes.detectionBoundary,
												[direction]: value,
											},
										})
									}
									units={[
										{
											value: '%',
											label: '%',
											default: '0%',
										},
										{
											value: 'px',
											label: 'px',
											default: '0%',
										},
									]}
									__next40pxDefaultSize={true}
								/>
							</div>
						))}
					</div>
					<p
						className="components-base-control__help"
						style={{
							marginTop: 'calc(8px)',
							fontSize: '12px',
							fontStyle: 'normal',
							color: 'rgb(117,117,117)',
							marginBottom: 'revert',
						}}
					>
						{__(
							`Negative values delay trigger until element is further
						in viewport. -50% means element must be halfway into
						viewport before triggering.`,
							'laao'
						)}
					</p>

					<SelectControl
						label={__('Visibility Trigger', 'laao')}
						value={attributes.threshold}
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
						onChange={(threshold) => setAttributes({ threshold })}
						help={__(
							"What percentage of the target's visibility should be in the Detection Boundary before the animation triggers. 0% means even if the target is not visible, the animation will trigger. 100% means the animation will trigger when the target is 100% in the Detection Boundary.",
							'laao'
						)}
					/>
					<ToggleControl
						label={__('Debug Mode', 'laao')}
						checked={attributes.debugMode}
						onChange={(debugMode) => setAttributes({ debugMode })}
						help={__(
							'Shows visual indicators for the Detection Boundary & Visibility Trigger',
							'laao'
						)}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<InnerBlocks />
			</div>
		</>
	);
}
