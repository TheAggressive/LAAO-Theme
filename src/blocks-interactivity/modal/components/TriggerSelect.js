const TriggerSelect = ({ currentValue, availableTriggers = [], onSelect }) => (
    <SelectControl
        value={currentValue}
        options={[
            { label: 'Select a block...', value: '' },
            ...availableTriggers.map(({ clientId, label }) => ({
                label,
                value: clientId // Use clientId as value
            }))
        ]}
        onChange={onSelect}
    />
);
