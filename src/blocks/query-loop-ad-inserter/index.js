/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * All files containing `style` keyword are bundled together. The code used
 * gets applied both to the front of your site and to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './style.scss';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';
import Save from './save';

const queryInserterIcon = (
	<svg fill="#000000" width="800px" height="800px" viewBox="0 0 32 32" id="icon" xmlns="http://www.w3.org/2000/svg">
		<path d="M26,30H24V20H12V30H10V20a2.0021,2.0021,0,0,1,2-2H24a2.0021,2.0021,0,0,1,2,2Z" />
		<polygon points="5.17 16 2 19.17 3.411 20.589 8 16 3.42 11.42 2 12.83 5.17 16" />
		<path d="M24,14H12a2.0021,2.0021,0,0,1-2-2V2h2V12H24V2h2V12A2.0021,2.0021,0,0,1,24,14Z" />
		<rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" fillOpacity="0" width="32" height="32" />
	</svg>
);

/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
registerBlockType(metadata.name, {
	/**
	 * @see ./edit.js
	 */
	icon: queryInserterIcon,
	edit: Edit,
	save: Save,
});
