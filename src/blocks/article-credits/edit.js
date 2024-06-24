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
import { useEntityProp } from '@wordpress/core-data';
/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit({ context }) {

	const [meta] = useEntityProp(
		'postType',
		context.postType,
		'meta',
		context.postId
	);

	const { author, by_options, photo_credits_types, photo_credit_belongs_to, location, hair_by, make_up_by, grooming_by } = meta;

	return (
		<ul {...useBlockProps()}>
			{author && by_options && (<li>{by_options} {author}</li>)}
			{photo_credits_types && photo_credit_belongs_to && (<li>{photo_credits_types} {photo_credit_belongs_to}</li>)}
			{location && (<li>Location {location}</li>)}
			{hair_by && (<li>Hair By {hair_by}</li>)}
			{make_up_by && (<li>Makeup By {make_up_by}</li>)}
			{grooming_by && (<li>Grooming By {grooming_by}</li>)}
		</ul>
	);
}
