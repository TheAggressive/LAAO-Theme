import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import type { BlockConfiguration, BlockSaveProps } from '@wordpress/blocks';
import { registerThemeBlock } from '../../utils/register-theme-block';
import { __ } from '@wordpress/i18n';

import './editor.css';
import './style.css';

import metadata from './block.json';
import blockIcon from './icon';
import Edit from './edit';
import Save from './save';
import type { ModalAttributes } from './types';

registerThemeBlock<ModalAttributes>(metadata, {
	icon: blockIcon,
	edit: Edit,
	save: Save,

	/**
	 * Deprecation v1 — close button was rendered in save.tsx (stored in post DB).
	 * Now rendered server-side in render.php so all style/placement changes need
	 * no further deprecations.
	 */
	deprecated: [
		/**
		 * Deprecation v0 — the markup this theme's previous modal saved.
		 *
		 * Distinct from v1 below: the old close button used a single-dash class
		 * (`wp-block-laao-modal-close`, not BEM `__close`) and carried a
		 * `data-wp-context` attribute. Without an exact match WordPress cannot
		 * parse existing content and every saved modal shows "This block contains
		 * unexpected or invalid content".
		 *
		 * `triggerBlockAnchor` was dropped in the new block, so it is declared here
		 * and discarded on migrate rather than silently failing validation.
		 */
		{
			attributes: {
				...(metadata.attributes as NonNullable<
					BlockConfiguration<ModalAttributes>['attributes']
				>),
				triggerBlockAnchor: { type: 'string', default: '' },
			},
			migrate(attributes: Record<string, unknown>): ModalAttributes {
				const { triggerBlockAnchor: _removed, ...rest } = attributes;
				return rest as unknown as ModalAttributes;
			},
			// Typed as the generic save shape WordPress declares for a
			// deprecation, then narrowed: the deprecation's attributes are
			// whatever was in the database, not the current ModalAttributes.
			save({ attributes }: BlockSaveProps<Record<string, unknown>>) {
				const modalId = String(attributes.modalId ?? '');
				const blockProps = useBlockProps.save();
				return (
					<div {...blockProps}>
						<button
							className="wp-block-laao-modal-close"
							data-wp-on--click="actions.closeModal"
							data-wp-context={`{ "id": '${modalId}' }`}
							aria-label={__('Close modal', 'laao')}
						>
							&#x2715;
						</button>
						<InnerBlocks.Content />
					</div>
				);
			},
		},
		{
			attributes: metadata.attributes as NonNullable<
				BlockConfiguration<ModalAttributes>['attributes']
			>,
			save() {
				const blockProps = useBlockProps.save();
				return (
					<div {...blockProps}>
						<button
							className="wp-block-laao-modal__close"
							type="button"
							data-wp-on--click="actions.closeModal"
							aria-label={__('Close modal', 'laao')}
						>
							&#x2715;
						</button>
						<InnerBlocks.Content />
					</div>
				);
			},
		},
	],
});
