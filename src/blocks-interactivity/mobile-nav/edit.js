import { useBlockProps } from '@wordpress/block-editor';

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

export default function Edit({ attributes, setAttributes }) {
	const blockProps = useBlockProps();

	return (
		<button {...blockProps}>
			<MenuIcon />
		</button>
	);
}
