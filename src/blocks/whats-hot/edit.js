/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

/**
 * Internal dependencies
 */
import './editor.css';

// Define allowed blocks for InnerBlocks
const ALLOWED_BLOCKS = ['laao/animate-on-scroll'];

// Template with animate-on-scroll block
const TEMPLATE = [['laao/animate-on-scroll', {}]];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block attributes.
 * @param {Object} props.setAttributes Function to set block attributes.
 * @return {Element}                   Element to render.
 */
export default function Edit({ attributes, setAttributes }) {
	const { numberOfPosts, displayFeaturedImage, displayCaption, useLinkMeta } =
		attributes;

	const blockProps = useBlockProps({
		className: 'whats-hot-block',
	});

	// Check if posts are loading
	const isLoading = useSelect(
		(select) => {
			return select(coreStore).isResolving('getEntityRecords', [
				'postType',
				'wh_cover',
				{ per_page: numberOfPosts, _embed: true },
			]);
		},
		[numberOfPosts]
	);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__("What's Hot Settings", 'whats-hot')}
					initialOpen={true}
				>
					<RangeControl
						label={__('Number of posts', 'whats-hot')}
						value={numberOfPosts}
						onChange={(value) =>
							setAttributes({ numberOfPosts: value })
						}
						min={1}
						max={8}
					/>
					<ToggleControl
						label={__('Display Featured Image', 'whats-hot')}
						checked={displayFeaturedImage}
						onChange={() =>
							setAttributes({
								displayFeaturedImage: !displayFeaturedImage,
							})
						}
					/>
					<ToggleControl
						label={__('Display Caption', 'whats-hot')}
						checked={displayCaption}
						onChange={() =>
							setAttributes({ displayCaption: !displayCaption })
						}
					/>
					<ToggleControl
						label={__(
							'Use Custom Link (wh_link_to meta)',
							'whats-hot'
						)}
						checked={useLinkMeta}
						onChange={() =>
							setAttributes({ useLinkMeta: !useLinkMeta })
						}
						help={__(
							'When enabled, links will use the wh_link_to post meta value instead of the post permalink',
							'whats-hot'
						)}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{isLoading ? (
					<p>Loading What&apos;s Hot posts...</p>
				) : (
					<ServerSideRender
						block="laao/whats-hot"
						attributes={attributes}
					/>
				)}

				<div className="whats-hot-inner-blocks">
					<h4>{__('Add Animation (Optional)', 'whats-hot')}</h4>
					<p className="whats-hot-helper-text">
						{__(
							"Add an animate-on-scroll block here to animate the What's Hot items.",
							'whats-hot'
						)}
					</p>
					<InnerBlocks
						allowedBlocks={ALLOWED_BLOCKS}
						template={TEMPLATE}
						templateLock={false}
					/>
				</div>
			</div>
		</>
	);
}
