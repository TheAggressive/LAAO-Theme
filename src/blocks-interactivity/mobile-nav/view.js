/**
 * WordPress dependencies
 */
import { store, useEffect, useState } from '@wordpress/interactivity';

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
		get isMobile() {
			return window.innerWidth < 1024;
		},
	},
	actions: {
		toggleMenu() {
			state.isActive = !state.isActive;

			if (state.isActive) {
				actions.activateMenu();
			} else {
				actions.deactivateMenu();
			}
		},
		activateMenu() {
			document.body.classList.add('laao-mobile-nav-open');
		},
		deactivateMenu() {
			document.body.classList.remove('laao-mobile-nav-open');
			document.body.classList.add('laao-mobile-nav-closing');

			setTimeout(() => {
				document.body.classList.remove('laao-mobile-nav-closing');
			}, 450);
		},
	},
	callbacks: {
		handleResize() {
			if (state.isMobile) {
				if (state.isActive) {
					actions.toggleMenu();
				}
			}
		},
		HandleMobileAccessibility: () => {
			const isMobile = useIsMobile();
			const nav = document.querySelector('.site-nav');

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
