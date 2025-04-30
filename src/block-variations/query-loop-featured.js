import { registerBlockVariation } from '@wordpress/blocks';

registerBlockVariation('core/query', {
	name: 'featured-multi-posttype',
	title: 'Featured Content',
	description: 'Shows posts tagged "featured" from multiple post types.',
	icon: 'star-filled',
	scope: ['inserter'],
	attributes: {
		query: {
			perPage: 4,
			tag: 'featured',
			postType: [
				'cover',
				'arts',
				'theatre',
				'film',
				'television',
				'extra',
				'music',
				'spotlight',
				'dining',
			], // adjust as needed
			order: 'desc',
			orderBy: 'date',
		},
		displayLayout: {
			type: 'list',
		},
	},
	isActive: (attrs) =>
		attrs.query?.tag === 'featured' &&
		Array.isArray(attrs.query?.postType) &&
		attrs.query.postType.length > 1,
	template: [
		['core/post-title', {}],
		['core/post-excerpt', {}],
	],
	templateLock: false,
});
