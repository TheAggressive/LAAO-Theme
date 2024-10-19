/**
 * WordPress dependencies
 */
import { PanelRow, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { mapMarker } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';

const LocationField = () => {
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
			name="location-options"
			icon={mapMarker}
			title={__('Location', 'laao')}
			className="location-options"
		>
			<PanelRow>
				<TextControl
					value={meta.location || ''}
					label={__('Location:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							location: value,
						})
					}
				/>
			</PanelRow>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin('laao-location-options', {
	render: () => (
		<>
			<LocationField />
		</>
	),
});
