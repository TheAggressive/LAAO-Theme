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
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit({ context, }) {
	const [featuredImgID] = useEntityProp('postType', context.postType, 'featured_media', context.postId);
	const getFeaturedImg = useSelect((select) => featuredImgID ? select('core').getMedia(featuredImgID) : null);
	const [meta] = useEntityProp('postType', context.postType, 'meta', context.postId);

	const { picture_id } = meta;

	function generateSrcSet(sizes) {
		let srcSet = '';
		for (let size in sizes) {
			srcSet += `${sizes[size].source_url} ${sizes[size].width}w, `;
		}
		return srcSet;
	}

	return (
		<figure {...useBlockProps()}>
			{getFeaturedImg && (
				<img src={getFeaturedImg.source_url}
					alt={getFeaturedImg.alt_text}
					width={getFeaturedImg.media_details.width}
					height={getFeaturedImg.media_details.height}
					srcSet={generateSrcSet(getFeaturedImg.media_details.sizes)}
				/>
			)}
			{picture_id && (
				<figcaption className='wp-block-laao-post-featured-image-caption' dangerouslySetInnerHTML={{ __html: picture_id }} />
			)}
		</figure>
	);
}
