import { memo } from 'react';
import { X } from 'lucide-react';

const ClearFiltersButton = memo(({ onClear }: { onClear: () => void }) => (
    <button
        onClick={onClear}
        className="text-xs font-bold text-emerald-500/60 hover:text-emerald-400 flex items-center gap-1"
    >
        <X size={12} />
        Limpiar filtros
    </button>
));
ClearFiltersButton.displayName = 'ClearFiltersButton';

export default ClearFiltersButton;
