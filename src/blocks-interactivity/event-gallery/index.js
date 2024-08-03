import { registerBlockType } from '@wordpress/blocks';
import './editor.css';
import './style.css';

import metadata from './block.json';

import Edit from './edit';
import Save from './save';

registerBlockType(metadata, {
	edit: Edit,
	save: Save
});
