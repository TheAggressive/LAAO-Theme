/**
 * WordPress dependencies
 */
import { getContext, getElement, store } from "@wordpress/interactivity";

const { state, actions, callbacks } = store('laao/event-gallery', {
	state: {
		currentImageId: null,
		currentImageIdRef: null,
		get currentImage() {
			return state.currentImageId;
		},
		get currentImageRef() {
			return state.currentImageIdRef;
		},
		get isLightboxActive() {
			return state.currentImage !== null;
		},
		get getImgClassNames() {
			return state.currentImageRef.classList.value;
		},
		get getFigureClassNames() {
			return state.currentImageRef.parentNode.classList.value;
		},
		get getImgStyles() {
			return (state.isLightboxActive && state.currentImageRef.style.cssText);
		},
		get getFigureStyles() {
			return (state.isLightboxActive && state.currentImageRef.parentNode.style.cssText);
		},
		get hasImageLoaded() {
			return state.currentImageRef?.complete;
		},
		get isAriaModal() {
			return state.isLightboxActive ? 'true' : null;
		},
		get getRoleAttribute() {
			return state.isLightboxActive ? 'dialog' : null;
		},
		get getAltText() {
			return state.currentImageRef.getAttribute('alt');
		},
		get isReduced() {
			return window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;
		},
		get getTimeOut() {
			return state.isReduced ? 0 : 450;
		},
	},
	actions: {
		showLightbox: () => {
			if (state.isLightboxActive) {
				return;
			}

			const context = getContext();
			const { ref } = getElement();

			actions.setImage(context, ref);

			// Bails out if the image has not loaded yet.
			if (!state.hasImageLoaded) {
				return;
			}

			// Set scrollBar width
			actions.setScrollBarWidth();

			state.overlayActive = true;

			// Stores the positions of the scroll to fix it until the overlay is closed.
			actions.setScrollPositions();

			// Sets the lightbox variables to calculate the image size and position.
			callbacks.setLightBoxVariables();

			callbacks.setScrollLock();
		},
		hideLightbox: () => {
			if (state.overlayActive) {
				// Starts the overlay closing animation. The showClosingAnimation
				// class is used to avoid showing it on page load.
				state.overlayActive = false;
				state.isLightboxClosing = true;
				state.isScrolling = false;

				// Waits until the close animation has completed before allowing a
				// user to scroll again. The duration of this animation is defined in
				// the `styles.scss` file, but in any case we should wait a few
				// milliseconds longer than the duration, otherwise a user may scroll
				// too soon and cause the animation to look sloppy.
				setTimeout(function () {
					// Delays before changing the focus. Otherwise the focus ring will
					// appear on Firefox before the image has finished animating, which
					// looks broken.
					state.currentImageRef.focus({
						preventScroll: true,
					});

					// Resets the current image id to mark the overlay as closed.
					state.currentImageId = null;
					state.currentImageIdRef = null;

					state.isLightboxClosing = false;

					callbacks.setScrollLock();

				}, state.getTimeOut);
			}
		},
		setImage(context, ref) {
			state.currentImageId = context;
			state.currentImageIdRef = ref;
		},
		setScrollPositions() {
			state.scrollTopReset = document.documentElement.scrollTop;
			state.scrollLeftReset = document.documentElement.scrollLeft;
		},
		setScrollBarWidth() {
			state.scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
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

			// Allows image to stay in view while the animation finishes.
			setTimeout(() => {
				// If there is no next sibling, it goes back to the first image.
				if (!state.currentImageRef.parentNode.nextElementSibling) {
					actions.setImage(
						JSON.parse(state.currentImageRef.parentNode.parentNode.firstElementChild.getAttribute('data-wp-context')),
						state.currentImageRef.parentNode.parentNode.firstElementChild.querySelector('img')
					);
					callbacks.setLightBoxVariables();
					return;
				}

				// Sets the next sibling as current image.
				actions.setImage(
					JSON.parse(state.currentImageRef.parentNode.nextElementSibling.getAttribute('data-wp-context')),
					state.currentImageRef.parentNode.nextElementSibling.querySelector('img')
				);
				callbacks.setLightBoxVariables();
			}, state.getTimeOut);

			// Double the amount of time as half way through the "next image" becomes the "current image".
			setTimeout(() => {
				state.getNext = false;
			}, state.getTimeOut * 2);
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

			// Allows image to stay in view while the animation finishes.
			setTimeout(() => {
				if (!state.currentImageRef.parentNode.previousElementSibling) {
					actions.setImage(
						JSON.parse(state.currentImageRef.parentNode.parentNode.lastElementChild.getAttribute('data-wp-context')),
						state.currentImageRef.parentNode.parentNode.lastElementChild.querySelector('img')
					);
					callbacks.setLightBoxVariables();
					return;
				}

				// Sets the previous sibling as current image.
				actions.setImage(
					JSON.parse(state.currentImageRef.parentNode.previousElementSibling.getAttribute('data-wp-context')),
					state.currentImageIdRef = state.currentImageRef.parentNode.previousElementSibling.querySelector('img')
				);
				callbacks.setLightBoxVariables();
			}, state.getTimeOut);

			// Double the amount of time as half way through the "previous image" becomes the "current image".
			setTimeout(() => {
				state.getPrevious = false;
			}, state.getTimeOut * 2);
		},
		handleImageKeydown(event) {
			if (event.key === 'Enter') {
				actions.showLightbox();
			}
		},
		handleKeydown(event) {
			if (event.key === 'Escape') {
				actions.hideLightbox();
			}
			if (event.key === 'ArrowRight') {
				actions.handleNextImage();
			}
			if (event.key === 'ArrowLeft') {
				actions.handlePreviousImage();
			}
		},
		handleScroll() {
			// Prevents scrolling behaviors that trigger content shift while the
			// lightbox is open. It would be better to accomplish through CSS alone,
			// but using overflow: hidden is currently the only way to do so and
			// that causes a layout to shift and prevents the zoom animation from
			// working in some cases because it's not possible to account for the
			// layout shift when doing the animation calculations. Instead, it uses
			// JavaScript to prevent and reset the scrolling behavior.
			if (state.isLightboxActive) {
				// Avoids overriding the scroll behavior on mobile devices because
				// doing so breaks the pinch to zoom functionality, and users should
				// be able to zoom in further on the high-res image.
				// It doesn't rely on `event.preventDefault()` to prevent scrolling
				// because the scroll event can't be canceled, so it resets the
				// position instead.

				window.scrollTo(
					state.scrollLeftReset,
					state.scrollTopReset
				);
			}
		},
	},
	callbacks: {
		setScrollLock() {
			if (state.isLightboxActive) {
				document.body.classList.add('scroll-lock');
			} else {
				document.body.classList.remove('scroll-lock');
			}
		},
		setOverlayFocus() {
			if (state.isLightboxActive) {
				// Moves the focus to the dialog when it opens.
				const { ref } = getElement();

				ref.focus({ preventScroll: true });
			}
		},
		setLightBoxVariables() {
			if (!state.isLightboxActive) {
				return;
			}

			let {
				naturalWidth,
				naturalHeight,
				offsetWidth: originalWidth,
				offsetHeight: originalHeight,
			} = state.currentImageRef;
			let { x: screenPosX, y: screenPosY } =
				state.currentImageRef.getBoundingClientRect();

			// Natural ratio of the image clicked to open the lightbox.
			const naturalRatio = naturalWidth / naturalHeight;
			// Original ratio of the image clicked to open the lightbox.
			let originalRatio = originalWidth / originalHeight;

			// Typically, it uses the image's full-sized dimensions. If those
			// dimensions have not been set (i.e. an external image with only one
			// size), the image's dimensions in the lightbox are the same
			// as those of the image in the content.
			let imgMaxWidth = parseFloat(
				state.currentImageRef.targetWidth !== undefined && state.currentImageRef.targetWidth !== 'none'
					? state.currentImageRef.targetWidth
					: naturalWidth
			);
			let imgMaxHeight = parseFloat(
				state.currentImageRef.targetHeight !== undefined && state.currentImageRef.targetHeight !== 'none'
					? state.currentImageRef.targetHeight
					: naturalHeight
			);

			// Ratio of the biggest image stored in the database.
			let imgRatio = imgMaxWidth / imgMaxHeight;
			let containerMaxWidth = imgMaxWidth;
			let containerMaxHeight = imgMaxHeight;
			let containerWidth = imgMaxWidth;
			let containerHeight = imgMaxHeight;

			// Checks if the target image has a different ratio than the original
			// one (thumbnail). Recalculates the width and height.
			if (naturalRatio.toFixed(2) !== imgRatio.toFixed(2)) {
				if (naturalRatio > imgRatio) {
					// If the width is reached before the height, it keeps the maxWidth
					// and recalculates the height unless the difference between the
					// maxHeight and the reducedHeight is higher than the maxWidth,
					// where it keeps the reducedHeight and recalculate the width.
					const reducedHeight = imgMaxWidth / naturalRatio;
					if (imgMaxHeight - reducedHeight > imgMaxWidth) {
						imgMaxHeight = reducedHeight;
						imgMaxWidth = reducedHeight * naturalRatio;
					} else {
						imgMaxHeight = imgMaxWidth / naturalRatio;
					}
				} else {
					// If the height is reached before the width, it keeps the maxHeight
					// and recalculate the width unless the difference between the
					// maxWidth and the reducedWidth is higher than the maxHeight, where
					// it keeps the reducedWidth and recalculate the height.
					const reducedWidth = imgMaxHeight * naturalRatio;
					if (imgMaxWidth - reducedWidth > imgMaxHeight) {
						imgMaxWidth = reducedWidth;
						imgMaxHeight = reducedWidth / naturalRatio;
					} else {
						imgMaxWidth = imgMaxHeight * naturalRatio;
					}
				}
				containerWidth = imgMaxWidth;
				containerHeight = imgMaxHeight;
				imgRatio = imgMaxWidth / imgMaxHeight;

				// Calculates the max size of the container.
				if (originalRatio > imgRatio) {
					containerMaxWidth = imgMaxWidth;
					containerMaxHeight = containerMaxWidth / originalRatio;
				} else {
					containerMaxHeight = imgMaxHeight;
					containerMaxWidth = containerMaxHeight * originalRatio;
				}
			}

			// If the image has been pixelated on purpose, it keeps that size.
			if (
				originalWidth > containerWidth ||
				originalHeight > containerHeight
			) {
				containerWidth = originalWidth;
				containerHeight = originalHeight;
			}

			// Calculates the final lightbox image size and the scale factor.
			// MaxWidth is either the window container (accounting for padding) or
			// the image resolution.
			let horizontalPadding = 0;
			if (window.innerWidth > 480) {
				horizontalPadding = 80;
			} else if (window.innerWidth > 1920) {
				horizontalPadding = 160;
			}
			const verticalPadding = 80;

			const targetMaxWidth = Math.min(
				window.innerWidth - horizontalPadding,
				containerWidth
			);
			const targetMaxHeight = Math.min(
				window.innerHeight - verticalPadding,
				containerHeight
			);
			const targetContainerRatio = targetMaxWidth / targetMaxHeight;

			if (originalRatio > targetContainerRatio) {
				// If targetMaxWidth is reached before targetMaxHeight.
				containerWidth = targetMaxWidth;
				containerHeight = containerWidth / originalRatio;
			} else {
				// If targetMaxHeight is reached before targetMaxWidth.
				containerHeight = targetMaxHeight;
				containerWidth = containerHeight * originalRatio;
			}

			const containerScale = originalWidth / containerWidth;
			const lightboxImgWidth =
				imgMaxWidth * (containerWidth / containerMaxWidth);
			const lightboxImgHeight =
				imgMaxHeight * (containerHeight / containerMaxHeight);

			// As of this writing, using the calculations above will render the
			// lightbox with a small, erroneous whitespace on the left side of the
			// image in iOS Safari, perhaps due to an inconsistency in how browsers
			// handle absolute positioning and CSS transformation. In any case,
			// adding 1 pixel to the container width and height solves the problem,
			// though this can be removed if the issue is fixed in the future.
			state.lightBoxVariables = `
			:root {
				--wp--lightbox-initial-top-position: ${screenPosY}px;
				--wp--lightbox-initial-left-position: ${screenPosX}px;
				--wp--lightbox-container-width: ${containerWidth + 1}px;
				--wp--lightbox-container-height: ${containerHeight + 1}px;
				--wp--lightbox-image-width: ${lightboxImgWidth}px;
				--wp--lightbox-image-height: ${lightboxImgHeight}px;
				--wp--lightbox-scale: ${containerScale};
				--wp--lightbox-scrollbar-width: ${state.scrollBarWidth}px;
				--wp--lightbox-scroll-position: ${window.scrollY}px;
				--wp--lightbox-image-natural-width: ${naturalWidth}px;
				--wp--lightbox-image-natural-height: ${naturalHeight}px;
			}
		`;
		},
	},
});
