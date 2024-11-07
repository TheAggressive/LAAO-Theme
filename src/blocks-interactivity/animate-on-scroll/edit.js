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
							{
								label: 'Fade Direction',
								value: 'fade-direction',
							},
							{ label: 'Slide', value: 'slide' },
							{ label: 'Scale', value: 'scale' },
							{ label: 'Flip', value: 'flip' },
							{ label: 'Rotate', value: 'rotate' },
							{ label: 'Zoom', value: 'zoom' },
							{ label: 'Blur', value: 'blur' },
						]}
						onChange={(animation) => setAttributes({ animation })}
					/>

					{(attributes.animation === 'fade-direction' ||
						attributes.animation === 'slide' ||
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
						label="Trigger Point"
						value={attributes.rootMargin}
						options={[
							{ label: 'Latest', value: '-60%' },
							{ label: 'Later', value: '-50%' },
							{ label: 'Late', value: '-40%' },
							{ label: 'Default', value: '-30%' },
							{ label: 'Soon', value: '-20%' },
							{ label: 'Sooner', value: '-10%' },
							{ label: 'Soonest', value: '0%' },
						]}
						onChange={(rootMargin) => setAttributes({ rootMargin })}
						help="When should the animation trigger relative to the viewport"
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<InnerBlocks />
			</div>
		</>
	);
}
