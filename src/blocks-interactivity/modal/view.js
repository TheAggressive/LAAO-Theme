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
	state: {
		modals: {},
	},
	actions: {
		init: () => {
			const ctx = getContext();

			if (state.modals[ctx.id].openOnLoad) {
				actions.openModal();
			}
		},
		openModal: (event) => {
			const ctx = getContext();
			if (!ctx || !ctx.id) {
				return;
			}

			if (!state.modals[ctx.id]) {
				return;
			}

			if (event) {
				event.preventDefault();
			}

			const modalContainer = document.querySelector(
				`.wp-block-laao-${ctx.id}-content`
			);

			if (!modalContainer) {
				return;
			}

			state.modals[ctx.id].isActive = true;

			setTimeout(() => {
				trapFocus(modalContainer, true);
			}, 10);
		},
		closeModal: () => {
			const ctx = getContext();
			if (!ctx || !ctx.id) {
				return;
			}

			if (!state.modals[ctx.id]) {
				state.modals[ctx.id] = { isActive: false };
				return;
			}

			state.modals[ctx.id].isClosing = true;

			setTimeout(() => {
				state.modals[ctx.id].isActive = false;
				state.modals[ctx.id].isClosing = false;
			}, state.modals[ctx.id].animationDuration);
		},
	},
	callbacks: {
		handleKeydown(event) {
			const ctx = getContext();
			if (!ctx || !ctx.id) {
				return;
			}

			if (!state.modals[ctx.id]) {
				state.modals[ctx.id] = { isActive: false };
				return;
			}

			if (state.modals[ctx.id].isActive && event.key === 'Escape') {
				actions.closeModal();
			}
		},
	},
});
