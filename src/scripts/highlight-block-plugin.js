/**
 * WordPress dependencies
 */
import { DateTimePicker, PanelRow, Button } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { format } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';

const EDITORIAL_POST_TYPES = [
	'cover',
	'arts',
	'theatre',
	'film',
	'television',
	'extra',
	'music',
	'spotlight',
	'dining',
	'events',
];

const META_START = 'highlight_start_date';
const META_END = 'highlight_end_date';

const pad = (n) => String(n).padStart(2, '0');

const getDefaultDate = (hours, minutes, seconds) => {
	const today = format('Y-m-d');
	return `${today}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const toISO = (mysql) => (mysql ? mysql.replace(' ', 'T') : null);
const toMySQL = (iso) => (iso ? iso.replace('T', ' ').slice(0, 19) : '');

const labelStyle = {
	fontWeight: '600',
	marginBottom: '4px',
	fontSize: '12px',
	textTransform: 'uppercase',
};

const DateField = ({ label, value, onChange }) => (
	<PanelRow>
		<div style={{ width: '100%' }}>
			<p style={labelStyle}>{label}</p>
			<DateTimePicker
				currentDate={value}
				onChange={(v) => v && onChange(v)}
				is12Hour
			/>
		</div>
	</PanelRow>
);

const HighlightPanel = () => {
	const postType = useSelect((select) =>
		select('core/editor').getCurrentPostType()
	);
	const postId = useSelect((select) =>
		select('core/editor').getCurrentPostId()
	);

	const [meta, setMeta] = useEntityProp('postType', postType, 'meta', postId);

	if (!EDITORIAL_POST_TYPES.includes(postType)) {
		return null;
	}

	const startISO = toISO(meta?.[META_START]) || getDefaultDate(0, 0, 1);
	const endISO = toISO(meta?.[META_END]) || getDefaultDate(23, 59, 59);
	const hasSchedule = !!(meta?.[META_START] || meta?.[META_END]);

	return (
		<PluginDocumentSettingPanel
			name="highlight-schedule"
			icon={calendar}
			title={__('Highlight', 'laao')}
			className="highlight-schedule"
		>
			<p
				style={{
					fontSize: '12px',
					marginBottom: '12px',
					color: '#757575',
				}}
			>
				{hasSchedule
					? __(
							'This post is scheduled to appear in the Highlight section.',
							'laao'
						)
					: __(
							'Set a start and end date to feature this post in the Highlight section.',
							'laao'
						)}
			</p>

			<DateField
				label={__('Start', 'laao')}
				value={startISO}
				onChange={(v) => setMeta({ ...meta, [META_START]: toMySQL(v) })}
			/>
			<DateField
				label={__('End', 'laao')}
				value={endISO}
				onChange={(v) => setMeta({ ...meta, [META_END]: toMySQL(v) })}
			/>

			{hasSchedule && (
				<PanelRow>
					<Button
						variant="tertiary"
						isDestructive
						onClick={() =>
							setMeta({
								...meta,
								[META_START]: '',
								[META_END]: '',
							})
						}
						style={{ marginTop: '8px' }}
						__next40pxDefaultSize
					>
						{__('Clear Schedule', 'laao')}
					</Button>
				</PanelRow>
			)}
		</PluginDocumentSettingPanel>
	);
};

registerPlugin('laao-highlight-schedule', {
	render: () => <HighlightPanel />,
});
