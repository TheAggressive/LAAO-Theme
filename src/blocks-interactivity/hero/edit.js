import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import './editor.css';

export default function Edit() {
	const blockProps = useBlockProps();
	const innerBlockProps = useInnerBlocksProps(
		{
			...blockProps,
			className: `${blockProps.className} wp-block-laao-hero-content`,
		},
		{
			allowedBlocks: [
				'adsanity/ad-group',
				'laao/site-logo',
				'core/group',
				'core/paragraph',
			],
			template: [['core/paragraph']],
			templateLock: false,
		}
	);

	// return only the featured image src url and the post content

	const posts = useSelect((select) => {
		const records = select('core').getEntityRecords(
			'postType',
			'hero-banners',
			{
				per_page: 1,
				_embed: true,
			}
		);

		if (!records) {
			return [];
		}

		return records.map((post) => ({
			image: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
			content: post.content?.rendered || '',
		}));
	});

	return (
		<div {...blockProps}>
			<div {...innerBlockProps} />
			<div className="wp-block-laao-hero-slider">
				{posts.map((post, index) => (
					<div
						key={index}
						className="wp-block-laao-hero-slide"
						style={{ backgroundImage: `url(${post.image})` }}
					/>
				))}
			</div>
		</div>
	);
}
