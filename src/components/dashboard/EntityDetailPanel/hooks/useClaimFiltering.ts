import { useMemo } from 'react';
import type { Claim } from '../../../../lib/queries';
import { extractId } from '../utils/propertyHelpers';

export const useClaimFiltering = (claims: Claim[], entityId: string) => {
    // Memoizar el filtrado y agrupamiento de claims (evita cálculos en cada render)
    const { outgoingClaims, incomingClaims } = useMemo(() => {
        const outgoing = claims.filter(claim => {
            const subjectId = extractId(claim.subject);
            return subjectId === entityId;
        });

        const incoming = claims.filter(claim => {
            const valueRelationId = extractId(claim.value_relation);
            return valueRelationId === entityId;
        });

        return { outgoingClaims: outgoing, incomingClaims: incoming };
    }, [claims, entityId]);

    return { outgoingClaims, incomingClaims };
};
