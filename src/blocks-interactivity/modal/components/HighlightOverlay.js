import { createPortal } from '@wordpress/element';

/**
 * Renders a highlight overlay for selected elements.
 *
 * @param {Object} props - Component properties.
 * @param {boolean} props.isSelected - Whether the element is currently selected.
 * @param {Object} props.highlightRect - DOMRect object containing positioning information.
 * @param {number} props.highlightRect.top - Top position of the highlight.
 * @param {number} props.highlightRect.left - Left position of the highlight.
 * @param {number} props.highlightRect.width - Width of the highlight.
 * @param {number} props.highlightRect.height - Height of the highlight.
 * @return {JSX.Element|null} The highlight overlay element or null if not selected.
 */
export const HighlightOverlay = ({ isSelected, highlightRect }) => {
	if (!isSelected || !highlightRect) return null;

	return createPortal(
		<div
			className="modal-trigger-overlay"
			style={{
				top: `${highlightRect.top}px`,
				left: `${highlightRect.left}px`,
				width: `${highlightRect.width}px`,
				height: `${highlightRect.height}px`,
			}}
		/>,
		document.querySelector('.edit-site-visual-editor__editor-canvas')
			?.contentDocument?.body || document.body
	);
};
