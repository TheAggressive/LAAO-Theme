import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Modal content component that renders a dialog with a header and body.
 *
 * @param {Object} props           Component properties.
 * @param {string} props.modalTitle The title to display in the modal header.
 * @return {JSX.Element}          The modal content component.
 */
export const ModalContent = ({ modalTitle }) => (
	<div className="modal-content" aria-modal="true" role="dialog">
		<div className="modal-header">
			<h3>{modalTitle}</h3>
			<button type="button" className="modal-close">
				×
			</button>
		</div>
		<div className="modal-body">
			<InnerBlocks />
		</div>
	</div>
);
