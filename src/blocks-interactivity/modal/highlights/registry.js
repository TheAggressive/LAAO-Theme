/**
 * Shared highlight registries.
 *
 * Highlighting a modal trigger appends elements, attaches listeners and starts
 * timers across several modules. These collections are the single record of
 * what has been created, so cleanup can undo all of it without guessing.
 *
 * Exported as live bindings: every module mutates the same instances.
 */

/** Elements that have had highlight styling applied. @type {Set<Element>} */
export const highlightedElements = new Set();

/** Highlighted elements keyed by modal id. @type {Map<string, Element>} */
export const highlightElements = new Map();

/** Injected <style> tags keyed by their id. @type {Map<string, Element>} */
export const styleElements = new Map();

/** Running animation intervals keyed by modal id. @type {Map<string, number>} */
export const animationTimers = new Map();

/** Document-level keydown listeners keyed by modal id. @type {Map<string, Function>} */
export const eventListeners = new Map();

/**
 * Elements and handles created for the current highlight.
 *
 * Fields are reassigned during cleanup, so consumers must read through the
 * object rather than destructuring it.
 */
export const highlightData = {
	highlights: [],
	tooltips: [],
	pulseElements: [],
	timers: [],
	eventListeners: [],
	resizeObserver: null,
};

/** Every class the highlight styles apply, used to strip them again. */
export const HIGHLIGHT_CLASS_SELECTORS = [
	'.modal-highlight-target',
	'.modal-trigger-highlight',
	'.modal-trigger-highlight-discreet',
	'.no-layout-shift',
	'.modal-direct-highlight',
	'.modal-highlight-arrow',
	'.modal-highlight-label',
];
