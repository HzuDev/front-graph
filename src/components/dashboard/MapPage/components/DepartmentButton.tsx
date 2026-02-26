import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';

const DepartmentButton = memo(
  ({
    dept,
    isSelected,
    onSelect,
  }: {
    dept: string;
    isSelected: boolean;
    onSelect: () => void;
  }) => (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        isSelected
          ? 'bg-primary-green border-2 border-primary-green text-hunter shadow-md scale-[1.02]'
          : 'bg-primary-green/5 border-2 border-transparent text-primary-green hover:bg-primary-green/10 hover:border-primary-green/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{dept}</span>
        {isSelected && <ChevronRight size={16} />}
      </div>
    </button>
  )
);
DepartmentButton.displayName = 'DepartmentButton';

export default DepartmentButton;
