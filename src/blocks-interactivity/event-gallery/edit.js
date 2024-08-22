import { BlockControls, BlockIcon, MediaPlaceholder, MediaUpload, MediaUploadCheck, useBlockProps } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
	const hasImages = attributes.images.length > 0;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<MediaUploadCheck>
						<MediaUpload
							multiple
							gallery
							addToGallery={true}
							onSelect={(newImages) => setAttributes({ images: newImages })}
							allowedTypes={['image']}
							value={attributes.images.map((image) => image.id)}
							render={({ open }) => <ToolbarButton onClick={open}>{__('Edit Gallery', 'scrollable-gallery')}</ToolbarButton>}
						/>
					</MediaUploadCheck>
				</ToolbarGroup>
			</BlockControls>
			{hasImages && (
				<div {...useBlockProps()} className={`wp-block-event-gallery has-event-gallery-images-${attributes.images.length}`}>
					{attributes.images.map((image, index) => {
						return (
							<figure key={image.id} className='wp-block-event-gallery-item'>
								<img className={`wp-image-${image.id}`} key={index} loading='lazy' data-link={image.link} data-id={image.id} src={image.sizes.full.url} />
							</figure>
						);
					})}
				</div>
			)}
			{!hasImages && (
				<MediaPlaceholder
					multiple
					gallery
					allowedTypes={['image']}
					icon={<BlockIcon icon='format-gallery' />}
					labels={{
						title: 'Scrollable Gallery',
						instructions: 'Create an awesome scrollable gallery.',
					}}
					onSelect={(newImages) => setAttributes({ images: newImages })}
				/>
			)}
		</>
	);
}
