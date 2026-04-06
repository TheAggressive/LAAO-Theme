/**
 * WordPress dependencies
 */
import { PanelRow, SelectControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { image } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';

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

	return (
		<PluginDocumentSettingPanel
			name="image-credit-options"
			icon={image}
			title={__('Link To Page', 'laao')}
			className="image-credit-options"
		>
			<PanelRow>
				<SelectControl
					label={__('Page To Link:', 'laao')}
					value={meta.wh_link_to || 'Please Select'}
					options={[
						{ label: 'Please Select', value: 'Please Select' },
						{
							label: 'Cover',
							value: '/',
						},
						{
							label: 'Arts',
							value: '/arts',
						},
						{ label: 'Theatre', value: '/theatre' },
						{ label: 'Film', value: '/film' },
						{
							label: 'Television',
							value: '/television',
						},
						{
							label: 'Extra',
							value: '/extra',
						},
						{ label: 'Music', value: '/music' },
						{ label: 'Spotlight', value: '/spotlight' },
						{ label: 'Dining', value: '/dining' },
					]}
					onChange={(value) =>
						setMeta({
							...meta,
							wh_link_to: value,
						})
					}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
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
