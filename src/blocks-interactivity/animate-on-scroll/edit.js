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
} from '@wordpress/components';

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
				<PanelBody title="Animation Settings">
					<SelectControl
						label="Animation Type"
						value={attributes.animation}
						options={[
							{ label: 'Fade', value: 'fade' },
							{ label: 'Slide', value: 'slide' },
							{ label: 'Zoom', value: 'zoom' },
							{ label: 'Flip', value: 'flip' },
							{ label: 'Rotate', value: 'rotate' },
							{ label: 'Blur', value: 'blur' },
						]}
						onChange={(animation) => setAttributes({ animation })}
					/>

					{(attributes.animation === 'slide' ||
						attributes.animation === 'flip' ||
						attributes.animation === 'rotate') && (
						<SelectControl
							label="Direction"
							value={attributes.direction}
							options={[
								{ label: 'Up', value: 'up' },
								{ label: 'Down', value: 'down' },
								{ label: 'Left', value: 'left' },
								{ label: 'Right', value: 'right' },
							]}
							onChange={(direction) =>
								setAttributes({ direction })
							}
						/>
					)}

					{attributes.animation === 'zoom' && (
						<SelectControl
							label="Direction"
							value={attributes.direction}
							options={[
								{ label: 'In', value: 'in' },
								{ label: 'Out', value: 'out' },
							]}
							onChange={(direction) =>
								setAttributes({ direction })
							}
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

					<SelectControl
						label="Visibility Requirement"
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

					<SelectControl
						label="Trigger Distance"
						value={attributes.rootMargin}
						options={[
							{
								label: 'Very deep in viewport (-75%)',
								value: '0% 0% -75% 0%',
							},
							{
								label: 'Deep in viewport (-60%)',
								value: '0% 0% -60% 0%',
							},
							{
								label: 'Half viewport (-50%)',
								value: '0% 0% -50% 0%',
							},
							{
								label: 'Near half (-40%)',
								value: '0% 0% -40% 0%',
							},
							{
								label: 'Quarter in (-25%) Default',
								value: '0% 0% -25% 0%',
							},
							{
								label: 'Slightly in (-15%)',
								value: '0% 0% -15% 0%',
							},
							{
								label: 'Just inside (-10%)',
								value: '0% 0% -10% 0%',
							},
							{
								label: 'At viewport edge (0%)',
								value: '0% 0% 0% 0%',
							},
						]}
						onChange={(rootMargin) => setAttributes({ rootMargin })}
						help="Negative values delay trigger until element is further in viewport. -50% means element must be halfway into viewport before triggering."
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
