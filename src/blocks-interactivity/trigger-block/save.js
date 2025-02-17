import { MODAL_ID_ATTR } from '../modal/constants';

export default function save({ attributes }) {
    return (
        <div
            {...useBlockProps.save()}
            data-modal-persistent-id={attributes[MODAL_ID_ATTR] || ''}
        >
            {/* Block content */}
        </div>
    );
}
