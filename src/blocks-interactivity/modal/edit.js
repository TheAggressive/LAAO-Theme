import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
	const { triggerText } = attributes;
	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelBody title="Modal Settings">
					<TextControl
						label="Trigger Button Text"
						value={triggerText}
						onChange={(value) =>
							setAttributes({ triggerText: value })
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<button type="button" className="modal-trigger">
					{triggerText}
				</button>
				<div className="modal-container">
					<div className="modal-content">
						<button type="button" className="modal-close">
							×
						</button>
						<div className="modal-inner">
							<InnerBlocks />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
