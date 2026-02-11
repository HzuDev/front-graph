import React, { memo } from 'react';
import { X } from 'lucide-react';

const ClearFiltersButton = memo(({ onClear }: { onClear: () => void }) => (
    <button
        onClick={onClear}
        className="text-xs font-bold text-primary-green/60 hover:text-primary-green flex items-center gap-1"
    >
        <X size={12} />
        Limpiar filtros
    </button>
));
ClearFiltersButton.displayName = 'ClearFiltersButton';

export default ClearFiltersButton;
