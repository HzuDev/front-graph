import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { buildPath } from '../../../../lib/utils/paths';
import type { Entity } from '../../../../lib/queries';

const ResultEntityCard = memo(({ entity, isSelected, onSelect }: {
    entity: Entity;
    isSelected: boolean;
    onSelect: () => void;
}) => (
    <button
        type="button"
        onClick={onSelect}
        className={`bg-white border p-4 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${isSelected
            ? 'border-primary-green shadow-md'
            : 'border-primary-green/5 hover:border-primary-green/20'
            }`}
    >
        <h4 className="font-bold text-sm mb-1 leading-tight">
            {entity.label || 'Sin nombre'}
        </h4>
        {entity.description && (
            <p className="text-xs text-primary-green/60 mb-2">
                {entity.description.substring(0, 80)}
                {entity.description.length > 80 ? '...' : ''}
            </p>
        )}
        <a
            href={buildPath(`/entity?id=${entity.$id}`)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-bold text-primary-green hover:underline flex items-center gap-1"
        >
            Ver más
            <ChevronRight size={12} />
        </a>
    </button>
));
ResultEntityCard.displayName = 'ResultEntityCard';

export default ResultEntityCard;
