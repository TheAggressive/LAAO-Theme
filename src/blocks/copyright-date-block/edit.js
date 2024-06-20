/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes }) {
	const { showStartingYear, startingYear, companyName } = attributes;
	const currentYear = new Date().getFullYear().toString();

	let displayDate;

	if (showStartingYear && startingYear) {
		displayDate = startingYear + '–' + currentYear;
	} else {
		displayDate = currentYear;
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Settings', 'copyright-date-block')}>
					<ToggleControl
						checked={!!showStartingYear}
						label={__(
							'Show starting year',
							'laao'
						)}
						onChange={() =>
							setAttributes({
								showStartingYear: !showStartingYear,
							})
						}
					/>
					{showStartingYear && (
						<TextControl
							label={__(
								'Starting year',
								'laao'
							)}
							value={startingYear || ''}
							onChange={(value) =>
								setAttributes({ startingYear: value })
							}
						/>
					)}
					<TextControl
						label={__(
							'Company name',
							'laao'
						)}
						value={companyName || ''}
						onChange={(value) =>
							setAttributes({ companyName: value })
						}
					/>
				</PanelBody>
			</InspectorControls>
			<p {...useBlockProps()}>Copyright © {displayDate} {companyName}. All Rights Reserved. <a href="/terms">TERMS OF USE</a> <span>|</span> <a href="/privacy">PRIVACY POLICY</a></p>
		</>
	);
}
