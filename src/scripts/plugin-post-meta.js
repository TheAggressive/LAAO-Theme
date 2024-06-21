/**
 * WordPress dependencies
 */
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, PanelRow, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';

const AttachmentImage = ({ imageId, size = 'full' }) => {

	const { image } = useSelect((select) => ({
		image: select('core').getMedia(imageId),
	}));

	const imageAttributes = () => {
		let attributes = {
			src: image.source_url,
			alt: image.alt_text,
			className: `attachment-${size} size-${size}`,
			width: image.media_details.width,
			height: image.media_details.height,
		};
		if (image.media_details && image.media_details.sizes && image.media_details.sizes[size]) {
			attributes.src = image.media_details.sizes[size].source_url;
			attributes.width = image.media_details.sizes[size].width;
			attributes.height = image.media_details.sizes[size].height;
		}

		return attributes;
	};

	return (
		<>
			{image && (
				<img {...imageAttributes()} />
			)}
		</>
	)
}

const MetaBlockField = () => {
	const postType = useSelect((select) => select('core/editor').getCurrentPostType());
	// get post id from the core/editor store
	const postId = useSelect((select) => select('core/editor').getCurrentPostId());
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta', postId);
	const { image } = useSelect((select) => ({
		image: select('core').getMedia(meta['location']),
	}));

	console.log('image', image);
	console.log('location', meta['location']);

	return (
		<>
			<PanelRow>
				<TextControl
					label="Meta Block Field"
					value={meta['author'] || ''}
					onChange={(newValue) =>
						setMeta({
							...meta,
							['author']: newValue,
						})
					}
				/>
			</PanelRow>
			<PanelRow>
				{image ? (
					<>
						<AttachmentImage imageId={meta['location']} size='medium' />
						<Button onClick={() => setMeta(
							{
								...meta,
								['location']: '',
							}
						)} isSecondary>
							Remove Image
						</Button>
					</>
				) : (
					<MediaUploadCheck>
						<MediaUpload
							onSelect={(media) => setMeta({
								...meta,
								['location']: media.id.toString(),
							})}
							allowedTypes={['image']}
							value={meta['location'] || null}
							render={({ open }) => (
								<Button onClick={open} isPrimary>
									Upload Image
								</Button>
							)}
						/>
					</MediaUploadCheck>
				)
				}
			</PanelRow>
		</>
	);
};

registerPlugin('plugin-sidebar-9ee4a6', {
	render: () => (
		<PluginDocumentSettingPanel
			name="eEditorial-options"
			title="Editorial Options"
			className="editorial-options">
			<MetaBlockField />
		</PluginDocumentSettingPanel>
	),
});
