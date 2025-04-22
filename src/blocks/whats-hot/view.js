/**
 * Use this file for JavaScript code that you want to run in the front-end
 * on posts/pages that contain this block.
 *
 * When this file is defined as the value of the "viewScript" property
 * in block.json, WordPress will load it when the block renders.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
 */

document.addEventListener('DOMContentLoaded', function () {
	const whatsHotSections = document.querySelectorAll('.whats-hot-section');

	if (whatsHotSections.length === 0) {
		return;
	}

	// Add lazyloading for images
	whatsHotSections.forEach((section) => {
		const images = section.querySelectorAll('.whats-hot-image');
		images.forEach((img) => {
			if (!img.hasAttribute('loading')) {
				img.setAttribute('loading', 'lazy');
			}
		});
	});

	// Make sure AOS is available
	if (typeof AOS !== 'undefined') {
		// Initialize AOS if it hasn't been initialized yet
		if (!document.body.classList.contains('aos-initialized')) {
			AOS.init({
				once: true,
				offset: 120,
				delay: 0,
				duration: 800,
			});
			document.body.classList.add('aos-initialized');
		} else {
			// If AOS is already initialized, refresh it to detect new elements
			AOS.refresh();
		}
	} else {
		// If AOS is not loaded yet, load it dynamically
		loadAOS();
	}
});

/**
 * Dynamically load AOS library if not already loaded
 */
function loadAOS() {
	// Check if AOS is already being loaded
	if (document.querySelector('script[src*="aos.js"]')) {
		return;
	}

	// Load AOS CSS
	const aosCSS = document.createElement('link');
	aosCSS.rel = 'stylesheet';
	aosCSS.href = 'https://unpkg.com/aos@next/dist/aos.css';
	document.head.appendChild(aosCSS);

	// Load AOS JS
	const aosScript = document.createElement('script');
	aosScript.src = 'https://unpkg.com/aos@next/dist/aos.js';
	aosScript.onload = function () {
		// Initialize AOS once loaded
		if (typeof AOS !== 'undefined') {
			AOS.init({
				once: true,
				offset: 120,
				delay: 0,
				duration: 800,
			});
			document.body.classList.add('aos-initialized');
		}
	};
	document.body.appendChild(aosScript);
}
