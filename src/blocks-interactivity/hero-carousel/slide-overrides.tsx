/**
 * Hero Carousel — per-slide Cover overrides (editor only).
 *
 * Adds per-slide attributes to core/cover plus a "Hero Slide" inspector panel
 * that appears only when the Cover sits inside a hero-carousel:
 *   - `aaHeroMotion` overrides the carousel-level background motion.
 *   - `aaHeroStart` / `aaHeroEnd` schedule a visibility window.
 * render.php reads these to override motion and to drop out-of-window slides.
 *
 * @package Laao
 */

import type { ComponentType } from 'react';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import {
	Button,
	DateTimePicker,
	Dropdown,
	PanelBody,
	SelectControl,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { calendar } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import { HERO_MOTION_OVERRIDE_OPTIONS } from './motion';

const PARENT_BLOCK = 'laao/hero-carousel';

type CoverHeroAttributes = {
	aaHeroMotion?: string;
	/** @deprecated Read-only fallback for content saved before the rename. */
	aaHeroKenBurns?: string;
	aaHeroStart?: string;
	aaHeroEnd?: string;
	[key: string]: unknown;
};

interface BlockRegistrationSettings {
	attributes?: Record<string, unknown>;
	[key: string]: unknown;
}

function toLocalDateTimeValue(value: string): string {
	if (!value) {
		return '';
	}

	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) {
		return value.slice(0, 16);
	}

	const pad = (part: number): string => String(part).padStart(2, '0');

	return [
		date.getFullYear(),
		'-',
		pad(date.getMonth() + 1),
		'-',
		pad(date.getDate()),
		'T',
		pad(date.getHours()),
		':',
		pad(date.getMinutes()),
	].join('');
}

function formatScheduleSummary(value: string, emptyLabel: string): string {
	if (!value) {
		return emptyLabel;
	}

	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) {
		return __('Invalid date', 'laao');
	}

	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date);
}

interface ScheduleDateTimeControlProps {
	label: string;
	help: string;
	value: string;
	emptyLabel: string;
	clearLabel: string;
	onChange: (value: string) => void;
}

function ScheduleDateTimeControl({
	label,
	help,
	value,
	emptyLabel,
	clearLabel,
	onChange,
}: ScheduleDateTimeControlProps) {
	return (
		<div className="laao-hero-schedule-control">
			<div className="laao-hero-schedule-control__row">
				<span className="components-base-control__label laao-hero-schedule-control__label">
					{label}
				</span>
				<Dropdown
					className="laao-hero-schedule-control__dropdown"
					contentClassName="laao-hero-schedule-popover"
					expandOnMobile
					headerTitle={label}
					popoverProps={{ placement: 'left-start' }}
					renderToggle={({ isOpen, onToggle }) => (
						<Button
							className="laao-hero-schedule-control__toggle"
							icon={calendar}
							onClick={onToggle}
							variant="secondary"
							aria-expanded={isOpen}
							aria-haspopup="dialog"
						>
							<span className="laao-hero-schedule-control__toggle-text">
								{formatScheduleSummary(value, emptyLabel)}
							</span>
						</Button>
					)}
					renderContent={({ onClose }) => (
						<div className="laao-hero-schedule-popover__inner">
							<DateTimePicker
								currentDate={value || new Date().toISOString()}
								onChange={(nextValue: string | null) =>
									onChange(
										toLocalDateTimeValue(nextValue ?? '')
									)
								}
								dateOrder="mdy"
								is12Hour={true}
							/>
							<div className="laao-hero-schedule-popover__actions">
								{value && (
									<Button
										variant="tertiary"
										onClick={() => onChange('')}
									>
										{clearLabel}
									</Button>
								)}
								<Button variant="primary" onClick={onClose}>
									{__('Done', 'laao')}
								</Button>
							</div>
						</div>
					)}
				/>
			</div>
			<p className="components-base-control__help">{help}</p>
		</div>
	);
}

/** Register the per-slide attribute on core/cover only. */
addFilter(
	'blocks.registerBlockType',
	'laao/hero-slide-attributes',
	(settings: BlockRegistrationSettings, name: string) => {
		if (name !== 'core/cover') {
			return settings;
		}
		return {
			...settings,
			attributes: {
				...(settings.attributes ?? {}),
				aaHeroMotion: { type: 'string', default: '' },
				// Kept registered so previously saved Cover attrs still hydrate.
				aaHeroKenBurns: { type: 'string', default: '' },
				aaHeroStart: { type: 'string', default: '' },
				aaHeroEnd: { type: 'string', default: '' },
			},
		};
	}
);

const withHeroSlideControls = createHigherOrderComponent(
	(BlockEdit: ComponentType<BlockEditProps<CoverHeroAttributes>>) => {
		const WithHeroSlideControls = (
			props: BlockEditProps<CoverHeroAttributes> & { name: string }
		) => {
			const isHeroSlide = useSelect(
				(select) => {
					if (props.name !== 'core/cover') {
						return false;
					}
					const { getBlockParentsByBlockName } = select(
						blockEditorStore
					) as {
						getBlockParentsByBlockName: (
							clientId: string,
							blockName: string
						) => string[];
					};
					return (
						getBlockParentsByBlockName(props.clientId, PARENT_BLOCK)
							.length > 0
					);
				},
				[props.clientId, props.name]
			);

			if (!isHeroSlide) {
				return <BlockEdit {...props} />;
			}

			const { attributes, setAttributes } = props;
			const motionValue =
				attributes.aaHeroMotion || attributes.aaHeroKenBurns || '';

			return (
				<>
					<BlockEdit {...props} />
					<InspectorControls>
						<PanelBody
							title={__('Hero Slide', 'laao')}
							initialOpen={false}
						>
							<SelectControl<string>
								label={__(
									'Background motion (this slide)',
									'laao'
								)}
								help={__(
									'Override the carousel background animation for just this slide.',
									'laao'
								)}
								value={motionValue}
								options={HERO_MOTION_OVERRIDE_OPTIONS}
								onChange={(value) =>
									setAttributes({
										aaHeroMotion: value,
										// Clear legacy key so the next save drops it.
										aaHeroKenBurns: '',
									})
								}
								__next40pxDefaultSize
								__nextHasNoMarginBottom
							/>
							<ScheduleDateTimeControl
								label={__('Show from', 'laao')}
								help={__(
									'Optional. Hide this slide before this time (site timezone).',
									'laao'
								)}
								value={attributes.aaHeroStart ?? ''}
								emptyLabel={__('No start time', 'laao')}
								clearLabel={__('Clear start time', 'laao')}
								onChange={(value) =>
									setAttributes({ aaHeroStart: value })
								}
							/>
							<ScheduleDateTimeControl
								label={__('Show until', 'laao')}
								help={__(
									'Optional. Hide this slide from this time onward (site timezone).',
									'laao'
								)}
								value={attributes.aaHeroEnd ?? ''}
								emptyLabel={__('No end time', 'laao')}
								clearLabel={__('Clear end time', 'laao')}
								onChange={(value) =>
									setAttributes({ aaHeroEnd: value })
								}
							/>
						</PanelBody>
					</InspectorControls>
				</>
			);
		};
		WithHeroSlideControls.displayName = 'WithHeroSlideControls';
		return WithHeroSlideControls;
	},
	'withHeroSlideControls'
);

addFilter(
	'editor.BlockEdit',
	'laao/hero-slide-controls',
	withHeroSlideControls
);
