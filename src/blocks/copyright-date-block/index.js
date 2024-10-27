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
import './style.css';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';

const copyrightIcon = (
	<svg
		width="20px"
		height="20px"
		viewBox="0 0 24 24"
		fill="none"
		fillOpacity="0"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M14 9C13.5197 8.40081 12.93 8 12 8C10.0769 8 9 9.14286 9 12C9 14.8571 10.0769 16 12 16C12.93 16 13.5197 15.5992 14 15M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
			stroke="#000000"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
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
	icon: copyrightIcon,
	edit: Edit,
});
