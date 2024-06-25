wp.blocks.registerBlockVariation(
	'core/post-featured-image',
	{
		name: 'laao-post-featured-image',
		title: 'Post Featured Image + Caption',
		description: 'Displays the post\'s featured image with caption.',
		isActive: ['namespace'],
		attributes: {
			namespace: 'laao',
			className: 'laao-post-featured-image'
		},
		scope: ['inserter']
	}
);
