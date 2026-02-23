import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';

const DepartmentButton = memo(({ dept, isSelected, onSelect }: {
    dept: string;
    isSelected: boolean;
    onSelect: () => void;
}) => (
    <button
        onClick={onSelect}
        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${isSelected
            ? 'bg-primary-green/50 border-2 border-primary-green text-primary-green'
            : 'bg-primary-green border-2 border-transparent text-hunter hover:border-primary-green/30 hover:bg-primary-green hover:text-white'
            }`}
    >
        <div className="flex items-center justify-between">
            <span>{dept}</span>
            {isSelected && (
                <ChevronRight size={16} />
            )}
        </div>
    </button>
));
DepartmentButton.displayName = 'DepartmentButton';

export default DepartmentButton;
