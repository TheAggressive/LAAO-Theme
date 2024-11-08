/**
 * WordPress dependencies
 */
import { getContext, getElement, store } from '@wordpress/interactivity';

const { state } = store('laao/animate-on-scroll', {
	state: {
		isVisible: false,
	},
	callbacks: {
		initObserver: () => {
			const ctx = getContext();
			const { ref } = getElement();

			// Helper function to get direction suffix
			const getDirectionSuffix = () => {
				if (ref.classList.contains('up')) {
					return 'Up';
				}
				if (ref.classList.contains('down')) {
					return 'Down';
				}
				if (ref.classList.contains('left')) {
					return 'Left';
				}
				return 'Right';
			};

			// Get animation type and direction
			let animation = 'fadeIn'; // default animation

			if (ref.classList.contains('fade')) {
				animation = 'fadeIn';
			} else if (ref.classList.contains('slide')) {
				animation = `slide${getDirectionSuffix()}`;
			} else if (ref.classList.contains('scale')) {
				animation = 'scale';
			} else if (ref.classList.contains('flip')) {
				animation = `flip${getDirectionSuffix()}`;
			} else if (ref.classList.contains('rotate')) {
				animation = `rotate${getDirectionSuffix()}`;
			} else if (ref.classList.contains('zoom')) {
				animation = 'zoom';
			} else if (ref.classList.contains('blur')) {
				animation = 'blur';
			} else if (ref.classList.contains('fade-direction')) {
				animation = `fadeDirection${getDirectionSuffix()}`;
			}

			// Set animation name as CSS variable
			ref.style.setProperty('--animation-name', animation);

			// Set duration
			const duration = ref.dataset.animationDuration || 0.6;
			ref.style.setProperty('--animation-duration', `${duration}s`);

			// Handle stagger children
			const staggerChildren = ref.dataset.staggerChildren === 'true';
			const staggerDelay = parseFloat(ref.dataset.staggerDelay || 0.2);

			if (staggerChildren) {
				// Get direct children
				const children = Array.from(ref.children);
				children.forEach((child, index) => {
					const delay = index * staggerDelay;
					// Preserve existing style attribute if it exists
					const existingStyle = child.getAttribute('style') || '';
					child.setAttribute(
						'style',
						`${existingStyle}${existingStyle ? ';' : ''}--stagger-delay: ${delay}s`
					);
				});
			}

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							ctx.isVisible = true;
							observer.unobserve(entry.target);
						}
					});
				},
				{
					threshold: parseFloat(ref.dataset.threshold || '0.25'),
					rootMargin: ref.dataset.rootMargin || '0%',
				}
			);

			observer.observe(ref);

			return () => {
				if (staggerChildren) {
					Array.from(ref.children).forEach((child) => {
						child.style.removeProperty('--stagger-delay');
					});
				}
				observer.disconnect();
			};
		},
	},
});
