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

const baseAnimations = {
	fade: {
		label: 'Fade',
		hasDirection: false,
	},
	slide: {
		label: 'Slide',
		hasDirection: true,
		directions: [
			{ label: 'Up', value: 'up' },
			{ label: 'Down', value: 'down' },
			{ label: 'Left', value: 'left' },
			{ label: 'Right', value: 'right' },
		],
		defaultDirection: 'up',
	},
	zoom: {
		label: 'Zoom',
		hasDirection: true,
		directions: [
			{ label: 'In', value: 'in' },
			{ label: 'Out', value: 'out' },
		],
		defaultDirection: 'in',
	},
	flip: {
		label: 'Flip',
		hasDirection: true,
		directions: [
			{ label: 'Up', value: 'up' },
			{ label: 'Down', value: 'down' },
			{ label: 'Left', value: 'left' },
			{ label: 'Right', value: 'right' },
		],
		defaultDirection: 'up',
	},
	rotate: {
		label: 'Rotate',
		hasDirection: true,
		directions: [
			{ label: 'Left', value: 'left' },
			{ label: 'Right', value: 'right' },
		],
		defaultDirection: 'left',
	},
	blur: {
		label: 'Blur',
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
				<PanelBody title="Animation Settings" initialOpen={true}>
					<SelectControl
						label="Animation Type"
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
							label="Direction"
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
						label="Stagger Children"
						checked={attributes.staggerChildren}
						onChange={(staggerChildren) =>
							setAttributes({ staggerChildren })
						}
					/>
					{attributes.staggerChildren && (
						<RangeControl
							label="Stagger Delay (seconds)"
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
						label="Duration (seconds)"
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
						Detection Boundary
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
						Negative values delay trigger until element is further
						in viewport. -50% means element must be halfway into
						viewport before triggering.
					</p>

					<SelectControl
						label="Visibility Trigger"
						value={attributes.threshold}
						options={[
							{ label: 'Entire element (100%)', value: '1' },
							{ label: 'Almost entire (90%)', value: '0.9' },
							{ label: 'Mostly visible (80%)', value: '0.8' },
							{ label: 'Large portion (70%)', value: '0.7' },
							{ label: 'More than half (60%)', value: '0.6' },
							{ label: 'Half element (50%)', value: '0.5' },
							{ label: 'Some visible (40%)', value: '0.4' },
							{
								label: 'Partially visible (30%) Default',
								value: '0.3',
							},
							{ label: 'Small portion (20%)', value: '0.2' },
							{ label: 'Barely visible (10%)', value: '0.1' },
						]}
						onChange={(threshold) => setAttributes({ threshold })}
						help="How much of the element needs to be in view before the animation triggers"
					/>
					<ToggleControl
						label="Debug Mode"
						checked={attributes.debugMode}
						onChange={(debugMode) => setAttributes({ debugMode })}
						help="Shows visual indicators for animation trigger points"
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<InnerBlocks />
			</div>
		</>
	);
}
