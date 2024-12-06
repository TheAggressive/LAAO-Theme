import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const MenuIcon = () => {
	return (
		<svg
			width="36"
			height="36"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M3 12H21M3 6H21M3 18H21"
				stroke="#000000"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

const CloseIcon = () => {
	return (
		<svg
			viewBox="0 0 1024 1024"
			width="36"
			height="36"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path>
		</svg>
	);
};

export default function Edit({ attributes, setAttributes }) {
	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Animation Settings', 'laao')}
					initialOpen={true}
				>
					<SelectControl
						label={__('Display Icon', 'laao')}
						value={attributes.icon}
						options={[
							{
								label: __('Menu Icon', 'laao'),
								value: 'menuIcon',
							},
							{
								label: __('Close Icon', 'laao'),
								value: 'closeIcon',
							},
						]}
						onChange={(icon) => setAttributes({ icon })}
						help={__('Select the icon to be displayed.', 'laao')}
					/>
				</PanelBody>
			</InspectorControls>

			<button {...blockProps}>
				{attributes.icon === 'menuIcon' ? <MenuIcon /> : <CloseIcon />}
			</button>
		</>
	);
}
