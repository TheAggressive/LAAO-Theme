/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */

const { state, actions } = store('laao/modal', {
	state: {
		/**
		 * Currently active modal ID (null when closed)
		 * @type {string|null}
		 */
		activeModal: null,

		/**
		 * Determines if the current modal is open
		 * @return {boolean}
		 */
		get isOpen() {
			const context = getContext();
			console.log('state.activeModal:', state.activeModal);
			console.log('context?.modalId:', context?.modalId);
			console.log('isOpen:', state.activeModal === context?.modalId);
			return state.activeModal === context?.modalId;
		},
	},

	actions: {
		/**
		 * Toggles modal open/close state
		 */
		toggle() {
			const context = getContext();

			if (!context?.modalId) {
				console.warn('Modal toggle: Missing modalId in context');
				return;
			}

			console.log(
				'Context:',
				state.activeModal === context.modalId ? null : context.modalId
			);

			state.activeModal =
				state.activeModal === context.modalId ? null : context.modalId;
		},

		/**
		 * Closes the currently open modal
		 */
		close() {
			state.activeModal = null;
		},

		/**
		 * Handles Escape key press
		 * @param {Object} props       - Action properties
		 * @param {Object} props.event - Keyboard event
		 */
		handleEscape({ event }) {
			if (event.key === 'Escape' && state.activeModal) {
				actions.close();
			}
		},
	},
});
