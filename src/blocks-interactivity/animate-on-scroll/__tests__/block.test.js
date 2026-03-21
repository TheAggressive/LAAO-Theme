import metadata from '../block.json';

describe( 'animate-on-scroll block.json', () => {
	describe( 'attribute defaults', () => {
		it( 'animation defaults to "fade"', () => {
			expect( metadata.attributes.animation.default ).toBe( 'fade' );
		} );

		it( 'direction defaults to "up"', () => {
			expect( metadata.attributes.direction.default ).toBe( 'up' );
		} );

		it( 'staggerChildren defaults to false', () => {
			expect( metadata.attributes.staggerChildren.default ).toBe( false );
		} );

		it( 'staggerDelay defaults to 0.2', () => {
			expect( metadata.attributes.staggerDelay.default ).toBe( 0.2 );
		} );

		it( 'duration defaults to 0.5', () => {
			expect( metadata.attributes.duration.default ).toBe( 0.5 );
		} );

		it( 'threshold defaults to "0.3"', () => {
			expect( metadata.attributes.threshold.default ).toBe( '0.3' );
		} );

		it( 'debugMode defaults to false', () => {
			expect( metadata.attributes.debugMode.default ).toBe( false );
		} );

		it( 'detectionBoundary has correct default offsets', () => {
			expect( metadata.attributes.detectionBoundary.default ).toEqual( {
				top: '0%',
				right: '0%',
				bottom: '-25%',
				left: '0%',
			} );
		} );
	} );

	describe( 'block metadata', () => {
		it( 'uses apiVersion 3', () => {
			expect( metadata.apiVersion ).toBe( 3 );
		} );

		it( 'has interactivity support enabled', () => {
			expect( metadata.supports.interactivity ).toBe( true );
		} );

		it( 'has a viewScriptModule defined', () => {
			expect( metadata.viewScriptModule ).toBeDefined();
		} );
	} );
} );
