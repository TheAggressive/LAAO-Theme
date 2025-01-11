/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

const { state } = store('laao/modal', {
	state: {
		isOpen: false,
		activeModal: null,
	},
	actions: {
		toggle: ({ context }) => {
			const modalId = context.ref.dataset.modalTarget;
			if (state.activeModal === modalId) {
				state.isOpen = false;
				state.activeModal = null;
			} else {
				state.activeModal = modalId;
				state.isOpen = true;
			}

			document.body.style.overflow = state.isOpen ? 'hidden' : '';
		},
		close: () => {
			state.isOpen = false;
			document.body.style.overflow = '';
			state.activeModal = null;
		},
		handleEscape: ({ event }) => {
			if (event.key === 'Escape') {
				state.isOpen = false;
				document.body.style.overflow = '';
				state.activeModal = null;
			}
		},
	},
	callbacks: {
		isModalOpen: () => {
			const ctx = getContext();
			return state.isOpen && state.activeModal === ctx.ref.id;
		},
	},
});
