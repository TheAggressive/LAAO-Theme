/**
 * theme.json palette reader, shared by the baseline generator and the spec.
 *
 * Palette entries reference tokens rather than declaring colours inline
 * (settings.color.palette -> var(--wp--custom--color--x) -> settings.custom.
 * color.x), so anything reasoning about a colour's actual value has to follow
 * that indirection. Doing it in one place keeps the generator and the test from
 * disagreeing about what a slug is declared as.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

// Resolved from the working directory rather than import.meta.url: Playwright
// transpiles playwright.config.ts (and anything it imports) to CommonJS, where
// import.meta is a syntax error. Every caller — pnpm scripts and Playwright
// alike — runs from the repository root.
const repositoryRoot = process.cwd();

/**
 * Reads theme.json.
 *
 * @return {object} Parsed theme.json.
 */
export function readThemeJson() {
	return JSON.parse(
		readFileSync(path.join(repositoryRoot, 'theme.json'), 'utf8')
	);
}

/**
 * Palette slugs mapped to the value they are declared as in theme.json.
 *
 * @param {object} [themeJson] Parsed theme.json; read from disk when omitted.
 * @return {Record<string, string>} Map of slug to declared value.
 */
export function readDeclaredPalette(themeJson = readThemeJson()) {
	return Object.fromEntries(
		(themeJson.settings?.color?.palette ?? []).map((entry) => [
			entry.slug,
			entry.color,
		])
	);
}

/**
 * Follows a palette declaration to the literal colour behind it.
 *
 * Resolves a single level of var(--wp--custom--color--x) into
 * settings.custom.color.x, which is the only indirection this theme uses.
 * Anything else is returned unchanged.
 *
 * @param {string} declaration Declared palette value.
 * @param {object} [themeJson] Parsed theme.json; read from disk when omitted.
 * @return {string} The literal colour, or the input if it could not be resolved.
 */
export function resolveDeclaration(declaration, themeJson = readThemeJson()) {
	const match = /^var\(\s*--wp--custom--color--([a-z0-9-]+)\s*\)$/i.exec(
		declaration ?? ''
	);

	if (!match) {
		return declaration;
	}

	return themeJson.settings?.custom?.color?.[match[1]] ?? declaration;
}

/**
 * Whether a palette entry is meant to be fully transparent.
 *
 * Needed to tell a colour that is deliberately invisible from one that failed
 * to resolve — both rasterise to rgba(0, 0, 0, 0).
 *
 * @param {string} declaration Declared palette value.
 * @param {object} [themeJson] Parsed theme.json; read from disk when omitted.
 * @return {boolean} True when the declaration specifies zero alpha.
 */
export function isIntentionallyTransparent(
	declaration,
	themeJson = readThemeJson()
) {
	const resolved = resolveDeclaration(declaration, themeJson);

	return (
		/\/\s*0\s*\)/.test(resolved) || // oklch(... / 0), rgb(... / 0)
		/,\s*0\s*\)/.test(resolved) || // hsla(..., 0), rgba(..., 0)
		/^\s*transparent\s*$/i.test(resolved)
	);
}
