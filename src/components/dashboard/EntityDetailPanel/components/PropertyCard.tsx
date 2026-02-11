import React from 'react';
import type { Claim } from '../../../../lib/queries';
import { getIconForProperty } from '../utils/propertyHelpers';
import ClaimValue from './ClaimValue';

const PropertyCard = React.memo(({ property, claims, onSelectRelated, type }: {
    property: string;
    claims: Claim[];
    onSelectRelated: (id: string) => void;
    type: 'incoming' | 'outgoing';
}) => {
    const bgClass = type === 'outgoing' ? 'bg-[#f8f9fa]' : 'bg-hunter/30';

    return (
        <div className={`${bgClass} rounded-xl p-4 border border-primary-green/5 hover:border-primary-green/20 transition-all group`}>
            <h4 className="text-xs font-bold text-primary-green/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                {getIconForProperty(property)}
                {property}
            </h4>

            <div className="space-y-2">
                {claims.map((claim) => (
                    <ClaimValue
                        key={claim.$id}
                        claim={claim}
                        onSelectRelated={onSelectRelated}
                        type={type}
                    />
                ))}
            </div>
        </div>
    );
});
PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
