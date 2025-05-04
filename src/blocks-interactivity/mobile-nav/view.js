/**
 * WordPress dependencies
 */
import { store, useEffect, useState } from '@wordpress/interactivity';
import { trapFocus } from '../../utils/focusTrap';

const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		// Create media query list
		const mediaQuery = window.matchMedia('(max-width: 1535px)');

		// Handler function
		const handleMediaQueryChange = (e) => setIsMobile(e.matches);

		// Set initial value
		setIsMobile(mediaQuery.matches);

		// Add listener
		mediaQuery.addEventListener('change', handleMediaQueryChange);

		// Cleanup
		return () =>
			mediaQuery.removeEventListener('change', handleMediaQueryChange);
	}, []);

	return isMobile;
};

const { state, actions } = store('laao/mobile-nav', {
	state: {
		isActive: false,
		closeTimeout: null,
	},
	actions: {
		toggleMenu() {
			state.isActive = !state.isActive;
			actions.updateMenuClasses();

			const nav = document.querySelector('.site-nav');
			if (nav) {
				trapFocus(nav, state.isActive);
			}
		},
		updateMenuClasses() {
			if (state.isActive) {
				// Add overlay
				if (!document.querySelector('.laao-mobile-nav-overlay')) {
					const overlay = document.createElement('div');
					overlay.className = 'laao-mobile-nav-overlay';
					overlay.addEventListener('click', actions.toggleMenu);
					document.body.appendChild(overlay);

					// Force a reflow before adding the open class
					overlay.getBoundingClientRect();
				}

				document.body.classList.add('laao-mobile-nav-open');
				document.body.classList.remove('laao-mobile-nav-closing');

				// Clear any existing timeout
				if (state.closeTimeout) {
					clearTimeout(state.closeTimeout);
					state.closeTimeout = null;
				}
			} else {
				document.body.classList.remove('laao-mobile-nav-open');
				document.body.classList.add('laao-mobile-nav-closing');

				// Remove overlay with animation
				const overlay = document.querySelector(
					'.laao-mobile-nav-overlay'
				);
				if (overlay) {
					overlay.classList.add('laao-mobile-nav-overlay-closing');
				}

				state.closeTimeout = setTimeout(() => {
					document.body.classList.remove('laao-mobile-nav-closing');
					overlay?.remove();
					state.closeTimeout = null;
				}, 450);
			}
		},
	},
	callbacks: {
		HandleResize: () => {
			const isMobile = useIsMobile();

			if (!isMobile && state.isActive) {
				actions.toggleMenu();
			}
		},
		HandleMobileAccessibility: () => {
			const isMobile = useIsMobile();
			const nav = document.querySelector('.site-nav');

			if (!nav) {
				return;
			}

			if (isMobile) {
				nav.setAttribute('aria-label', 'Navigation Menu');
				nav.setAttribute('role', 'dialog');
				nav.setAttribute('aria-modal', `${state.isActive}`);
			} else {
				nav.removeAttribute('aria-label');
				nav.removeAttribute('role');
				nav.removeAttribute('aria-modal');
			}
		},
		handleKeydown(event) {
			if (state.isActive) {
				if (event.key === 'Escape') {
					actions.toggleMenu();
				}
			}
		},
	},
});
