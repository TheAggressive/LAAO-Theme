/**
 * Shared helpers for Interactivity API blocks.
 *
 * Extracted from the Aggressive Apparel theme, which keeps a much larger
 * helpers module. Only the pieces this theme actually uses are carried across —
 * importing the whole file would drag in store-specific code that has no
 * meaning here.
 */

/**
 * Confines Tab and Shift+Tab to the focusable elements inside a container.
 *
 * Elements inside a `[hidden]` or `[inert]` subtree are excluded, so content
 * that is present in the DOM but not currently offered to the user cannot be
 * reached by keyboard.
 *
 * @param container Element to trap focus within.
 * @return Cleanup function that removes the listener.
 */
export function setupFocusTrap( container: HTMLElement ): () => void {
	const FOCUSABLE_SELECTOR =
		'a[href], button:not([disabled]), input:not([disabled]), ' +
		'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	const handleKeydown = ( event: KeyboardEvent ): void => {
		if ( event.key !== 'Tab' ) {
			return;
		}

		const focusable = Array.from(
			container.querySelectorAll< HTMLElement >( FOCUSABLE_SELECTOR )
		).filter(
			( element ) =>
				! element.closest( '[hidden]' ) && ! element.closest( '[inert]' )
		);

		if ( focusable.length === 0 ) {
			event.preventDefault();
			return;
		}

		const currentIndex = focusable.indexOf(
			document.activeElement as HTMLElement
		);
		let nextIndex: number;

		if ( event.shiftKey ) {
			nextIndex =
				currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
		} else {
			nextIndex =
				currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
		}

		event.preventDefault();
		focusable[ nextIndex ].focus();
	};

	container.addEventListener( 'keydown', handleKeydown );

	return () => {
		container.removeEventListener( 'keydown', handleKeydown );
	};
}
