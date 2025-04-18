/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

// Reset any modals that might be open incorrectly
document.addEventListener('DOMContentLoaded', function () {
	// Reset any overlay that might be showing
	document
		.querySelectorAll('.wp-block-laao-modal-overlay.is-open')
		.forEach((overlay) => {
			overlay.classList.remove('is-open');
		});

	// Close any modal containers that might be open
	document
		.querySelectorAll('.wp-block-laao-modal-container.is-open')
		.forEach((container) => {
			container.classList.remove('is-open');
		});

	// Make sure body overflow is reset
	document.body.style.overflow = '';
});

// Event handler for external triggers
window.addEventListener('laao_modal_trigger', (e) => {
	const modalId = e.detail.modalId;
	const modalStore = `laao_modal_${modalId}`;
	const { state } = store(modalStore);

	if (state) {
		state.isOpen = true;
	}
});

// Initialize all modal stores dynamically
document
	.querySelectorAll('[data-wp-interactive^="laao_modal_"]')
	.forEach((modalElement) => {
		const storeId = modalElement.dataset.wpInteractive;

		store(storeId, {
			state: {
				isOpen: false,
				triggerId: '',
			},
			actions: {
				toggleModal() {
					const context = getContext();
					if (!context) {
						return;
					}

					context.isOpen = !context.isOpen;

					// When modal opens, trap focus and disable page scrolling
					if (context.isOpen) {
						document.body.style.overflow = 'hidden';

						// Set focus to the modal
						setTimeout(() => {
							const modal = document.getElementById(
								modalElement.querySelector(
									'.wp-block-laao-modal-container'
								)?.id
							);
							if (modal) {
								const focusableElements =
									modal.querySelectorAll(
										'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
									);
								if (focusableElements.length) {
									focusableElements[0].focus();
								}
							}
						}, 50);
					} else {
						// Restore page scrolling when modal closes
						document.body.style.overflow = '';
					}
				},
				closeModal() {
					const context = getContext();
					if (!context) {
						return;
					}

					context.isOpen = false;
					document.body.style.overflow = '';
				},
				handleEscapeKey(event) {
					if (event.key === 'Escape') {
						const context = getContext();
						if (context?.isOpen) {
							context.isOpen = false;
							document.body.style.overflow = '';
						}
					}
				},
			},
			callbacks: {
				initModal: () => {
					try {
						const context = getContext();

						// Safety check: ensure context exists and has the isOpen property
						if (context && typeof context.isOpen !== 'undefined') {
							// Only open automatically if explicitly set to true
							if (context.isOpen === true) {
								document.body.style.overflow = 'hidden';
							} else {
								// Ensure modal is closed by default
								context.isOpen = false;
							}
						}

						// Add event listener for Escape key
						document.addEventListener('keydown', (e) => {
							if (e.key === 'Escape') {
								const updatedContext = getContext();
								if (updatedContext?.isOpen) {
									updatedContext.isOpen = false;
									document.body.style.overflow = '';
								}
							}
						});
					} catch (error) {
						// Silent error handling to prevent console messages
					}
				},
			},
		});
	});

// Initialize trap focus for modals
document.addEventListener('DOMContentLoaded', () => {
	// Handle keyboard navigation (trap focus inside open modal)
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Tab') {
			const openModal = document.querySelector(
				'.wp-block-laao-modal-container.is-open'
			);
			if (openModal) {
				const focusableElements = openModal.querySelectorAll(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);

				if (focusableElements.length) {
					const firstElement = focusableElements[0];
					const lastElement =
						focusableElements[focusableElements.length - 1];

					// Use ownerDocument to get the active element
					const activeElement = openModal.ownerDocument.activeElement;

					// If shift+tab on first element, move to last
					if (e.shiftKey && activeElement === firstElement) {
						e.preventDefault();
						lastElement.focus();
					}
					// If tab on last element, move to first
					else if (!e.shiftKey && activeElement === lastElement) {
						e.preventDefault();
						firstElement.focus();
					}
				}
			}
		}
	});
});
