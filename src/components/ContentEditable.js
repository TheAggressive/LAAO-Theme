import DOMPurify from 'isomorphic-dompurify';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const ContentEditable = ({ initialContent, onChange }) => {
	const [content, setContent] = useState(() => DOMPurify.sanitize(initialContent, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'], FORBID_ATTR: ['style'] }));
	const ref = useRef(null);

	// Debounced input handler to improve performance
	const debouncedHandleInput = useCallback(
		debounce((e) => {
			const sanitizedContent = DOMPurify.sanitize(e.target.innerHTML, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'], FORBID_ATTR: ['style'] });
			console.log('Sanitized content:', sanitizedContent);
			setContent(sanitizedContent);
			if (onChange) {
				onChange(sanitizedContent);
			}
		}, 300),
		[]
	);

	useEffect(() => {
		if (ref.current && ref.current.innerHTML !== content) {
			ref.current.innerHTML = content;
		}
		// Clean up the debounce function on unmount
		return () => {
			debouncedHandleInput.cancel();
		};
	}, [content, debouncedHandleInput]);

	const handleInput = (e) => {
		e.persist(); // Persist the event to use in debounce
		debouncedHandleInput(e);
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
		const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'], FORBID_ATTR: ['style'] });
		const selection = window.getSelection();
		if (!selection.rangeCount) return;

		const range = selection.getRangeAt(0);
		range.deleteContents();

		const tempDiv = document.createElement("div");
		tempDiv.innerHTML = sanitizedText;
		const fragment = document.createDocumentFragment();
		let node;
		let lastNode;
		while ((node = tempDiv.firstChild)) {
			lastNode = fragment.appendChild(node);
		}

		range.insertNode(fragment);

		if (lastNode) {
			const newRange = document.createRange();
			newRange.setStartAfter(lastNode);
			newRange.collapse(true);
			selection.removeAllRanges();
			selection.addRange(newRange);
		}

		setContent(ref.current.innerHTML);
		if (onChange) {
			onChange(ref.current.innerHTML);
		}
	};

	return (
		<div
			ref={ref}
			contentEditable
			onInput={handleInput}
			onPaste={handlePaste}
			style={{ border: '1px solid #949494', padding: '0.5rem', minHeight: '100px', width: '100%' }}
		/>
	);
};

export default ContentEditable;
