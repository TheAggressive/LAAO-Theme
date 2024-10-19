/**
 * WordPress dependencies
 */
import { PanelRow, SelectControl, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { commentAuthorAvatar } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';

const EditorialFields = () => {
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
			name="editorial-options"
			icon={commentAuthorAvatar}
			title={__('Editorial Credits', 'laao')}
			className="editorial-options"
		>
			<PanelRow>
				<SelectControl
					label={__('Credit Types:', 'laao')}
					value={meta.by_options || 'Please Select'}
					options={[
						{ label: 'Please Select', value: 'Please Select' },
						{ label: 'By', value: 'By' },
						{
							label: 'Story / Photo By',
							value: 'Story / Photo By',
						},
						{
							label: 'Story / Photos By',
							value: 'Story / Photos By',
						},
					]}
					onChange={(value) =>
						setMeta({
							...meta,
							by_options: value,
						})
					}
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					value={meta.author || ''}
					label={__('Author Name:', 'laao')}
					onChange={(value) =>
						setMeta({
							...meta,
							author: value,
						})
					}
				/>
			</PanelRow>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin('laao-editorial-options', {
	render: () => (
		<>
			<EditorialFields />
		</>
	),
});
