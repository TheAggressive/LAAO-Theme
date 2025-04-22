/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { image } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';
import ContentEditable from '../components/ContentEditable';

const WHImageCreditFields = () => {
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

	const [pictureID, setPictureID] = useState(meta.wh_picture_id || null);

	const handleChange = (content) => {
		setPictureID(content);
	};

	useEffect(() => {
		setMeta({
			...meta,
			wh_picture_id: pictureID,
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
				{__('CAPTION:', 'laao')}
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

registerPlugin('laao-wh-image-credit-options', {
	render: () => (
		<>
			<WHImageCreditFields />
		</>
	),
});
