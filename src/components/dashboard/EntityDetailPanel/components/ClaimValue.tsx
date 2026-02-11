import React, { useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Claim } from '../../../../lib/queries';
import { extractId } from '../utils/propertyHelpers';

const ClaimValue = React.memo(({ claim, onSelectRelated, type }: {
    claim: Claim;
    onSelectRelated: (id: string) => void;
    type: 'incoming' | 'outgoing';
}) => {
    const handleClick = useCallback(() => {
        if (type === 'outgoing' && claim.value_relation) {
            const relatedId = extractId(claim.value_relation);
            onSelectRelated(relatedId);
        } else if (type === 'incoming' && claim.subject) {
            const subjectId = extractId(claim.subject);
            onSelectRelated(subjectId);
        }
    }, [claim, onSelectRelated, type]);

    const label = type === 'outgoing'
        ? (claim.value_relation ? (typeof claim.value_relation === 'object' ? (claim.value_relation as any)?.label : 'Entidad relacionada') : null)
        : (claim.subject ? (typeof claim.subject === 'object' ? (claim.subject as any)?.label : 'Entidad') : null);

    const hasRelation = type === 'outgoing' ? !!claim.value_relation : !!claim.subject;

    return (
        <div className="text-primary-green text-sm font-medium">
            {hasRelation ? (
                <button
                    onClick={handleClick}
                    className="inline-flex items-center gap-1 hover:text-[#2d5a42] transition-colors border-b border-primary-green/10 hover:border-[#2d5a42]/50 pb-0.5 group/link"
                >
                    {label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-all" />
                </button>
            ) : (
                <span>{claim.value_raw || 'Sin valor'}</span>
            )}
        </div>
    );
});
ClaimValue.displayName = 'ClaimValue';

export default ClaimValue;
