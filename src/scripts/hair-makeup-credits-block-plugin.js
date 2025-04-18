/**
 * WordPress dependencies
 */
import { PanelRow, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';

const HairMakeupFields = () => {
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
			name="hair-makeup-credits-options"
			icon={seen}
			title={__('Hair/Makeup Credits', 'laao')}
			className="hair-makeup-credits-options"
		>
			<PanelRow>
				<TextControl
					value={meta.hair_by || ''}
					label={__('Hair Credited To:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							hair_by: value,
						})
					}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					value={meta.make_up_by || ''}
					label={__('Makeup Credited To:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							make_up_by: value,
						})
					}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					value={meta.grooming_by || ''}
					label={__('Grooming Credited To:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							grooming_by: value,
						})
					}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
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
