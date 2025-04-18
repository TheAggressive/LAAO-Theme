/**
 * Helper utilities for the modal component
 */

/**
 * Trap focus within a specified DOM element
 *
 * @param {HTMLElement} element - The element to trap focus within
 */
export const focusTrap = (element) => {
	if (!element) {
		return;
	}

	// Find all focusable elements within the modal
	const focusableElements = element.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);

	if (!focusableElements.length) {
		return;
	}

	const firstElement = focusableElements[0];
	const lastElement = focusableElements[focusableElements.length - 1];

	// Set initial focus to the first focusable element
	setTimeout(() => {
		firstElement.focus();
	}, 50);

	// Handle keyboard navigation to trap focus
	const handleTabKey = (event) => {
		// Only process Tab key events
		if (event.key !== 'Tab') {
			return;
		}

		// Check if modal is still in the DOM and visible
		if (
			!element.isConnected ||
			getComputedStyle(element).display === 'none'
		) {
			document.removeEventListener('keydown', handleTabKey);
			return;
		}

		// If shift+tab on first element, move to last
		if (event.shiftKey && document.activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
		}
		// If tab on last element, move to first
		else if (!event.shiftKey && document.activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
		}
	};

	// Add event listener
	document.addEventListener('keydown', handleTabKey);

	// Return cleanup function
	return () => {
		document.removeEventListener('keydown', handleTabKey);
	};
};
