import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.css';

export default function Edit({ attributes, setAttributes }) {
	const { numberOfSlides, transitionDuration } = attributes;
	const [images, setImages] = useState([]);

	const posts = useSelect((select) => {
		return select('core').getEntityRecords('postType', 'hero-banners', {
			per_page: numberOfSlides,
		});
	});

	console.log('posts', posts);

	useEffect(() => {
		if (!posts) {
			return;
		}

		const fetchImages = async () => {
			const imagePromises = posts
				.filter((post) => post.featured_media)
				.map((post) =>
					wp.apiRequest({
						path: `/wp/v2/media/${post.featured_media}`,
					})
				);

			const fetchedImages = await Promise.all(imagePromises);
			setImages(fetchedImages.map((img) => img.source_url));
		};

		console.log('fetching images', images);

		fetchImages();
	}, [posts]);

	return (
		<div {...useBlockProps()}>
			<InspectorControls>
				<PanelBody title={__('Slider Settings', 'kenburns-slider')}>
					<RangeControl
						label={__('Number of Slides', 'kenburns-slider')}
						value={numberOfSlides}
						onChange={(value) =>
							setAttributes({ numberOfSlides: value })
						}
						min={1}
						max={10}
					/>
					<RangeControl
						label={__(
							'Transition Duration (ms)',
							'kenburns-slider'
						)}
						value={transitionDuration}
						onChange={(value) =>
							setAttributes({ transitionDuration: value })
						}
						min={1000}
						max={10000}
						step={500}
					/>
				</PanelBody>
			</InspectorControls>

			<div className="kenburns-slider">
				{images.map((url, index) => (
					<div
						key={index}
						className="kenburns-slide"
						style={{ backgroundImage: `url(${url})` }}
					/>
				))}
			</div>
		</div>
	);
}
