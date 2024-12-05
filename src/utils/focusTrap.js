export const trapFocus = (element, isActive) => {
	const focusableElements =
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
	const firstFocusableElement =
		element.querySelectorAll(focusableElements)[0];
	const focusableContent = element.querySelectorAll(focusableElements);
	const lastFocusableElement = focusableContent[focusableContent.length - 1];

	// Store the previously focused element
	if (isActive) {
		element._previouslyFocusedElement = element.ownerDocument.activeElement;
	}

	const handleKeyDown = (e) => {
		const isTabPressed = e.key === 'Tab';
		if (!isTabPressed) {
			return;
		}

		const activeElement = element.ownerDocument.activeElement;

		if (e.shiftKey) {
			if (activeElement === firstFocusableElement) {
				e.preventDefault();
				lastFocusableElement.focus();
			}
		} else if (activeElement === lastFocusableElement) {
			e.preventDefault();
			firstFocusableElement.focus();
		}
	};

	// Clean up any existing listener
	element.removeEventListener('keydown', element._trapFocusHandler);

	if (isActive) {
		element._trapFocusHandler = handleKeyDown;
		element.addEventListener('keydown', handleKeyDown);
		firstFocusableElement?.focus();
	} else {
		// Restore focus to the previously focused element
		element._previouslyFocusedElement?.focus();
	}
};
