/**
 * WordPress dependencies
 */
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, PanelRow, ResponsiveWrapper, SelectControl, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

const getCurrentPostId = () => {
	return useSelect((select) => select('core/editor').getCurrentPostId());
};

const getCurrentPostType = () => {
	return useSelect((select) => select('core/editor').getCurrentPostType());
};

const AuthorField = () => {
	const postId = useSelect((select) => select('core/editor').getCurrentPostId());
	const postType = useSelect((select) => select('core/editor').getCurrentPostType());
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta', postId);
	return (
		<PluginDocumentSettingPanel
			name="author-options"
			title={__('Author Options', 'laao')}
			className="author-options">
			<PanelRow>
				<SelectControl
					label={__('Author Credits', 'laao')}
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
					label={__('Author Name', 'laao')}
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
	const postId = useSelect((select) => select('core/editor').getCurrentPostId());
	const postType = useSelect((select) => select('core/editor').getCurrentPostType());
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta', postId);
	const { image } = useSelect((select) => ({
		image: select('core').getMedia(meta['location']),
	}));

	console.log(image);

	return (
		<PluginDocumentSettingPanel
			name="image-options"
			title={__('Image Options', 'laao')}
			className="image-options">
			<PanelRow>
				<MediaUploadCheck>
					<MediaUpload
						onSelect={(media) => setMeta({
							...meta,
							['location']: media.id.toString(),
						})}
						allowedTypes={['image']}
						value={meta['location'] || ''}
						render={({ open }) => (
							<Button variant={image ? 'link' : 'primary'} onClick={open}>
								{!image ? __('Upload Image', 'laao') : (
									<ResponsiveWrapper naturalWidth={image.media_details.width} naturalHeight={image.media_details.height}>
										<img src={image.source_url} height={image.media_details.height} width={image.media_details.width} />
									</ResponsiveWrapper>
								)
								}
							</Button>
						)}
					/>
				</MediaUploadCheck>
			</PanelRow>
			{image && (
				<PanelRow>
					<MediaUploadCheck>
						<MediaUpload
							title={__('Replace', 'laao')}
							value={meta['location'] || ''}
							onSelect={(media) => setMeta({
								...meta,
								['location']: media.id.toString(),
							})}
							allowedTypes={['image']}
							render={({ open }) => (
								<Button variant='secondary' onClick={open}>{__('Replace image', 'laao')}</Button>
							)}
						/>
					</MediaUploadCheck>
					<Button variant='secondary' isDestructive onClick={() => setMeta(
						{
							...meta,
							['location']: '',
						}
					)} >
						{__('Remove Image', 'laao')}
					</Button>
				</PanelRow>
			)}
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
