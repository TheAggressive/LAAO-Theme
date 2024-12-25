/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param            props.clientId
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes, clientId }) {
	const blockProps = useBlockProps();

	return (
		<div {...blockProps}>
			{/* Trigger area */}
			<div className="modal-trigger">
				<InnerBlocks />
			</div>

			{/* Modal container */}
			<div className="modal-container" style={{ display: 'none' }}>
				<div className="modal-overlay"></div>
				<div className="modal-content">
					<button
						className="modal-close"
						aria-label={__('Close modal', 'modal')}
					>
						×
					</button>
					<div className="modal-body">
						<h4>{__('Modal Content', 'modal')}</h4>
						{/* Add your modal content here */}
					</div>
				</div>
			</div>
		</div>
	);
}
