wp.blocks.registerBlockVariation(
	'core/post-featured-image',
	{
		name: 'laao-featured-image-something',
		title: 'Post Featured Image + Caption something else',
		description: 'Displays the post\'s featured image with caption.',
		isActive: ['namespace'],
		attributes: {
			namespace: 'laao',
			className: 'laao-post-featured-image'
		},
		scope: ['inserter']
	}
);
