/**
 * WordPress dependencies
 */
import { PanelRow, TextControl } from '@wordpress/components';
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

const HairMakeupFields = () => {
	const [meta, setMeta] = useEntityProp('postType', getCurrentPostType(), 'meta', getCurrentPostId());
	return (
		<PluginDocumentSettingPanel
			name="hair-makeup-credits-options"
			title={__('Hair/Makeup Credits', 'laao')}
			className="hair-makeup-credits-options">
			<PanelRow>
				<TextControl
					value={meta['hair_by'] || ''}
					label={__('Hair Credited To:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							['hair_by']: value,
						})
					}
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					value={meta['make_up_by'] || ''}
					label={__('Makeup Credited To:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							['make_up_by']: value,
						})
					}
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					value={meta['grooming_by'] || ''}
					label={__('Grooming Credited To:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							['grooming_by']: value,
						})
					}
				/>
			</PanelRow>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin('laao-hair-makeup-options', {
	render: () => (
		<>
			<HairMakeupFields />
		</>
	),
});
