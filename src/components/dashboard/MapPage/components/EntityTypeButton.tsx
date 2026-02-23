import React, { memo } from 'react';

const EntityTypeButton = memo(({ type, isSelected, onSelect }: {
    type: { value: string; label: string; icon: string };
    isSelected: boolean;
    onSelect: () => void;
}) => {
    let IconComponent;
    try {
        const iconMap = {
            'Globe': () => require('lucide-react').Globe,
            'Building2': () => require('lucide-react').Building2,
            'Users': () => require('lucide-react').Users,
            'Vote': () => require('lucide-react').Vote,
            'MapPin': () => require('lucide-react').MapPin,
        };
        IconComponent = (iconMap[type.icon as keyof typeof iconMap] || (() => null))();
    } catch {
        IconComponent = null;
    }

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${isSelected
                ? 'bg-primary-green/50 border-2 border-primary-green text-primary-green'
                : 'bg-primary-green border-2 border-transparent text-hunter hover:border-primary-green/30 hover:bg-primary-green hover:text-white'
                }`}
        >
            <div className="flex items-center gap-3">
                {IconComponent && <IconComponent size={18} />}
                <span>{type.label}</span>
            </div>
        </button>
    );
});
EntityTypeButton.displayName = 'EntityTypeButton';

export default EntityTypeButton;
