/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { Panel, PanelBody, PanelRow, TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

const MetaBlockField = () => {
	const postType = useSelect((select) => select('core/editor').getCurrentPostType());
	// get post id from the core/editor store
	const postId = useSelect((select) => select('core/editor').getCurrentPostId());
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta', postId);

	return (
		<>
			<Panel title="Meta Block">
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
			</Panel>
			<Panel title="Meta Block 2">
				<PanelBody>
					<PanelRow>My Panel Inputs and Labels</PanelRow>
					<RichText
						tagName="p"
						value={meta['picture_id'] || ''}
						allowedFormats={['core/bold', 'core/italic']}
						onChange={(newValue) =>
							setMeta({
								...meta,
								['author']: newValue,
							})
						}
						placeholder={__('Heading...')}
					/>
				</PanelBody>
			</Panel>
		</>
	);
};

registerPlugin('plugin-sidebar-9ee4a6', {
	render: () => (
		<PluginDocumentSettingPanel
			name="editiorial-options"
			title="Editorial Options"
			className="editorial-options">
			<MetaBlockField />
		</PluginDocumentSettingPanel>
	),
});
