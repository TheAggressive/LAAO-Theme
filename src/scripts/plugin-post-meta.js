/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { PanelBody, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import isEqual from 'lodash/isEqual';

const MetaBlockField = () => {
	const postType = useSelect((select) => select('core/editor').getCurrentPostType());
	// get post id from the core/editor store
	const postId = useSelect((select) => select('core/editor').getCurrentPostId());
	const [meta, setMeta] = useEntityProp('postType', postType, 'acf', postId);
	const { isSaving, edited, saved } = useSelect((select) => {
		return {
			isSaving: select('core/editor').isSavingPost(),
			edited: select('core/editor').getEditedPostAttribute('acf'),
			saved: select('core/editor').getCurrentPostAttribute('acf'),
		};
	});

	console.log("postId", postId);
	console.log("meta", meta);



	// Save the ACF meta when the post is saved
	useEffect(() => {
		if (isSaving && !isEqual(edited, saved)) {
			return () =>
				apiFetch({
					path: `/wp/v2/${postType}/${postId}`,
					method: 'POST',
					data: {
						acf: {
							...meta,
						},
					},
				});
		}
	}, [isSaving]);

	return (
		<PanelBody>
			<TextControl
				label="Meta Block Field"
				value={meta['author'] || ''}
				onChange={(newValue) =>
					setMeta({
						...meta,
						['author']: newValue,
					})
				}
			/>
		</PanelBody>
	);
};

registerPlugin('plugin-sidebar-9ee4a6', {
	render: () => (
		<PluginDocumentSettingPanel
			name="custom-panel"
			title="Custom Panel"
			className="custom-panel">
			<MetaBlockField />
		</PluginDocumentSettingPanel>
	),
});
