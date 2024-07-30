import { registerBlockType } from '@wordpress/blocks';
import './editor.css';
import './style.css';

import metadata from './block.json';

import Edit from './edit';

registerBlockType(metadata, {
	edit: Edit,
});
