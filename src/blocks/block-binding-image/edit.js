/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

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
import { useSelect } from '@wordpress/data';
import './editor.css';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @param {Object}   props               The block props.
 * @param {Object}   props.attributes    The block attributes.
 * @param {Function} props.setAttributes Function to update block attributes.
 * @param {Object}   props.context       The query loop context.
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes, context }) {
	const { metaKey, sizeSlug } = attributes;
	const { postId, postType } = context;

	const metaValue = useSelect(
		(select) => {
			if (!postId || !metaKey) {
				return null;
			}
			const post = select('core').getEntityRecord(
				'postType',
				postType,
				postId
			);
			return post?.meta?.[metaKey] || null;
		},
		[postId, metaKey, postType]
	);

	// Step 2: Fetch the image/media object using the image ID
	const media = useSelect(
		(select) =>
			metaValue
				? select('core').getEntityRecord(
						'postType',
						'attachment',
						metaValue
					)
				: null,
		[metaValue]
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title="Meta Image Settings">
					<TextControl
						label="Meta Field"
						value={metaKey}
						onChange={(val) => setAttributes({ metaKey: val })}
					/>
					<TextControl
						label="Size Slug"
						value={sizeSlug}
						onChange={(val) => setAttributes({ sizeSlug: val })}
					/>
				</PanelBody>
			</InspectorControls>

			<>
				{media?.source_url ? (
					<img src={media?.source_url} alt="" />
				) : (
					<p>
						No image found for meta key: <strong>{metaKey}</strong>
					</p>
				)}
			</>
		</>
	);
}
