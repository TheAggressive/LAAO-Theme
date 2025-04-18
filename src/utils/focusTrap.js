export const trapFocus = (element, isActive) => {
	const focusableSelector =
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

	if (!isActive) {
		// Remove event listeners when inactive
		return;
	}

	const focusableElements = element.querySelectorAll(focusableSelector);
	const firstFocusableElement = focusableElements[0];
	const lastFocusableElement =
		focusableElements[focusableElements.length - 1];

	// Store the previously focused element
	element._previouslyFocusedElement = element.ownerDocument.activeElement;

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

	element._trapFocusHandler = handleKeyDown;
	element.addEventListener('keydown', handleKeyDown);

	// Set initial focus on first focusable element
	if (focusableElements.length > 0) {
		firstFocusableElement.focus();
	} else {
		// If no focusable elements, focus the container itself
		element.setAttribute('tabindex', '-1');
		element.focus();
	}
};
