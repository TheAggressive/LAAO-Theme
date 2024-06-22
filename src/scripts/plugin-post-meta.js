/**
 * WordPress dependencies
 */
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, PanelRow, SelectControl, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
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

const AuthorField = () => {
	const postType = useSelect((select) => select('core/editor').getCurrentPostType());
	const postId = useSelect((select) => select('core/editor').getCurrentPostId());
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta', postId);
	return (
		<PluginDocumentSettingPanel
			name="author-options"
			title={__('Author Options', 'laao')}
			className="author-options">
			<PanelRow>
				<SelectControl
					label="Credits"
					value={meta['by_options'] || 'Please Select'}
					options={[
						{ label: 'Please Select', value: 'Please Select' },
						{ label: 'By', value: 'By' },
						{ label: 'Story / Photo By', value: 'Story / Photo By' },
						{ label: 'Story / Photos By', value: 'Story / Photos By' },
					]}
					onChange={(value) => setMeta({
						...meta,
						['by_options']: value,
					})}
					__nextHasNoMarginBottom
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					value={meta['author'] || ''}
					label={__('Author', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							['author']: value,
						})
					}
				/>
			</PanelRow>
		</PluginDocumentSettingPanel>
	);
};

const ImageFields = () => {
	const postType = useSelect((select) => select('core/editor').getCurrentPostType());
	// get post id from the core/editor store
	const postId = useSelect((select) => select('core/editor').getCurrentPostId());
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta', postId);
	const { image } = useSelect((select) => ({
		image: select('core').getMedia(meta['location']),
	}));

	return (
		<PluginDocumentSettingPanel
			name="image-options"
			title={__('Image Options', 'laao')}
			className="image-options">
			{image ? (
				<>
					<PanelRow>
						<AttachmentImage imageId={meta['location']} onClick={{ open }} size='medium' />
					</PanelRow>
					<PanelRow>
						<Button variant='secondary' isDestructive onClick={() => setMeta(
							{
								...meta,
								['location']: '',
							}
						)} >
							{__('Remove Image', 'laao')}
						</Button>
					</PanelRow>
				</>
			) : (
				<PanelRow>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={(media) => setMeta({
								...meta,
								['location']: media.id.toString(),
							})}
							allowedTypes={['image']}
							value={meta['location'] || null}
							render={({ open }) => (
								<Button variant='primary' onClick={open}>
									{__('Upload Image', 'laao')}
								</Button>
							)}
						/>
					</MediaUploadCheck>
				</PanelRow>
			)
			}
		</PluginDocumentSettingPanel>
	);

};

registerPlugin('laao-author-options', {
	render: () => (
		<>
			<AuthorField />
		</>
	),
});

registerPlugin('laao-image-options', {
	render: () => (
		<>
			<ImageFields />
		</>
	),
});
