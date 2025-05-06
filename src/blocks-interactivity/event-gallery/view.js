/**
 * WordPress dependencies
 */
import { getContext, getElement, store } from '@wordpress/interactivity';

const { state, actions, callbacks } = store('laao/event-gallery', {
	state: {
		currentImageCtx: null,
		currentImageRef: null,
		get currentImage() {
			return state.currentImageCtx;
		},
		get isActive() {
			return state.currentImageCtx !== null;
		},
		get getImgClassNames() {
			return state.currentImageRef.classList.value;
		},
		get getFigureClassNames() {
			return state.currentImageRef.parentNode.classList.value;
		},
		get getImgStyles() {
			return state.isActive && state.currentImageRef.style.cssText;
		},
		get getFigureStyles() {
			return (
				state.isActive && state.currentImageRef.parentNode.style.cssText
			);
		},
		get hasImageLoaded() {
			return state.currentImageRef?.complete;
		},
		get isAriaModal() {
			return state.isActive ? 'true' : null;
		},
		get getRoleAttribute() {
			return state.isActive ? 'dialog' : null;
		},
		get getAltText() {
			return state.currentImageRef.getAttribute('alt');
		},
		get isReducedMotion() {
			return window.matchMedia(`(prefers-reduced-motion: reduce)`)
				.matches;
		},
		get getTimeOut() {
			return state.isReducedMotion ? 0 : 250;
		},
		get getImageId() {
			return state.currentImageRef?.dataset.wpKey;
		},
		get facebookShareUrl() {
			return `https://www.facebook.com/sharer/sharer.php?u=${state.currentImage.attachmentLink}`;
		},
		get xShareUrl() {
			return `https://x.com/intent/tweet?url=${state.currentImage.attachmentLink}`;
		},
		get linkedinShareUrl() {
			return `https://www.linkedin.com/sharing/share-offsite/?url=${state.currentImage.attachmentLink}`;
		},
		get mailShareUrl() {
			return `mailto:?subject=${encodeURIComponent('Check This Out on LAArtsOnline.com!')}&body=${encodeURIComponent(`I thought you might enjoy this! ${state.currentImage.attachmentLink}`)}`;
		},
		get getScrollBarTopPosition() {
			return document.documentElement.scrollTop;
		},
		get getScrollBarLeftPosition() {
			return document.documentElement.scrollLeft;
		},
		get getScrollBarWidth() {
			return window.innerWidth - document.documentElement.clientWidth;
		},
		get getImageLeftPosition() {
			return state.currentImageRef?.getBoundingClientRect().left;
		},
		get getImageTopPosition() {
			return state.currentImageRef?.getBoundingClientRect().top;
		},
	},
	actions: {
		init: () => {
			if (state.isActive) {
				return;
			}

			const context = getContext();
			const { ref } = getElement();

			actions.setCurrentImage(context, ref);

			// Bails out if the image has not loaded yet.
			if (!state.hasImageLoaded) {
				return;
			}

			// Stores the width the scrollbar to avoid layout shift.
			state.scrollBarWidth = state.getScrollBarWidth;

			// Sets the lightbox variables to calculate the image size and position.
			callbacks.setLightBoxVariables();

			callbacks.setScrollLock();

			// Stores the focusable elements when lightbox opens to lock focus inside the lightbox.
			actions.focusLock();

			state.isOverlayActive = true;
		},
		destroy: () => {
			if (state.isOverlayActive) {
				// Prevent multiple close attempts
				if (state.isClosing) {
					return;
				}

				// Starts the overlay closing animation. The showClosingAnimation
				// class is used to avoid showing it on page load.
				state.isOverlayActive = false;
				state.isClosing = true;
				state.isScrolling = false;

				// Use passive event listener for better performance during closing animation
				document.addEventListener(
					'touchmove',
					function (e) {
						e.preventDefault();
					},
					{ passive: false, once: true }
				);

				// Waits until the close animation has completed before allowing a
				// user to scroll again. The duration of this animation is defined in
				// the `styles.scss` file, but in any case we should wait a few
				// milliseconds longer than the duration, otherwise a user may scroll
				// too soon and cause the animation to look sloppy.
				setTimeout(function () {
					// Delays before changing the focus. Otherwise the focus ring will
					// appear on Firefox before the image has finished animating, which
					// looks broken.
					if (state.currentImageRef) {
						state.currentImageRef.focus({
							preventScroll: true,
						});
					}

					// Resets the current image id to mark the overlay as closed.
					actions.setCurrentImage(null, null);

					// IMPORTANT: Only reset these states after animation completes
					state.isClosing = false;
					state.getNext = false;
					state.getPrevious = false;

					callbacks.setScrollLock();
				}, state.getTimeOut);
			}
		},
		setCurrentImage(context, ref) {
			state.currentImageCtx = context;
			state.currentImageRef = ref;
		},
		handleNextImage() {
			// Prevents double clicks from triggering the animation twice.
			if (state.getNext) {
				return;
			}

			// Activates the scrolling animation.
			state.getNext = true;
			// Removes the previous image animation.
			state.isScrolling = true;

			// Animation duration from CSS is 500ms - sync our timing with it
			const animationDuration = 500;

			// Allows image to stay in view while the animation finishes.
			setTimeout(() => {
				// If there is no next sibling, it goes back to the first image.
				if (!state.currentImageRef.parentNode.nextElementSibling) {
					actions.setCurrentImage(
						JSON.parse(
							state.currentImageRef.parentNode.parentNode.firstElementChild.getAttribute(
								'data-wp-context'
							)
						),
						state.currentImageRef.parentNode.parentNode.firstElementChild.querySelector(
							'img'
						)
					);
				} else {
					// Sets the next sibling as current image.
					actions.setCurrentImage(
						JSON.parse(
							state.currentImageRef.parentNode.nextElementSibling.getAttribute(
								'data-wp-context'
							)
						),
						state.currentImageRef.parentNode.nextElementSibling.querySelector(
							'img'
						)
					);
				}

				// Check if image is loaded and set variables when ready
				if (state.hasImageLoaded) {
					callbacks.setLightBoxVariables();
					// Don't reset state.getNext until animation is complete
					// animation-duration in CSS is 500ms, so we wait full duration
				} else {
					// If not loaded yet, add a load event listener
					state.currentImageRef.addEventListener(
						'load',
						() => {
							callbacks.setLightBoxVariables();
							// Don't reset flag here, wait for animation to complete
						},
						{ once: true }
					);
				}
			}, animationDuration / 2); // Half of animation time to swap image at midpoint

			// Reset navigation state only after full animation completes
			setTimeout(() => {
				state.getNext = false;
			}, animationDuration);
		},
		handlePreviousImage() {
			// Prevents double clicks from triggering the animation twice.
			if (state.getPrevious) {
				return;
			}

			// Activates the scrolling animation.
			state.isScrolling = true;
			// Removes the previous image animation.
			state.getPrevious = true;

			// Animation duration from CSS is 500ms - sync our timing with it
			const animationDuration = 500;

			// Allows image to stay in view while the animation finishes.
			setTimeout(() => {
				if (!state.currentImageRef.parentNode.previousElementSibling) {
					actions.setCurrentImage(
						JSON.parse(
							state.currentImageRef.parentNode.parentNode.lastElementChild.getAttribute(
								'data-wp-context'
							)
						),
						state.currentImageRef.parentNode.parentNode.lastElementChild.querySelector(
							'img'
						)
					);
				} else {
					// Sets the previous sibling as current image.
					actions.setCurrentImage(
						JSON.parse(
							state.currentImageRef.parentNode.previousElementSibling.getAttribute(
								'data-wp-context'
							)
						),
						(state.currentImageRef =
							state.currentImageRef.parentNode.previousElementSibling.querySelector(
								'img'
							))
					);
				}

				// Check if image is loaded and set variables when ready
				if (state.hasImageLoaded) {
					callbacks.setLightBoxVariables();
					// Don't reset state.getPrevious until animation is complete
					// animation-duration in CSS is 500ms, so we wait full duration
				} else {
					// If not loaded yet, add a load event listener
					state.currentImageRef.addEventListener(
						'load',
						() => {
							callbacks.setLightBoxVariables();
							// Don't reset flag here, wait for animation to complete
						},
						{ once: true }
					);
				}
			}, animationDuration / 2); // Half of animation time to swap image at midpoint

			// Reset navigation state only after full animation completes
			setTimeout(() => {
				state.getPrevious = false;
			}, animationDuration);
		},
		focusLock() {
			if (state.isActive) {
				// Store focusable elements when lightbox opens
				const lightbox = document.querySelector(
					'.wp-block-laao-event-lightbox'
				);

				state.focusableElements = lightbox?.querySelectorAll(
					'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), .wp-block-laao-event-lightbox-social-link'
				);
			}
		},
		handleImageKeydown(event) {
			if (event.key === 'Enter') {
				actions.init();
			}
		},
		handleKeydown(event) {
			if (event.key === 'Escape') {
				actions.destroy();
			}
			if (event.key === 'ArrowRight') {
				actions.handleNextImage();
			}
			if (event.key === 'ArrowLeft') {
				actions.handlePreviousImage();
			}
			if (event.key === 'Tab') {
				// Always prevent default tab behavior
				event.preventDefault();

				if (state.focusableElements?.length) {
					const firstFocusableEl = state.focusableElements[0];
					const lastFocusableEl =
						state.focusableElements[
							state.focusableElements.length - 1
						];
					const activeElement =
						firstFocusableEl.ownerDocument.activeElement;

					if (event.shiftKey) {
						// If shift+tab, move focus to previous element or wrap to end
						const currentIndex = Array.from(
							state.focusableElements
						).indexOf(activeElement);
						const nextElement =
							currentIndex <= 0
								? lastFocusableEl
								: state.focusableElements[currentIndex - 1];
						nextElement.focus();
					} else {
						// If tab, move focus to next element or wrap to beginning
						const currentIndex = Array.from(
							state.focusableElements
						).indexOf(activeElement);
						const nextElement =
							currentIndex === state.focusableElements.length - 1
								? firstFocusableEl
								: state.focusableElements[currentIndex + 1];
						nextElement.focus();
					}
				}
			}
		},
		handleScroll(event) {
			// Prevents scrolling behaviors that trigger content shift while the
			// lightbox is open. It would be better to accomplish through CSS alone,
			// but using overflow: hidden is currently the only way to do so and
			// that causes a layout to shift and prevents the zoom animation from
			// working in some cases because it's not possible to account for the
			// layout shift when doing the animation calculations. Instead, it uses
			// JavaScript to prevent and reset the scrolling behavior.
			if (state.isActive) {
				// Avoids overriding the scroll behavior on mobile devices because
				// doing so breaks the pinch to zoom functionality, and users should
				// be able to zoom in further on the high-res image.
				// It doesn't rely on `event.preventDefault()` to prevent scrolling
				// because the scroll event can't be canceled, so it resets the
				// position instead.

				event.preventDefault();
				event.stopPropagation();

				return false;
			}
		},
		// Prevent all types of scroll
		preventScroll(e) {
			if (state.isActive) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		},
		preventScrollKeys(e) {
			// Prevent scrolling with keyboard
			const keys = {
				ArrowUp: 1,
				ArrowDown: 1,
				Space: 1,
				PageUp: 1,
				PageDown: 1,
				Home: 1,
				End: 1,
			};

			if (state.isActive && keys[e.key]) {
				e.preventDefault();
				return false;
			}
		},
	},
	callbacks: {
		setScrollLock() {
			if (state.isActive) {
				// Store the current scroll position
				state.scrollPosition =
					window.scrollY || document.documentElement.scrollTop;

				// Add scroll-lock class to body
				document.body.classList.add('scroll-lock');

				// Add event listeners to prevent all types of scrolling
				window.addEventListener('wheel', actions.preventScroll, {
					passive: false,
				});
				window.addEventListener('touchmove', actions.preventScroll, {
					passive: false,
				});
				window.addEventListener('keydown', actions.preventScrollKeys, {
					passive: false,
				});
			} else {
				// Remove scroll-lock class from body
				document.body.classList.remove('scroll-lock');

				// Restore scroll position
				window.scrollTo(0, state.scrollPosition);

				// Remove event listeners - but only after animation has completed
				window.removeEventListener('wheel', actions.preventScroll);
				window.removeEventListener('touchmove', actions.preventScroll);
				window.removeEventListener(
					'keydown',
					actions.preventScrollKeys
				);
			}
		},
		setOverlayFocus() {
			if (state.isActive) {
				// Moves the focus to the dialog when it opens.
				const { ref } = getElement();

				ref.focus({ preventScroll: true });
			}
		},
		setLightBoxVariables() {
			if (!state.isActive) {
				return;
			}

			// Cache DOM reads to prevent layout thrashing
			const {
				naturalWidth: nativeWidth,
				naturalHeight: nativeHeight,
				offsetWidth: displayWidth,
				offsetHeight: displayHeight,
			} = state.currentImageRef;

			const { x: initialLeft, y: initialTop } =
				state.currentImageRef.getBoundingClientRect();
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;
			const isMobile = windowWidth <= 768;

			// Natural ratio of the image clicked to open the lightbox.
			const nativeRatio = nativeWidth / nativeHeight;
			// Original ratio of the image clicked to open the lightbox.
			const displayRatio = displayWidth / displayHeight;

			// For images taller than viewport height, calculate a scale factor to reduce them to 90% viewport height
			// If image height <= viewport height, no scaling needed (scale factor = 1)
			const reduceTallImage =
				nativeHeight > windowHeight
					? Math.min((windowHeight * 0.9) / nativeHeight, 1)
					: 1;

			// Adjust native dimensions if image is tall
			const scaledNativeWidth = nativeWidth * reduceTallImage;
			const scaledNativeHeight = nativeHeight * reduceTallImage;

			// Typically, it uses the image's full-sized dimensions. If those
			// dimensions have not been set (i.e. an external image with only one
			// size), the image's dimensions in the lightbox are the same
			// as those of the image in the content.
			let imgMaxWidth = parseFloat(
				state.currentImageRef.targetWidth !== undefined &&
					state.currentImageRef.targetWidth !== 'none'
					? state.currentImageRef.targetWidth
					: scaledNativeWidth
			);
			let imgMaxHeight = parseFloat(
				state.currentImageRef.targetHeight !== undefined &&
					state.currentImageRef.targetHeight !== 'none'
					? state.currentImageRef.targetHeight
					: scaledNativeHeight
			);

			// Ratio of the biggest image stored in the database.
			let imgRatio = imgMaxWidth / imgMaxHeight;
			let containerMaxWidth = imgMaxWidth;
			let containerMaxHeight = imgMaxHeight;
			let containerWidth = imgMaxWidth;
			let containerHeight = imgMaxHeight;

			// Checks if the target image has a different ratio than the original
			// one (thumbnail). Recalculates the width and height.
			if (nativeRatio.toFixed(2) !== imgRatio.toFixed(2)) {
				if (nativeRatio > imgRatio) {
					// If the width is reached before the height, it keeps the maxWidth
					// and recalculates the height unless the difference between the
					// maxHeight and the reducedHeight is higher than the maxWidth,
					// where it keeps the reducedHeight and recalculate the width.
					const reducedHeight = imgMaxWidth / nativeRatio;
					if (imgMaxHeight - reducedHeight > imgMaxWidth) {
						imgMaxHeight = reducedHeight;
						imgMaxWidth = reducedHeight * nativeRatio;
					} else {
						imgMaxHeight = imgMaxWidth / nativeRatio;
					}
				} else {
					// If the height is reached before the width, it keeps the maxHeight
					// and recalculate the width unless the difference between the
					// maxWidth and the reducedWidth is higher than the maxHeight, where
					// it keeps the reducedWidth and recalculate the height.
					const reducedWidth = imgMaxHeight * nativeRatio;
					if (imgMaxWidth - reducedWidth > imgMaxHeight) {
						imgMaxWidth = reducedWidth;
						imgMaxHeight = reducedWidth / nativeRatio;
					} else {
						imgMaxWidth = imgMaxHeight * nativeRatio;
					}
				}
				containerWidth = imgMaxWidth;
				containerHeight = imgMaxHeight;
				imgRatio = imgMaxWidth / imgMaxHeight;

				// Calculates the max size of the container.
				if (displayRatio > imgRatio) {
					containerMaxWidth = imgMaxWidth;
					containerMaxHeight = containerMaxWidth / displayRatio;
				} else {
					containerMaxHeight = imgMaxHeight;
					containerMaxWidth = containerMaxHeight * displayRatio;
				}
			}

			// If the image has been pixelated on purpose, it keeps that size.
			if (
				displayWidth > containerWidth ||
				displayHeight > containerHeight
			) {
				containerWidth = displayWidth;
				containerHeight = displayHeight;
			}

			// Calculates the final lightbox image size and the scale factor.
			// MaxWidth is either the window container (accounting for padding) or
			// the image resolution.
			let horizontalPadding = isMobile ? 20 : 80;
			if (windowWidth > 1920) {
				horizontalPadding = 160;
			}

			const verticalPadding = isMobile ? 40 : 80;

			// Calculate the available viewport space
			const availableWidth = windowWidth - horizontalPadding;
			const availableHeight = windowHeight - verticalPadding;

			// Get original dimensions for final image
			let finalImgWidth = imgMaxWidth;
			let finalImgHeight = imgMaxHeight;

			// Check if the image exceeds viewport boundaries and scale proportionally if needed
			if (
				finalImgWidth > availableWidth ||
				finalImgHeight > availableHeight
			) {
				// Calculate scale factors for both dimensions
				const widthScaleFactor = availableWidth / finalImgWidth;
				const heightScaleFactor = availableHeight / finalImgHeight;

				// Use the smaller scale factor to ensure both dimensions fit within viewport
				const scaleFactor = Math.min(
					widthScaleFactor,
					heightScaleFactor
				);

				// Apply the scale factor to both dimensions to maintain aspect ratio
				finalImgWidth = finalImgWidth * scaleFactor;
				finalImgHeight = finalImgHeight * scaleFactor;
			}

			// Calculate container dimensions with proper aspect ratio
			const targetMaxWidth = Math.min(availableWidth, containerWidth);

			const targetMaxHeight = Math.min(availableHeight, containerHeight);

			const targetContainerRatio = targetMaxWidth / targetMaxHeight;

			if (displayRatio > targetContainerRatio) {
				// If targetMaxWidth is reached before targetMaxHeight.
				containerWidth = targetMaxWidth;
				containerHeight = containerWidth / displayRatio;
			} else {
				// If targetMaxHeight is reached before targetMaxWidth.
				containerHeight = targetMaxHeight;
				containerWidth = containerHeight * displayRatio;
			}

			const containerScale = displayWidth / containerWidth;

			// Add 1 pixel to fix iOS Safari issue with small whitespace
			state.lightBoxVariables = `
				:root {
					--wp--lightbox-initial-top-position: ${initialTop}px;
					--wp--lightbox-initial-left-position: ${initialLeft}px;
					--wp--lightbox-container-width: ${containerWidth + 1}px;
					--wp--lightbox-container-height: ${containerHeight + 1}px;
					--wp--lightbox-scale: ${containerScale};
					--wp--lightbox-scrollbar-width: ${state.scrollBarWidth}px;
					--wp--lightbox-image-max-width: ${finalImgWidth}px;
					--wp--lightbox-image-max-height: ${finalImgHeight}px;
				}
			`;
		},
	},
});
