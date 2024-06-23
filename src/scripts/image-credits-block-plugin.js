/**
 * WordPress dependencies
 */
import { PanelRow, SelectControl, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

const getCurrentPostId = () => {
	return useSelect((select) => select('core/editor').getCurrentPostId());
};

const getCurrentPostType = () => {
	return useSelect((select) => select('core/editor').getCurrentPostType());
};

const ImageCreditFields = () => {
	const [meta, setMeta] = useEntityProp('postType', getCurrentPostType(), 'meta', getCurrentPostId());
	const [pictureID, setPictureID] = useState(meta['picture_id'] || 'Caption ID Here...');
	const ref = useRef(null);


	console.log(meta['picture_id']);

	useEffect(() => {
		console.log(pictureID);

		setMeta({
			...meta,
			['picture_id']: pictureID,
		});

	}, [pictureID]);

	return (
		<PluginDocumentSettingPanel
			name="image-credit-options"
			title={__('Image Credits', 'laao')}
			className="image-credit-options">
			<PanelRow>
				<SelectControl
					label={__('Credit Types:', 'laao')}
					value={meta['photo_credits_types'] || 'Please Select'}
					options={[
						{ label: 'Please Select', value: 'Please Select' },
						{ label: 'Photo Courtesy of', value: 'Photo Courtesy of' },
						{ label: 'Photos Courtesy of', value: 'Photos Courtesy of' },
						{ label: 'Photo By', value: 'Photo By' },
						{ label: 'Photos By', value: 'Photos By' },
						{ label: 'Graphic Courtesy of', value: 'Graphic Courtesy of' },
						{ label: 'Graphics Courtesy of', value: 'Graphics Courtesy of' },
						{ label: 'Graphic By', value: 'Graphic By' },
						{ label: 'Graphics By', value: 'Graphics By' },
						{ label: 'Video By', value: 'Video By' },
						{ label: 'Videos By', value: 'Videos By' },
						{ label: 'Video Courtesy of', value: 'Video Courtesy of' },
						{ label: 'Videos Courtesy of', value: 'Videos Courtesy of' },
					]}
					onChange={(value) => setMeta({
						...meta,
						['photo_credits_types']: value,
					})}
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					value={meta['photo_credit_belongs_to'] || ''}
					label={__('Credit Belongs To:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							['photo_credit_belongs_to']: value,
						})
					}
				/>
			</PanelRow>
			<label>Format Text:</label>
			<PanelRow>
				<div ref={ref} dangerouslySetInnerHTML={{ __html: pictureID }} contentEditable onInput={(event) => setPictureID(event.target.innerHTML)} />
			</PanelRow>
		</PluginDocumentSettingPanel >
	);
};

registerPlugin('laao-image-credit-options', {
	render: () => (
		<>
			<ImageCreditFields />
		</>
	),
});
