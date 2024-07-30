/**
 * WordPress dependencies
 */
import { getContext, getElement, store } from "@wordpress/interactivity";

const { state } = store('laao/event-gallery', {
	state: {
		currentImageId: {},
		isLightboxActive: false,
	},
	actions: {
		showLightbox: () => {
			const { imageId } = getContext();
			const { ref } = getElement();

			console.log('ref', ref?.complete);
			console.log('ref.currentSrc', ref.currentSrc);

			state.imageRef = ref?.complete;
			state.currentSrc = ref.currentSrc;

			console.log('context', imageId);

			// Bails out if the image has not loaded yet.
			if (!state.imageId.imageRef?.complete) {
				return;
			}

			state.isLightboxActive = true;
			state.currentImageId = imageId;

			// Stores the positions of the scroll to fix it until the overlay is
			// closed.
			state.scrollTopReset = document.documentElement.scrollTop;
			state.scrollLeftReset = document.documentElement.scrollLeft;

			callbacks.setOverlayStyles();

		},
		hideLightbox: () => {
			const context = getContext();
			state.isLightboxActive = false;
		},
		handleKeydown(event) {
			if (event.key === 'Escape') {
				state.isLightboxActive = false;
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
		setOverlayStyles() {
			if (!state.currentImage.imageRef) {
				return;
			}

			let {
				naturalWidth,
				naturalHeight,
				offsetWidth: originalWidth,
				offsetHeight: originalHeight,
			} = state.currentImage.imageRef;
			let { x: screenPosX, y: screenPosY } =
				state.currentImage.imageRef.getBoundingClientRect();

			// Natural ratio of the image clicked to open the lightbox.
			const naturalRatio = naturalWidth / naturalHeight;
			// Original ratio of the image clicked to open the lightbox.
			let originalRatio = originalWidth / originalHeight;

			// If it has object-fit: contain, recalculates the original sizes
			// and the screen position without the blank spaces.
			if (state.currentImage.scaleAttr === 'contain') {
				if (naturalRatio > originalRatio) {
					const heightWithoutSpace = originalWidth / naturalRatio;
					// Recalculates screen position without the top space.
					screenPosY +=
						(originalHeight - heightWithoutSpace) / 2;
					originalHeight = heightWithoutSpace;
				} else {
					const widthWithoutSpace = originalHeight * naturalRatio;
					// Recalculates screen position without the left space.
					screenPosX += (originalWidth - widthWithoutSpace) / 2;
					originalWidth = widthWithoutSpace;
				}
			}
			originalRatio = originalWidth / originalHeight;

			// Typically, it uses the image's full-sized dimensions. If those
			// dimensions have not been set (i.e. an external image with only one
			// size), the image's dimensions in the lightbox are the same
			// as those of the image in the content.
			let imgMaxWidth = parseFloat(
				state.currentImage.targetWidth !== 'none'
					? state.currentImage.targetWidth
					: naturalWidth
			);
			let imgMaxHeight = parseFloat(
				state.currentImage.targetHeight !== 'none'
					? state.currentImage.targetHeight
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
					// and recalculate the width unlesss the difference between the
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
			state.overlayStyles = `
			:root {
				--wp--lightbox-initial-top-position: ${screenPosY}px;
				--wp--lightbox-initial-left-position: ${screenPosX}px;
				--wp--lightbox-container-width: ${containerWidth + 1}px;
				--wp--lightbox-container-height: ${containerHeight + 1}px;
				--wp--lightbox-image-width: ${lightboxImgWidth}px;
				--wp--lightbox-image-height: ${lightboxImgHeight}px;
				--wp--lightbox-scale: ${containerScale};
				--wp--lightbox-scrollbar-width: ${window.innerWidth - document.documentElement.clientWidth
				}px;
			}
		`;
		},
		setOverlayFocus() {
			if (state.overlayEnabled) {
				// Moves the focus to the dialog when it opens.
				const { ref } = getElement();
				ref.focus();
			}
		},
	},
});
