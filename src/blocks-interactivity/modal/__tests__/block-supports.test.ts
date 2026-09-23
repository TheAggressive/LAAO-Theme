import metadata from '../block.json';

describe('modal visual block supports', () => {
	test('targets the dialog and does not serialize visual styles on the wrapper', () => {
		expect(metadata.selectors).toEqual({
			root: '.wp-block-laao-modal__dialog',
			css: '.wp-block-laao-modal',
			spacing: {
				margin: '.wp-block-laao-modal',
				padding: '.wp-block-laao-modal__dialog',
			},
		});
		expect(
			metadata.supports.__experimentalBorder
				.__experimentalSkipSerialization
		).toBe(true);
		expect(metadata.supports.color.__experimentalSkipSerialization).toBe(
			true
		);
		expect(metadata.supports.shadow.__experimentalSkipSerialization).toBe(
			true
		);
		expect(
			metadata.supports.spacing.__experimentalSkipSerialization
		).toEqual(['padding']);
	});
});
