/**
 * PresetPicker — shared "Quick Presets" tile grid for block inspectors.
 *
 * Used by the Parallax and Animate On Scroll blocks so both present the
 * same UI: a 2-column grid of name-only tiles (descriptions in
 * tooltips), an accent ring + check on the preset matching the current
 * settings, and an optional quiet Reset link in the header.
 *
 * Styles live in editor-shared/editor.css (imported by each block's
 * editor.css). This UI renders in the editor chrome (sidebar), so it
 * uses WordPress admin component conventions, not theme tokens.
 *
 * @package Laao
 */

import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check, Icon } from '@wordpress/icons';

export interface PresetTile<T> {
	key: string;
	name: string;
	/** Shown as a tooltip on the tile. */
	description?: string;
	/** The attribute/settings patch this preset applies. */
	value: T;
}

interface PresetPickerProps<T> {
	/** Header label; defaults to "Quick Presets". */
	label?: string;
	presets: Array<PresetTile<T>>;
	/** Key of the preset matching current settings (see preset-match.ts). */
	activeKey?: string | null;
	onApply: (preset: PresetTile<T>) => void;
	/** Renders a quiet Reset link in the header when provided. */
	onReset?: () => void;
}

export function PresetPicker<T>({
	label = __('Quick Presets', 'laao'),
	presets,
	activeKey = null,
	onApply,
	onReset,
}: PresetPickerProps<T>) {
	return (
		<div className="laao-preset-picker">
			<div className="laao-preset-picker__header">
				<span className="laao-preset-picker__label">{label}</span>
				{onReset && (
					<Button
						variant="link"
						size="small"
						className="laao-preset-picker__reset"
						onClick={onReset}
					>
						{__('Reset', 'laao')}
					</Button>
				)}
			</div>
			<div
				className="laao-preset-picker__grid"
				role="group"
				aria-label={label}
			>
				{presets.map((preset) => {
					const isActive = preset.key === activeKey;
					return (
						<Button
							key={preset.key}
							className={
								isActive
									? 'laao-preset-picker__tile is-active'
									: 'laao-preset-picker__tile'
							}
							aria-pressed={isActive}
							label={preset.description}
							showTooltip={Boolean(preset.description)}
							onClick={() => onApply(preset)}
						>
							<span className="laao-preset-picker__name">
								{preset.name}
							</span>
							{isActive && (
								<Icon
									icon={check}
									size={16}
									className="laao-preset-picker__check"
								/>
							)}
						</Button>
					);
				})}
			</div>
		</div>
	);
}
