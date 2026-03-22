import metadata from '../block.json';

// Save is a thin wrapper — test the metadata and attribute contract rather
// than rendering the full component (which drags in the @wordpress/block-editor
// package's deep internal requires in the test environment).

describe('query-loop-ad-inserter block.json', () => {
	it('placeAfter attribute defaults to 10', () => {
		expect(metadata.attributes.placeAfter.default).toBe(10);
	});

	it('placeAfter is a number type', () => {
		expect(metadata.attributes.placeAfter.type).toBe('number');
	});

	it('uses apiVersion 3', () => {
		expect(metadata.apiVersion).toBe(3);
	});

	it('disables free-form HTML editing', () => {
		expect(metadata.supports.html).toBe(false);
	});

	it('has a render.php defined', () => {
		expect(metadata.render).toBe('file:./render.php');
	});

	it('has an editorScript defined', () => {
		expect(metadata.editorScript).toBeDefined();
	});
});
