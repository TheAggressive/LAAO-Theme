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
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.css';

import {
	CheckboxControl,
	PanelBody,
	RangeControl,
	Spinner,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import ServerSideRender from '@wordpress/server-side-render';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @param  root0
 * @param  root0.attributes
 * @param  root0.setAttributes
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes }) {
	const { selectedPostTypes = [], postsPerPage = 4 } = attributes;
	const blockProps = useBlockProps();

	// Get post types from the core data store
	const { postTypes, isLoading } = useSelect((select) => {
		const { getPostTypes, isResolving } = select(coreStore);
		const queryArgs = { per_page: -1 };

		return {
			postTypes:
				getPostTypes(queryArgs)?.filter(
					(type) =>
						type.viewable &&
						type.slug !== 'attachment' &&
						type.slug !== 'wp_block'
				) || [],
			isLoading: isResolving('getPostTypes', [queryArgs]),
		};
	}, []);

	// Initialize selectedPostTypes with defaults if empty
	if (postTypes.length && selectedPostTypes.length === 0) {
		// Set default post types - exclude pages by default
		const defaultTypes = postTypes
			.filter((type) => type.slug !== 'page')
			.map((type) => type.slug);

		setAttributes({ selectedPostTypes: defaultTypes });
	}

	const togglePostType = (postType) => {
		const updatedTypes = selectedPostTypes.includes(postType)
			? selectedPostTypes.filter((type) => type !== postType)
			: [...selectedPostTypes, postType];

		setAttributes({ selectedPostTypes: updatedTypes });
	};

	return (
		<div {...blockProps}>
			<InspectorControls>
				<PanelBody title="Query Settings">
					<RangeControl
						label="Posts Per Page"
						value={postsPerPage}
						onChange={(val) => setAttributes({ postsPerPage: val })}
						min={1}
						max={12}
					/>

					<p>
						<strong>Post Types</strong>
					</p>
					{isLoading ? (
						<Spinner />
					) : (
						postTypes.map((type) => (
							<CheckboxControl
								key={type.slug}
								label={type.name}
								checked={selectedPostTypes.includes(type.slug)}
								onChange={() => togglePostType(type.slug)}
							/>
						))
					)}
				</PanelBody>
			</InspectorControls>

			<ServerSideRender
				block="laao/highlight-posts"
				attributes={attributes}
			/>
		</div>
	);
}
