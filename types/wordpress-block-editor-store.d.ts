/**
 * Type the `core/block-editor` store so `select( blockEditorStore )` resolves
 * real selector signatures instead of `unknown`.
 *
 * Why this is needed: `@wordpress/data` ships its own types, and its
 * `CurriedSelectorsOf<S>` only resolves selectors when the store descriptor
 * carries a `ReduxStoreConfig` with a `Selectors` type. `@wordpress/block-editor`
 * ships no types of its own, so the descriptor comes from
 * `@types/wordpress__block-editor`, which extends `StoreDescriptor` with the
 * default `AnyConfig`. Inference then falls through and every selector is
 * `unknown`. Merging a typed `instantiate` into the descriptor supplies the
 * config that inference needs.
 *
 * Selectors are declared in their REGISTERED form — with the leading `state`
 * argument — because `CurriedState` strips that first parameter to produce the
 * public signature. Declaring them pre-curried would shift every argument.
 *
 * Only the selectors this theme actually calls are declared. Add to this list
 * rather than widening it; each entry is a deliberate contract.
 *
 * @package LAAO
 */

// BlockInstance, not Block: only BlockInstance carries clientId, which every
// selector below is used to look blocks up by. Block is the *registration*
// shape (name, attributes schema, edit/save) and has no instance identity.
import type { BlockInstance } from '@wordpress/blocks';
import type {
	DataRegistry,
	ReduxStoreConfig,
	StoreInstance,
} from '@wordpress/data';

declare module '@wordpress/block-editor' {
	/**
	 * Registered signatures for the `core/block-editor` selectors in use.
	 */
	export interface BlockEditorRegisteredSelectors {
		getBlock: (
			state: unknown,
			clientId: string
		) => BlockInstance | undefined;
		getBlockAttributes: (
			state: unknown,
			clientId: string
		) => Record<string, unknown> | null;
		getBlockCount: (state: unknown, rootClientId?: string) => number;
		getBlockName: (state: unknown, clientId: string) => string;
		getBlockOrder: (state: unknown, rootClientId?: string) => string[];
		getBlockParents: (
			state: unknown,
			clientId: string,
			ascending?: boolean
		) => string[];
		getBlockParentsByBlockName: (
			state: unknown,
			clientId: string,
			blockName: string | string[],
			ascending?: boolean
		) => string[];
		getBlockRootClientId: (
			state: unknown,
			clientId: string
		) => string | null;
		getBlocks: (state: unknown, rootClientId?: string) => BlockInstance[];
		getSelectedBlockClientId: (state: unknown) => string | null;
		hasSelectedInnerBlock: (
			state: unknown,
			clientId: string,
			deep?: boolean
		) => boolean;
		isBlockValid: (state: unknown, clientId: string) => boolean;
	}

	/**
	 * Action creators dispatched via `useDispatch( blockEditorStore )`.
	 *
	 * Unlike selectors these are declared in their public form; `dispatch()`
	 * only wraps the return value in a promise, it does not drop an argument.
	 */
	export interface BlockEditorActionCreators {
		updateBlockAttributes: (
			clientId: string | string[],
			attributes: Record<string, unknown>,
			uniqueByBlock?: boolean
		) => void;
	}

	interface BlockEditorStoreDescriptor {
		instantiate: (
			registry: DataRegistry
		) => StoreInstance<
			ReduxStoreConfig<
				unknown,
				BlockEditorActionCreators,
				BlockEditorRegisteredSelectors
			>
		>;
	}
}
