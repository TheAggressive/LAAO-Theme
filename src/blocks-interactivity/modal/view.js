/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { focusTrap } from './helpers';

/**
 * Force open a modal by directly manipulating DOM
 * @param modalId
 */
const forceOpenModal = (modalId) => {
	try {
		console.log('🛠️ Force opening modal:', modalId);

		// Get modal elements
		const modalContainer = document.getElementById(modalId);
		if (!modalContainer) {
			console.error('❌ Modal container not found:', modalId);
			return;
		}

		const modalOverlay =
			document.querySelector(
				`.wp-block-laao-modal-overlay[data-context*="${modalId}"]`
			) || document.querySelector('.wp-block-laao-modal-overlay');

		console.log('�� Modal container:', modalContainer);
		console.log('🔍 Modal overlay:', modalOverlay);

		// Add is-open class to container
		modalContainer.classList.add('is-open');

		// Explicitly set styles to ensure visibility
		modalContainer.style.display = 'flex';

		// Add is-open class to overlay if it exists
		if (modalOverlay) {
			modalOverlay.classList.add('is-open');
			modalOverlay.style.display = 'block';
		}

		// Disable body scrolling
		document.body.style.overflow = 'hidden';

		console.log('✅ Modal forced open');
		return true;
	} catch (e) {
		console.error('❌ Error forcing modal open:', e);
		return false;
	}
};

/**
 * Debug helper function
 */
const debugModalSystem = () => {
	try {
		// Check modals in DOM
		const modalsInDOM = document.querySelectorAll('.wp-block-laao-modal');
		console.log('Modals in DOM:', modalsInDOM.length);
		modalsInDOM.forEach((modal) => {
			console.log(
				'- Modal ID:',
				modal.id,
				'Data attributes:',
				Object.entries(modal.dataset)
					.map(([k, v]) => `${k}=${v}`)
					.join(', ')
			);
		});

		// Check modal containers
		const modalContainers = document.querySelectorAll(
			'.wp-block-laao-modal-container'
		);
		console.log('Modal containers:', modalContainers.length);

		// Check triggers
		const triggers = document.querySelectorAll('[class*="modal-trigger-"]');
		console.log('Trigger elements:', triggers.length);
		triggers.forEach((trigger) => {
			console.log('- Trigger classes:', trigger.className);
		});

		// Check interactivity state
		const state = getContext('laao/modal');
		console.log('Current interactivity state:', state);
	} catch (e) {
		console.error('Error in debugModalSystem:', e);
	}
};

/**
 * Store registration
 */
store('laao/modal', {
	state: {
		modals: {},
	},
	actions: {
		/**
		 * Closes a modal
		 *
		 * @param {Object} storeApiOrContext - The WordPress Interactivity store or context object
		 * @param {string} [idParam]         - The modal ID (only when called programmatically)
		 */
		closeModal: (storeApiOrContext, idParam) => {
			let storeApi, id;

			// Check how the function is being called
			if (idParam !== undefined) {
				// Called programmatically with (storeApi, id)
				storeApi = storeApiOrContext;
				id = idParam;
			} else {
				// Called directly from interactivity API with a single context object
				const context = storeApiOrContext || {};

				// Check if context is a DOM event (from direct click handler)
				if (context instanceof Event) {
					// For DOM events, we'll need to find the open modal
					// We don't log a warning here since this is a valid use case
				} else {
					// Try to get the ID from context.ref.id or context.id
					id = context.ref?.id || context.id;

					// For debugging, log the context object
					if (!id) {
						console.warn(
							'closeModal: Cannot extract ID from context:',
							context
						);
					}
				}

				// Get the store from the interactivity API
				try {
					if (window.wp?.interactivity?.store) {
						storeApi = window.wp.interactivity.store('laao/modal');
					}
				} catch (error) {
					console.warn(
						'Unable to get store from interactivity API:',
						error
					);
				}
			}

			// Safety check for required parameters
			if (!id) {
				// Try to find any open modal if ID is missing
				try {
					const openModal = document.querySelector(
						'.wp-block-laao-modal-container.is-open'
					);
					if (openModal) {
						id = openModal.id;
						console.log(
							'closeModal: Found open modal with ID:',
							id
						);
					} else {
						console.warn(
							'closeModal: No modal ID provided and no open modal found'
						);
						return;
					}
				} catch (error) {
					console.warn(
						'closeModal: Failed to find open modal:',
						error
					);
					return;
				}
			}

			// From here on, we have a valid ID to close

			// If we have a valid store API, try to use it
			if (storeApi && storeApi.state) {
				// Initialize modals object if it doesn't exist
				if (!storeApi.state.modals) {
					storeApi.state.modals = {};
				}

				// Make sure the specific modal exists in the state
				if (storeApi.state.modals[id]) {
					storeApi.state.modals[id].isOpen = false;
				}
			}

			// Always perform direct DOM manipulation to ensure the modal closes
			// regardless of the state of the interactivity API
			try {
				const modalElement = document.getElementById(id);
				const modalOverlay = document.querySelector(
					'.wp-block-laao-modal-overlay'
				);

				if (modalElement) {
					modalElement.style.display = 'none';
					modalElement.classList.remove('is-open');
				}

				if (modalOverlay) {
					modalOverlay.style.display = 'none';
					modalOverlay.classList.remove('is-open');
				}

				// Re-enable scrolling
				document.body.style.overflow = '';
			} catch (error) {
				console.error('Error in closeModal DOM operation:', error);
			}
		},

		/**
		 * Opens a modal
		 *
		 * @param {Object} storeApi - The WordPress Interactivity store
		 * @param {string} id       - The modal ID
		 */
		openModal: (storeApi, id) => {
			console.log('openModal called with ID:', id);
			const { state } = storeApi;

			// Initialize if not exists
			if (!state.modals) {
				state.modals = {};
			}

			if (!state.modals[id]) {
				state.modals[id] = { isOpen: false };
			}

			// Open the modal
			state.modals[id].isOpen = true;
			console.log(
				'Modal state after opening:',
				JSON.stringify(state.modals[id])
			);

			// Disable scrolling on the body
			document.body.style.overflow = 'hidden';

			// Check if modal actually opened after a short delay
			setTimeout(() => {
				const modalContainer = document.getElementById(id);
				if (
					modalContainer &&
					!modalContainer.classList.contains('is-open')
				) {
					console.warn(
						'⚠️ Modal did not open through state. Trying force open...'
					);
					forceOpenModal(id);
				}
			}, 200);
		},

		/**
		 * Toggles a modal open/closed
		 *
		 * @param {Object} storeApiOrContext - The WordPress Interactivity store or context object
		 * @param {Object} [contextOrNone]   - The context object (if called programmatically)
		 */
		toggleModal: (storeApiOrContext, contextOrNone) => {
			console.log(
				'🔄 toggleModal called with:',
				storeApiOrContext,
				contextOrNone
			);

			let storeApi, context, id;

			// Handle different calling patterns
			if (contextOrNone === undefined) {
				// Called directly from interactivity API with a single context object
				context = storeApiOrContext || {};

				// Try to get store from interactivity API
				try {
					if (window.wp?.interactivity?.store) {
						storeApi = window.wp.interactivity.store('laao/modal');
					}
				} catch (error) {
					console.warn(
						'Unable to get store from interactivity API:',
						error
					);
				}
			} else {
				// Called programmatically with (storeApi, context)
				storeApi = storeApiOrContext;
				context = contextOrNone || {};
			}

			console.log('🔍 Context after normalization:', context);

			// Try to get ID from context in multiple ways
			id = context?.ref?.id || context?.id;

			// If we still don't have an ID but have an element reference, try to get ID from element
			if (!id && context?.element) {
				console.log('🔍 Looking for ID in element:', context.element);

				// Try to get ID from data-context attribute
				const contextAttr =
					context.element.getAttribute('data-wp-context');
				if (contextAttr) {
					try {
						const contextObj = JSON.parse(contextAttr);
						if (contextObj?.id) {
							id = contextObj.id;
							console.log('✅ Found ID in data-wp-context:', id);
						}
					} catch (e) {
						console.warn('Failed to parse context attribute:', e);
					}
				}

				// Look for data-modal-id attribute on element or parents
				if (!id) {
					const modalParent =
						context.element.closest('[data-modal-id]');
					if (modalParent) {
						id = modalParent.getAttribute('data-modal-id');
						console.log('✅ Found ID in parent data-modal-id:', id);
					}
				}

				// Look for aria-controls attribute
				if (!id) {
					const ariaControls =
						context.element.getAttribute('aria-controls');
					if (ariaControls) {
						id = ariaControls;
						console.log('✅ Found ID in aria-controls:', id);
					}
				}
			}

			// If we have a DOM event, check if it's on a modal trigger
			if (!id && context instanceof Event) {
				console.log(
					'🔍 Context is a DOM event, looking for trigger in target:',
					context.target
				);

				const triggerElement = context.target.closest(
					'[class*="modal-trigger-"]'
				);
				if (triggerElement) {
					// Get trigger classes
					const triggerClasses = triggerElement.className.split(' ');

					// Find modal ID from class
					const modalTriggerClass = triggerClasses.find((className) =>
						className.startsWith('modal-trigger-')
					);

					if (modalTriggerClass) {
						id = modalTriggerClass.replace('modal-trigger-', '');
						console.log('✅ Found ID in trigger class:', id);
					}
				}

				// Check if clicked element has aria-controls
				if (!id) {
					const clickedElement =
						context.target.closest('[aria-controls]');
					if (clickedElement) {
						id = clickedElement.getAttribute('aria-controls');
						console.log('✅ Found ID in aria-controls:', id);
					}
				}
			}

			// As a last resort, look for a visible modal-trigger button on the page
			if (!id) {
				console.log(
					'⚠️ Still no ID found, looking for default trigger button'
				);
				const defaultTrigger = document.querySelector(
					'.wp-block-laao-modal-trigger'
				);
				if (defaultTrigger) {
					// Try to get ID from context
					const contextAttr =
						defaultTrigger.getAttribute('data-wp-context');
					if (contextAttr) {
						try {
							const contextObj = JSON.parse(contextAttr);
							if (contextObj?.id) {
								id = contextObj.id;
								console.log(
									'✅ Found ID in default trigger data-context:',
									id
								);
							}
						} catch (e) {
							console.warn(
								'Failed to parse default trigger context:',
								e
							);
						}
					}

					// Try aria-controls
					if (!id && defaultTrigger.hasAttribute('aria-controls')) {
						id = defaultTrigger.getAttribute('aria-controls');
						console.log(
							'✅ Found ID in default trigger aria-controls:',
							id
						);
					}
				}
			}

			// Final check for ID - if still none, look for ANY modal on the page
			if (!id) {
				console.log(
					'⚠️ Last resort: looking for any modal on the page'
				);
				const anyModal = document.querySelector('.wp-block-laao-modal');
				if (anyModal && anyModal.id) {
					id = anyModal.id;
					console.log('✅ Found ID from any modal on page:', id);
				} else {
					console.error(
						'❌ Could not find any modal ID using any method'
					);
					return; // Cannot proceed without an ID
				}
			}

			console.log('🎯 Final modal ID for toggle:', id);

			// Now we have a valid ID, proceed with toggle logic
			try {
				// APPROACH 1: Try using the store API if available
				if (storeApi && storeApi.state) {
					console.log('🔄 Using store API approach');

					// Initialize if not exists
					if (!storeApi.state.modals) {
						storeApi.state.modals = {};
					}

					if (!storeApi.state.modals[id]) {
						storeApi.state.modals[id] = { isOpen: false };
					}

					// Toggle modal state
					const isCurrentlyOpen = storeApi.state.modals[id].isOpen;
					storeApi.state.modals[id].isOpen = !isCurrentlyOpen;
					console.log(
						'🔄 Modal state toggled through store. Now:',
						!isCurrentlyOpen
					);

					// Update body overflow based on new state
					if (!isCurrentlyOpen) {
						// If opening, disable scrolling
						document.body.style.overflow = 'hidden';
					} else {
						// If closing, re-enable scrolling
						document.body.style.overflow = '';
					}
				} else {
					// APPROACH 2: Fall back to direct DOM manipulation
					console.log(
						'⚠️ Store API not available, using DOM manipulation'
					);

					// Get the modal and overlay elements
					const modalElement = document.getElementById(id);
					const modalOverlay = document.querySelector(
						'.wp-block-laao-modal-overlay'
					);

					if (!modalElement) {
						console.error('❌ Modal element not found:', id);
						return;
					}

					// Check if it's currently visible
					const isCurrentlyVisible =
						window.getComputedStyle(modalElement).display !==
							'none' ||
						modalElement.classList.contains('is-open');

					console.log(
						'🔍 Modal visibility status:',
						isCurrentlyVisible
					);

					if (isCurrentlyVisible) {
						// Close the modal
						console.log('🔄 Closing modal via DOM');
						modalElement.style.display = 'none';
						modalElement.classList.remove('is-open');

						if (modalOverlay) {
							modalOverlay.style.display = 'none';
							modalOverlay.classList.remove('is-open');
						}

						// Re-enable scrolling
						document.body.style.overflow = '';
					} else {
						// Open the modal
						console.log('🔄 Opening modal via DOM');
						modalElement.style.display = 'flex';
						modalElement.classList.add('is-open');

						if (modalOverlay) {
							modalOverlay.style.display = 'block';
							modalOverlay.classList.add('is-open');
						}

						// Disable scrolling
						document.body.style.overflow = 'hidden';
					}
				}

				// APPROACH 3: After both attempts, verify the result and force if needed
				setTimeout(() => {
					const modalElement = document.getElementById(id);
					if (!modalElement) {
						return;
					}

					// Check whether we wanted to open or close
					const shouldBeOpen =
						!modalElement.classList.contains('is-open');

					if (shouldBeOpen) {
						// Forcibly open
						console.log('🛠️ Force opening modal as final fallback');
						modalElement.style.display = 'flex';
						modalElement.classList.add('is-open');

						const modalOverlay = document.querySelector(
							'.wp-block-laao-modal-overlay'
						);
						if (modalOverlay) {
							modalOverlay.style.display = 'block';
							modalOverlay.classList.add('is-open');
						}

						document.body.style.overflow = 'hidden';
					}
				}, 100);
			} catch (error) {
				console.error('❌ Error in toggleModal:', error);

				// Ultimate fallback - direct DOM manipulation without any checks
				try {
					console.log(
						'🆘 Ultimate fallback: direct DOM manipulation'
					);
					const modalElement = document.getElementById(id);
					if (modalElement) {
						const isVisible =
							modalElement.classList.contains('is-open');

						if (isVisible) {
							modalElement.style.display = 'none';
							modalElement.classList.remove('is-open');
							document.body.style.overflow = '';
						} else {
							modalElement.style.display = 'flex';
							modalElement.classList.add('is-open');
							document.body.style.overflow = 'hidden';
						}

						// Handle overlay
						const overlay = document.querySelector(
							'.wp-block-laao-modal-overlay'
						);
						if (overlay) {
							if (isVisible) {
								overlay.style.display = 'none';
								overlay.classList.remove('is-open');
							} else {
								overlay.style.display = 'block';
								overlay.classList.add('is-open');
							}
						}
					}
				} catch (ultimateError) {
					console.error(
						'💥 Ultimate fallback failed:',
						ultimateError
					);
				}
			}

			console.log('🏁 toggleModal completed for ID:', id);
		},

		/**
		 * Handle keydown events for modals
		 *
		 * @param {Object} storeApi - The WordPress Interactivity store
		 * @param {Object} context  - The event context object
		 */
		handleKeydown: (storeApi, context) => {
			// Safety checks
			if (!context) {
				return;
			}

			const { event, id } = context;

			// Check that we have an event and id
			if (!event || !id) {
				return;
			}

			// Close on escape key
			if (event.key === 'Escape') {
				// Make sure we have the store API
				if (!storeApi) {
					// Try to get the store from global
					try {
						if (window.wp?.interactivity?.store) {
							storeApi =
								window.wp.interactivity.store('laao/modal');
						}
					} catch (error) {
						// Silently continue
					}
				}

				if (storeApi && storeApi.actions) {
					// Call the closeModal action with the id
					storeApi.actions.closeModal(context);
				} else {
					// Fall back to direct DOM manipulation
					try {
						const modalElement = document.getElementById(id);
						const modalOverlay = document.querySelector(
							'.wp-block-laao-modal-overlay'
						);

						if (modalElement) {
							modalElement.style.display = 'none';
							modalElement.classList.remove('is-open');
						}

						if (modalOverlay) {
							modalOverlay.style.display = 'none';
							modalOverlay.classList.remove('is-open');
						}

						// Re-enable scrolling
						document.body.style.overflow = '';
					} catch (error) {
						console.error(
							'Error in handleKeydown DOM fallback:',
							error
						);
					}
				}

				event.preventDefault();
			}
		},

		/**
		 * Initialize modal state
		 *
		 * @param {Object}  storeApi                 - The WordPress Interactivity store
		 * @param {Object}  context                  - The context object
		 * @param {string}  context.id               - The modal ID
		 * @param {boolean} context.shouldOpenOnLoad - Whether the modal should open on load
		 */
		initModal: (storeApi, { id, shouldOpenOnLoad = false }) => {
			const { state } = storeApi;

			// Initialize modals object if not exists
			if (!state.modals) {
				state.modals = {};
			}

			// Initialize this modal's state if not exists
			if (!state.modals[id]) {
				state.modals[id] = {
					isOpen: shouldOpenOnLoad,
				};

				// If should open on load, disable body scrolling
				if (shouldOpenOnLoad) {
					document.body.style.overflow = 'hidden';
				}
			}
		},
	},
	callbacks: {
		/**
		 * Trap focus inside the modal when open
		 *
		 * @param {Object} context - The context object
		 */
		focusTrapModal: (context = {}) => {
			// If context is undefined or doesn't have element, try to get it from the event
			const element =
				context.element ||
				document.querySelector(`#${context.ref?.id}`);
			const id = context.ref?.id;

			if (!id) {
				return;
			}

			const isOpen = getContext('laao/modal').modals?.[id]?.isOpen;

			// Only trap focus when modal is open
			if (isOpen && element) {
				focusTrap(element);
			}
		},
	},
	effects: {
		/**
		 * Add listeners to modal
		 *
		 * @param {Object} storeApi - The WordPress Interactivity store
		 */
		setupModalListeners: (storeApi) => {
			const state = getContext('laao/modal');

			// Only run once
			if (state.initialized) {
				return;
			}
			state.initialized = true;

			// Initialize all modals on the page
			document.addEventListener('DOMContentLoaded', () => {
				console.log('DOMContentLoaded event fired');

				// Debug the initial state
				console.log('Initial state before setup:');
				debugModalSystem();

				// Listen for custom laao_modal_trigger events
				window.addEventListener('laao_modal_trigger', (event) => {
					console.log(
						'Received custom event laao_modal_trigger',
						event.detail
					);
					const { modalId } = event.detail;
					if (modalId) {
						console.log(
							'Opening modal from custom event with ID:',
							modalId
						);
						const modalStore = storeApi('laao/modal');
						modalStore.actions.openModal(modalId);

						// Add fallback in case the store action doesn't work
						setTimeout(() => {
							const modalContainer =
								document.getElementById(modalId);
							if (
								modalContainer &&
								!modalContainer.classList.contains('is-open')
							) {
								console.warn(
									'⚠️ Modal did not open through event. Trying force open...'
								);
								forceOpenModal(modalId);
							}
						}, 200);
					}
				});

				// Handle external trigger links/buttons with modal-trigger-{id} class
				document.addEventListener('click', (event) => {
					console.log('Click detected on:', event.target);
					// Find closest trigger element
					const triggerElement = event.target.closest(
						'[class*="modal-trigger-"]'
					);

					if (!triggerElement) {
						return;
					}

					console.log('Found trigger element:', triggerElement);
					// Get trigger classes
					const triggerClasses = triggerElement.className.split(' ');
					console.log('Trigger classes:', triggerClasses);

					// Find modal ID from class
					const modalTriggerClass = triggerClasses.find((className) =>
						className.startsWith('modal-trigger-')
					);

					if (!modalTriggerClass) {
						return;
					}

					console.log(
						'Found modal trigger class:',
						modalTriggerClass
					);
					// Extract modal ID
					const modalId = modalTriggerClass.replace(
						'modal-trigger-',
						''
					);

					if (!modalId) {
						return;
					}

					console.log('Extracted modal ID:', modalId);
					// Prevent default for links
					event.preventDefault();

					// Get store and open modal
					const modalStore = storeApi('laao/modal');
					modalStore.actions.openModal(modalId);
				});

				// Reset any modal that might be incorrectly open on page load
				const { state: modalState, actions } = storeApi('laao/modal');

				// Ensure modals are initialized
				if (!modalState.modals) {
					modalState.modals = {};
				}

				// Initialize all modals on the page
				document
					.querySelectorAll('.wp-block-laao-modal')
					.forEach((modalElement) => {
						const modalId = modalElement.id;

						if (!modalId) {
							return;
						}

						// Check if this modal should open on load
						const shouldOpenOnLoad =
							modalElement.hasAttribute('data-open-on-load');

						// Initialize the modal
						actions.initModal({
							id: modalId,
							shouldOpenOnLoad,
						});
					});
			});

			// Global keydown handler
			document.addEventListener('keydown', (event) => {
				// Close open modals on escape key
				if (event.key === 'Escape') {
					const { modals } = getContext('laao/modal');
					if (modals) {
						Object.entries(modals).forEach(([id, modal]) => {
							if (modal.isOpen) {
								try {
									const modalStore = storeApi('laao/modal');
									// Build a proper context object with modal ID
									const context = { ref: { id } };
									// Call closeModal with this context
									modalStore.actions.closeModal(context);
								} catch (error) {
									// If store approach fails, try direct DOM manipulation
									try {
										const modalElement =
											document.getElementById(id);
										if (modalElement) {
											modalElement.style.display = 'none';
											modalElement.classList.remove(
												'is-open'
											);

											// Also close overlay
											const modalOverlay =
												document.querySelector(
													'.wp-block-laao-modal-overlay'
												);
											if (modalOverlay) {
												modalOverlay.style.display =
													'none';
												modalOverlay.classList.remove(
													'is-open'
												);
											}

											// Re-enable scrolling
											document.body.style.overflow = '';
										}
									} catch (fallbackError) {
										console.error(
											'Error in global keydown handler:',
											fallbackError
										);
									}
								}
							}
						});
					} else {
						// If we can't get modals from context, try to find open modal in DOM
						const openModal = document.querySelector(
							'.wp-block-laao-modal-container.is-open'
						);
						if (openModal && openModal.id) {
							try {
								const modalStore = storeApi('laao/modal');
								// Build a proper context object with modal ID
								const context = { ref: { id: openModal.id } };
								// Call closeModal with this context
								modalStore.actions.closeModal(context);
							} catch (error) {
								// Direct DOM manipulation as fallback
								openModal.style.display = 'none';
								openModal.classList.remove('is-open');

								// Also close overlay
								const modalOverlay = document.querySelector(
									'.wp-block-laao-modal-overlay'
								);
								if (modalOverlay) {
									modalOverlay.style.display = 'none';
									modalOverlay.classList.remove('is-open');
								}

								// Re-enable scrolling
								document.body.style.overflow = '';
							}
						}
					}
				}
			});
		},
	},
});
