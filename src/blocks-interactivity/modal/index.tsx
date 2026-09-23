import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import type { BlockConfiguration } from '@wordpress/blocks';
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

	deprecated: [
		/**
		 * Deprecation v2 — InnerBlocks were stored inside a modal wrapper.
		 * Dynamic rendering supplies the wrapper, so this duplicated visual
		 * block-support styles inside the dialog.
		 */
		{
			attributes: metadata.attributes as NonNullable<
				BlockConfiguration<ModalAttributes>['attributes']
			>,
			save() {
				const blockProps = useBlockProps.save();
				return (
					<div {...blockProps}>
						<InnerBlocks.Content />
					</div>
				);
			},
		},
		/**
		 * Deprecation v1 — close button was rendered in save.tsx (stored in
		 * post DB). It is now rendered server-side so style and placement
		 * changes need no further deprecations.
		 */
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
