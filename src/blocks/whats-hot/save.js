/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * Save function for the What's Hot block.
 *
 * This only saves the InnerBlocks content, while the server
 * renders the dynamic content of the block.
 *
 * @return {WPElement} Element to render.
 */
export default function save() {
	const blockProps = useBlockProps.save({
		className: 'whats-hot-section',
	});

	return (
		<div {...blockProps}>
			<div className="whats-hot-inner-blocks">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
