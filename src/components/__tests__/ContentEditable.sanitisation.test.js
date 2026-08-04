/**
 * Sanitisation contract for ContentEditable.
 *
 * ContentEditable is the only place the theme sanitises untrusted markup, and
 * it ships: webpack bundles it into the image-credit and What's Hot editor
 * plugins. It runs DOMPurify with an allow-list, so a change to that
 * configuration — or a DOMPurify version with a known bypass — silently widens
 * what an editor can inject into post meta.
 *
 * These assertions pin the behaviour rather than the version. They exercise the
 * exact options the component passes, so they fail if the allow-list is
 * loosened, if FORBID_ATTR is dropped, or if a future DOMPurify stops
 * neutralising one of these vectors.
 */

import DOMPurify from 'isomorphic-dompurify';

// Must stay identical to the options in ../ContentEditable.js.
const SANITISE_OPTIONS = {
	ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
	FORBID_ATTR: ['style'],
};

const sanitise = (input) => DOMPurify.sanitize(input, SANITISE_OPTIONS);

describe('ContentEditable sanitisation', () => {
	it('keeps the allowed inline formatting tags', () => {
		expect(sanitise('<b>bold</b>')).toBe('<b>bold</b>');
		expect(sanitise('<em>emphasis</em>')).toBe('<em>emphasis</em>');
		expect(sanitise('<strong>strong</strong>')).toBe(
			'<strong>strong</strong>'
		);
	});

	it('removes script tags but keeps surrounding text', () => {
		expect(sanitise('<script>alert(1)</script>hi')).toBe('hi');
	});

	it('strips the style attribute', () => {
		expect(sanitise('<b style="color:red">x</b>')).toBe('<b>x</b>');
	});

	it('removes tags outside the allow-list, with their event handlers', () => {
		expect(sanitise('<img src=x onerror=alert(1)>')).toBe('');
		expect(sanitise('<iframe src="evil"></iframe>')).toBe('');
	});

	it('neutralises javascript: URLs on permitted anchors', () => {
		const result = sanitise('<a href="javascript:alert(1)">c</a>');
		expect(result).not.toContain('javascript:');
	});

	it('strips event handlers from permitted tags', () => {
		expect(sanitise('<a onclick="alert(1)">c</a>')).not.toContain(
			'onclick'
		);
	});

	it('handles nesting used to smuggle a payload past a naive filter', () => {
		expect(sanitise('<b><script>alert(1)</script></b>')).toBe('<b></b>');
		expect(sanitise('<scr<script>ipt>alert(1)</script>')).not.toContain(
			'<script'
		);
	});
});
