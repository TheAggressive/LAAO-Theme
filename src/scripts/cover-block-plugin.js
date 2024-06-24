/**
 * WordPress dependencies
 */
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, PanelBody, PanelRow, ResponsiveWrapper } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { gallery } from '@wordpress/icons';

const getCurrentPostId = () => {
	return useSelect((select) => select('core/editor').getCurrentPostId());
};

const getCurrentPostType = () => {
	return useSelect((select) => select('core/editor').getCurrentPostType());
};

const CoverFields = () => {
	const [meta, setMeta] = useEntityProp('postType', getCurrentPostType(), 'meta', getCurrentPostId());
	const { image_1, image_2 } = useSelect((select) => ({
		image_1: select('core').getMedia(meta['photo_2']),
		image_2: select('core').getMedia(meta['photo_3']),
	}));

	return (
		<PluginDocumentSettingPanel
			name="cover-options"
			icon={gallery}
			title={__('Cover Images', 'laao')}
			className="cover-options">
			<PanelBody>
				<h2>{__('Cover Image #2:', 'laao')}</h2>
				<PanelRow>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={(media) => setMeta({
								...meta,
								['photo_2']: media.id.toString(),
							})}
							allowedTypes={['image']}
							value={meta['photo_2'] || ''}
							render={({ open }) => (
								<Button variant={image_1 ? 'link' : 'primary'} onClick={open}>
									{!image_1 ? __('Upload Image', 'laao') : (
										<ResponsiveWrapper naturalWidth={image_1.media_details.width} naturalHeight={image_1.media_details.height}>
											<img src={image_1.source_url} height={image_1.media_details.height} width={image_1.media_details.width} />
										</ResponsiveWrapper>
									)
									}
								</Button>
							)}
						/>
					</MediaUploadCheck>
				</PanelRow>
				{image_1 && (
					<PanelRow>
						<MediaUploadCheck>
							<MediaUpload
								title={__('Replace', 'laao')}
								value={meta['photo_2'] || ''}
								onSelect={(media) => setMeta({
									...meta,
									['photo_2']: media.id.toString(),
								})}
								allowedTypes={['image']}
								render={({ open }) => (
									<Button variant='secondary' onClick={open}>{__('Replace Image', 'laao')}</Button>
								)}
							/>
						</MediaUploadCheck>
						<Button variant='secondary' isDestructive onClick={() => setMeta(
							{
								...meta,
								['photo_2']: '',
							}
						)} >
							{__('Remove', 'laao')}
						</Button>
					</PanelRow>
				)}
			</PanelBody>
			<PanelBody>
				<h2>{__('Cover Image #3:', 'laao')}</h2>
				<PanelRow>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={(media) => setMeta({
								...meta,
								['photo_3']: media.id.toString(),
							})}
							allowedTypes={['image']}
							value={meta['photo_3'] || ''}
							render={({ open }) => (
								<Button variant={image_2 ? 'link' : 'primary'} onClick={open}>
									{!image_2 ? __('Upload Image', 'laao') : (
										<ResponsiveWrapper naturalWidth={image_2.media_details.width} naturalHeight={image_2.media_details.height}>
											<img src={image_2.source_url} height={image_2.media_details.height} width={image_2.media_details.width} />
										</ResponsiveWrapper>
									)
									}
								</Button>
							)}
						/>
					</MediaUploadCheck>
				</PanelRow>
				{image_2 && (
					<PanelRow>
						<MediaUploadCheck>
							<MediaUpload
								title={__('Replace', 'laao')}
								value={meta['photo_3'] || ''}
								onSelect={(media) => setMeta({
									...meta,
									['photo_3']: media.id.toString(),
								})}
								allowedTypes={['image']}
								render={({ open }) => (
									<Button variant='secondary' onClick={open}>{__('Replace Image', 'laao')}</Button>
								)}
							/>
						</MediaUploadCheck>
						<Button variant='secondary' isDestructive onClick={() => setMeta(
							{
								...meta,
								['photo_3']: '',
							}
						)} >
							{__('Remove', 'laao')}
						</Button>
					</PanelRow>
				)}
			</PanelBody>
		</PluginDocumentSettingPanel >
	);
};

registerPlugin('laao-cover-options', {
	render: () => (
		<>
			<CoverFields />
		</>
	),
});
