/**
 * Modal Interactivity Module
 *
 * This file contains all the functionality for modal interactions, focus trapping,
 * and keyboard navigation for the LAAO modal component using WordPress Interactivity API.
 *
 * The file is organized into logical sections:
 * 1. Focus Management Utilities
 * 2. Modal Control Functions
 * 3. WordPress Interactivity Store Definition
 */

import { getContext, store } from '@wordpress/interactivity';
import { trapFocus } from '../../utils/focusTrap';

const { state, actions } = store('laao/modal', {
	state: {},
	actions: {
		openModal: () => {
			const ctx = getContext();
			state.modals[ctx.id].isActive = true;

			console.log(state);

			const nav = document.querySelector(
				`.wp-block-laao-modal-${state.id}-content`
			);
			if (nav) {
				trapFocus(nav, state.isOpen);
			}
		},
		closeModal: () => {
			const ctx = getContext();
			state.modals[ctx.id].isActive = false;
		},
	},
	callbacks: {
		handleKeydown(event) {
			const ctx = getContext();
			if (ctx.isActive) {
				if (event.key === 'Escape') {
					actions.closeModal();
				}
			}
		},
	},
});
