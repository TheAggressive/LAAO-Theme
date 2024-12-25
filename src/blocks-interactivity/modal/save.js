/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @return {Element} Element to render.
 */
export default function Save() {
	const blockProps = useBlockProps();

	return (
		<div {...blockProps}>
			<InnerBlocks.Content />
		</div>
	);
}
