import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save({ attributes }) {
	const { triggerBlockId, modalTitle } = attributes;
	const blockProps = useBlockProps.save();

	return (
		<div {...blockProps}>
			<div
				className="modal-container"
				data-wp-interactive="laao/modal"
				data-wp-on--keydown="actions.handleEscape"
			>
				<div className="modal-content" aria-modal="true" role="dialog">
					<div className="modal-header">
						<h3>{modalTitle}</h3>
						<button
							type="button"
							className="modal-close"
							data-wp-on--click="actions.close"
						>
							×
						</button>
					</div>
					<div className="modal-body">
						<InnerBlocks.Content />
					</div>
				</div>
			</div>
		</div>
	);
}
