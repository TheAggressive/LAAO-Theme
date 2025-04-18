/**
 * WordPress dependencies
 */
import { PanelRow, SelectControl, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';
import ContentEditable from '../components/ContentEditable';

const ImageCreditFields = () => {
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

	const [pictureID, setPictureID] = useState(meta.picture_id || null);

	const handleChange = (content) => {
		setPictureID(content);
	};

	useEffect(() => {
		setMeta({
			...meta,
			picture_id: pictureID,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pictureID]);

	return (
		<PluginDocumentSettingPanel
			name="image-credit-options"
			icon={image}
			title={__('Image Credits', 'laao')}
			className="image-credit-options"
		>
			<PanelRow>
				<SelectControl
					label={__('Credit Types:', 'laao')}
					value={meta.photo_credits_types || 'Please Select'}
					options={[
						{ label: 'Please Select', value: 'Please Select' },
						{
							label: 'Photo Courtesy of',
							value: 'Photo Courtesy of',
						},
						{
							label: 'Photos Courtesy of',
							value: 'Photos Courtesy of',
						},
						{ label: 'Photo By', value: 'Photo By' },
						{ label: 'Photos By', value: 'Photos By' },
						{
							label: 'Graphic Courtesy of',
							value: 'Graphic Courtesy of',
						},
						{
							label: 'Graphics Courtesy of',
							value: 'Graphics Courtesy of',
						},
						{ label: 'Graphic By', value: 'Graphic By' },
						{ label: 'Graphics By', value: 'Graphics By' },
						{ label: 'Video By', value: 'Video By' },
						{ label: 'Videos By', value: 'Videos By' },
						{
							label: 'Video Courtesy of',
							value: 'Video Courtesy of',
						},
						{
							label: 'Videos Courtesy of',
							value: 'Videos Courtesy of',
						},
					]}
					onChange={(value) =>
						setMeta({
							...meta,
							photo_credits_types: value,
						})
					}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					value={meta.photo_credit_belongs_to || ''}
					label={__('Credit Belongs To:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							photo_credit_belongs_to: value,
						})
					}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</PanelRow>
			<label
				className="components-base-control__label"
				htmlFor="caption-id"
				style={{
					fontSize: '11px',
					paddingTop: '8px',
					display: 'block',
					fontWeight: '600',
				}}
			>
				{__('CAPTION ID:', 'laao')}
			</label>
			<PanelRow>
				<ContentEditable
					id="caption-id"
					initialContent={pictureID}
					onChange={handleChange}
				/>
			</PanelRow>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin('laao-image-credit-options', {
	render: () => (
		<>
			<ImageCreditFields />
		</>
	),
});
