/**
 * Tests for the modal Interactivity store init behavior around triggers.
 *
 * `@wordpress/interactivity` is virtual-mocked so the store config is
 * captured directly and getContext is controllable.
 *
 * @jest-environment jsdom
 */

let mockContext: Record<string, unknown> = {};
const mockElement = { ref: null as HTMLElement | null };

interface MockStoreConfig {
	state: {
		modals: Record<string, unknown>;
		isOpen: boolean;
		activeModalId: string | null;
	};
	actions: {
		init: () => void;
		openModal: () => void;
		closeModal: () => void;
	};
	callbacks: Record<string, () => (() => void) | void>;
}

// `var` (not let/const) so the binding is hoist-initialized to undefined before
// view.ts's top-level store() call assigns it during the (Jest-hoisted) import.
// eslint-disable-next-line no-var
var mockStoreConfig: MockStoreConfig | undefined;

jest.mock(
	'@wordpress/interactivity',
	() => ({
		store: (_ns: string, config: unknown) => {
			mockStoreConfig = config as MockStoreConfig;
			return config;
		},
		getContext: () => mockContext,
		getElement: () => mockElement,
		withSyncEvent: (fn: unknown) => fn,
	}),
	{ virtual: true }
);

import '../view';

const config = mockStoreConfig as MockStoreConfig;
const actions = config.actions;
const state = config.state;

/** Builds the server-rendered modal markup for a given id (mirrors render.php). */
function setupModal(id: string): {
	wrapper: HTMLElement;
	trigger: HTMLButtonElement;
} {
	const wrapper = document.createElement('div');
	wrapper.className = 'wp-block-laao-modal has-built-in-trigger';

	// The built-in trigger is a sibling of the shell, and both are keyed by data-modal-id.
	const trigger = document.createElement('button');
	trigger.className = 'wp-block-laao-modal__trigger';
	wrapper.appendChild(trigger);

	const shell = document.createElement('div');
	shell.className = 'laao-overlay wp-block-laao-modal__shell';
	shell.dataset.modalId = id;
	shell.hidden = true;

	const dialog = document.createElement('div');
	dialog.id = id;
	dialog.className = 'wp-block-laao-modal__dialog';
	shell.appendChild(dialog);

	wrapper.appendChild(shell);
	document.body.appendChild(wrapper);

	state.modals[id] = { openOnLoad: false };
	mockContext = { id, isMobileViewport: false };
	return { wrapper, trigger };
}

/** Adds a manually connected external trigger (class-only connection). */
function addExternalTrigger(id: string): HTMLButtonElement {
	const el = document.createElement('button');
	el.className = `modal-trigger-${id}`;
	document.body.appendChild(el);
	return el;
}

afterEach(() => {
	document.body.innerHTML = '';
	mockContext = {};
	state.modals = {};
	state.isOpen = false;
	state.activeModalId = null;
});

describe('init trigger handling', () => {
	it('removes the built-in trigger when an external class connection exists', () => {
		const id = 'm-ext';
		const { wrapper, trigger } = setupModal(id);
		addExternalTrigger(id);

		actions.init();

		expect(trigger.isConnected).toBe(false);
		expect(wrapper.classList.contains('has-built-in-trigger')).toBe(false);
		expect(wrapper.classList.contains('is-triggerless')).toBe(true);
	});

	it('keeps the built-in trigger when no external connection exists', () => {
		const id = 'm-plain';
		const { wrapper, trigger } = setupModal(id);

		actions.init();

		expect(trigger.isConnected).toBe(true);
		expect(wrapper.classList.contains('has-built-in-trigger')).toBe(true);
		expect(wrapper.classList.contains('is-triggerless')).toBe(false);
	});

	it('lets the external trigger open the modal after init', () => {
		const id = 'm-click';
		setupModal(id);
		const external = addExternalTrigger(id);

		actions.init();
		external.click();

		expect(state.modals[id]).toMatchObject({ isOpen: true });
	});
});
