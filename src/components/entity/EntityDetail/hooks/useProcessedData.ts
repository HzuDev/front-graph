import { useMemo } from 'react';
import type { Entity, Claim } from '../../../../lib/queries';
import { processClaimsData } from '../utils/dataProcessors';

export const useProcessedData = (claims: Claim[], entity: Entity) => {
  return useMemo(() => {
    return processClaimsData(claims, entity);
  }, [claims, entity]);
};
