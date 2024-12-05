/**
 * WordPress dependencies
 */
import { store, useEffect, useState } from '@wordpress/interactivity';
import { trapFocus } from '../../utils/focusTrap';

const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		// Create media query list
		const mediaQuery = window.matchMedia('(max-width: 1023px)');

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

				state.closeTimeout = setTimeout(() => {
					document.body.classList.remove('laao-mobile-nav-closing');
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
