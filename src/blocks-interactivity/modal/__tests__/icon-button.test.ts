import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('modal close icon button', () => {
	const buttonsCss = readFileSync(
		resolve(process.cwd(), 'src/styles/components/_buttons.css'),
		'utf8'
	);
	const renderPhp = readFileSync(
		resolve(process.cwd(), 'src/blocks-interactivity/modal/render.php'),
		'utf8'
	);

	test('uses the shared accessible icon-button sizing and focus treatment', () => {
		expect(buttonsCss).toContain(':where(.laao-icon-button)');
		expect(buttonsCss).toContain('min-width: var(--laao-control-min)');
		expect(buttonsCss).toContain('min-height: var(--laao-control-min)');
		expect(buttonsCss).toContain(':where(.laao-icon-button):focus-visible');
	});

	test('renders an icon-only square when the close label is not visible', () => {
		expect(renderPhp).toContain(
			"$close_label ? '' : 'laao-icon-button--only'"
		);
		expect(renderPhp).toContain('laao-icon-button--square');
	});
});
