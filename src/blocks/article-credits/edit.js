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
import './editor.css';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @param  root0
 * @param  root0.context
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

	const {
		author,
		by_options: byOptions,
		photo_credits_types: photoCreditsTypes,
		photo_credit_belongs_to: photoCreditBelongsTo,
		location,
		hair_by: hairBy,
		make_up_by: makeUpBy,
		grooming_by: groomingBy,
	} = meta;

	return (
		<ul {...useBlockProps()}>
			{author && byOptions && (
				<li>
					{byOptions} {author}
				</li>
			)}
			{photoCreditsTypes && photoCreditBelongsTo && (
				<li>
					{photoCreditsTypes} {photoCreditBelongsTo}
				</li>
			)}
			{location && <li>Location {location}</li>}
			{hairBy && <li>Hair By {hairBy}</li>}
			{makeUpBy && <li>Makeup By {makeUpBy}</li>}
			{groomingBy && <li>Grooming By {groomingBy}</li>}
		</ul>
	);
}
