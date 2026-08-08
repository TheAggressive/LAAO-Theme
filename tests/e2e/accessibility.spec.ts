import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility gate.
 *
 * Runs axe-core against rendered pages. Structural assertions — that a skip
 * link exists, that templates declare a main landmark — are checked separately
 * in PHP, because they are properties of the theme's files. This covers what
 * only a browser can see: computed contrast, ARIA relationships that resolve
 * across blocks, and labels on controls the markup assembles at runtime.
 *
 * Scoped to WCAG 2.1 A and AA. Best-practice rules are deliberately excluded —
 * they are advice rather than conformance, and mixing them in makes a failure
 * ambiguous about whether something is actually broken.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Formats violations so a failure names the rule, impact and affected markup
 * rather than dumping an object.
 *
 * @param violations axe-core violations.
 * @return Readable summary.
 */
function describeViolations(
	violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']
): string {
	return violations
		.map((violation) => {
			const nodes = violation.nodes
				.slice(0, 3)
				.map((node) => `      ${node.html.slice(0, 120)}`)
				.join('\n');

			return [
				`  [${violation.impact}] ${violation.id}: ${violation.help}`,
				`    ${violation.helpUrl}`,
				`    ${violation.nodes.length} element(s):`,
				nodes,
			].join('\n');
		})
		.join('\n\n');
}

test.describe('accessibility', () => {
	test('the home page has no WCAG A or AA violations', async ({ page }) => {
		// networkidle matters here: contrast is computed from resolved styles,
		// so measuring before stylesheets and webfonts have settled reports
		// colours that never reach the user.
		await page.goto('/', { waitUntil: 'networkidle' });

		const results = await new AxeBuilder({ page })
			.withTags(WCAG_TAGS)
			.analyze();

		// Compared as a compact summary rather than the raw violation objects,
		// which are hundreds of lines of matcher metadata and bury the message.
		const summary = results.violations.map(
			(violation) =>
				`${violation.id} (${violation.impact}, ${violation.nodes.length} node(s))`
		);

		expect(
			summary,
			`\n${describeViolations(results.violations)}\n`
		).toEqual([]);
	});

	test('the skip link receives the first Tab', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });

		const skipLink = page
			.locator('.skip-link, [href^="#wp--skip-link"]')
			.first();

		await expect(
			skipLink,
			'no skip link found — keyboard users must tab the whole header to reach content'
		).toHaveCount(1);

		await page.keyboard.press('Tab');

		const focused = await page.evaluate(() => {
			const element = document.activeElement;
			if (!element) {
				return null;
			}
			return {
				tag: element.tagName.toLowerCase(),
				className: element.className.toString(),
				href: element.getAttribute('href') ?? '',
			};
		});

		// A keyboard user must reach the skip link before anything else, or
		// they tab the entire header on every page. This assertion was only
		// possible once the front-page modal stopped opening on load — an
		// auto-opening dialog correctly traps focus, so it took the first Tab.
		expect(
			`${focused?.className} ${focused?.href}`.toLowerCase(),
			`first focusable element was <${focused?.tag} class="${focused?.className}">`
		).toMatch(/skip|#content|#main/);
	});

	test('every image has an alt attribute', async ({ page }) => {
		await page.goto('/');

		// Decorative images are legitimate, but they must say so with alt="".
		// A missing attribute makes a screen reader announce the filename.
		const missing = await page.$$eval('img:not([alt])', (images) =>
			images.map((image) => (image as HTMLImageElement).src.slice(-70))
		);

		expect(
			missing,
			`images with no alt attribute:\n${missing.join('\n')}`
		).toEqual([]);
	});

	test('the page declares exactly one main landmark', async ({ page }) => {
		await page.goto('/');

		const mainCount = await page.locator('main, [role="main"]').count();

		expect(mainCount, 'expected exactly one main landmark').toBe(1);
	});

	test('headings do not skip levels', async ({ page }) => {
		await page.goto('/');

		const levels = await page.$$eval('h1,h2,h3,h4,h5,h6', (headings) =>
			headings.map((heading) => ({
				level: Number(heading.tagName[1]),
				text: (heading.textContent ?? '').trim().slice(0, 50),
			}))
		);

		const skips: string[] = [];
		levels.forEach((heading, index) => {
			if (0 === index) {
				return;
			}
			const previous = levels[index - 1];
			if (heading.level - previous.level > 1) {
				skips.push(
					`h${previous.level} "${previous.text}" -> h${heading.level} "${heading.text}"`
				);
			}
		});

		expect(
			skips,
			`heading levels jump, which breaks document outline navigation:\n${skips.join('\n')}`
		).toEqual([]);
	});
});
