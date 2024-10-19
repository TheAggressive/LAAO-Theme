/**
 * WordPress dependencies
 */
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	PanelRow,
	ResponsiveWrapper,
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { gallery } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';

const CoverFields = () => {
	const getCurrentPostId = useSelect((select) =>
		select('core/editor').getCurrentPostId()
	);

	const getCurrentPostType = useSelect((select) =>
		select('core/editor').getCurrentPostType()
	);

	const [meta, setMeta] = useEntityProp(
		'postType',
		getCurrentPostType,
		'meta',
		getCurrentPostId
	);

	const { image1, image2 } = useSelect((select) => ({
		image1: select('core').getMedia(meta.photo_2),
		image2: select('core').getMedia(meta.photo_3),
	}));

	return (
		<PluginDocumentSettingPanel
			name="cover-options"
			icon={gallery}
			title={__('Cover Images', 'laao')}
			className="cover-options"
		>
			<PanelBody>
				<h2>{__('Cover Image #2:', 'laao')}</h2>
				<PanelRow>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={(media) =>
								setMeta({
									...meta,
									photo_2: media.id.toString(),
								})
							}
							allowedTypes={['image']}
							value={meta.photo_2 || ''}
							render={({ open }) => (
								<Button
									variant={image1 ? 'link' : 'primary'}
									onClick={open}
								>
									{!image1 ? (
										__('Upload Image', 'laao')
									) : (
										<ResponsiveWrapper
											naturalWidth={
												image1.media_details.width
											}
											naturalHeight={
												image1.media_details.height
											}
										>
											<img
												src={image1.source_url}
												alt={image1.alt_text}
												height={
													image1.media_details.height
												}
												width={
													image1.media_details.width
												}
											/>
										</ResponsiveWrapper>
									)}
								</Button>
							)}
						/>
					</MediaUploadCheck>
				</PanelRow>
				{image1 && (
					<PanelRow>
						<MediaUploadCheck>
							<MediaUpload
								title={__('Replace', 'laao')}
								value={meta.photo_2 || ''}
								onSelect={(media) =>
									setMeta({
										...meta,
										photo_2: media.id.toString(),
									})
								}
								allowedTypes={['image']}
								render={({ open }) => (
									<Button variant="secondary" onClick={open}>
										{__('Replace Image', 'laao')}
									</Button>
								)}
							/>
						</MediaUploadCheck>
						<Button
							variant="secondary"
							isDestructive
							onClick={() =>
								setMeta({
									...meta,
									photo_2: '',
								})
							}
						>
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
							onSelect={(media) =>
								setMeta({
									...meta,
									photo_3: media.id.toString(),
								})
							}
							allowedTypes={['image']}
							value={meta.photo_3 || ''}
							render={({ open }) => (
								<Button
									variant={image2 ? 'link' : 'primary'}
									onClick={open}
								>
									{!image2 ? (
										__('Upload Image', 'laao')
									) : (
										<ResponsiveWrapper
											naturalWidth={
												image2.media_details.width
											}
											naturalHeight={
												image2.media_details.height
											}
										>
											<img
												src={image2.source_url}
												alt={image2.alt_text}
												height={
													image2.media_details.height
												}
												width={
													image2.media_details.width
												}
											/>
										</ResponsiveWrapper>
									)}
								</Button>
							)}
						/>
					</MediaUploadCheck>
				</PanelRow>
				{image2 && (
					<PanelRow>
						<MediaUploadCheck>
							<MediaUpload
								title={__('Replace', 'laao')}
								value={meta.photo_3 || ''}
								onSelect={(media) =>
									setMeta({
										...meta,
										photo_3: media.id.toString(),
									})
								}
								allowedTypes={['image']}
								render={({ open }) => (
									<Button variant="secondary" onClick={open}>
										{__('Replace Image', 'laao')}
									</Button>
								)}
							/>
						</MediaUploadCheck>
						<Button
							variant="secondary"
							isDestructive
							onClick={() =>
								setMeta({
									...meta,
									photo_3: '',
								})
							}
						>
							{__('Remove', 'laao')}
						</Button>
					</PanelRow>
				)}
			</PanelBody>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin('laao-cover-options', {
	render: () => (
		<>
			<CoverFields />
		</>
	),
});
