/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.css';

import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @param  root0
 * @param  root0.attributes
 * @param  root0.setAttributes
 * @param  root0.context
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes, context }) {
	const { placeAfter } = attributes;
	const blockProps = useBlockProps();
	const innerBlockProps = useInnerBlocksProps(blockProps, {
		allowedBlocks: ['adsanity/ad-group', 'adsanity/rotating-ad'],
		template: [['core/paragraph']],
		templateLock: false,
	});

	const { postIndex } = useSelect(
		(select) => {
			const { getEntityRecords } = select('core');
			const posts = getEntityRecords('postType', context.postType, {
				per_page: -1,
			});

			const currentPostId = context.postId;

			const getPostIndex = posts
				? posts.findIndex((post) => post.id === currentPostId) + 1
				: -1;

			return {
				postIndex: getPostIndex,
			};
		},
		[context.postId, context.postType]
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'query-loop-ad-inserter')}>
					<TextControl
						label={__('Place Ad After Every Nth Post', 'laao')}
						type="number"
						value={placeAfter}
						onChange={(value) =>
							setAttributes({ placeAfter: parseInt(value) })
						}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>
			{postIndex === placeAfter && <div {...innerBlockProps} />}
		</>
	);
}
