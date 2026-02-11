import { useState, useEffect } from 'react';
import { fetchEntityDetails, type Entity, type Claim } from '../../../../lib/queries';

export const useEntityDetails = (entityId: string) => {
    const [entity, setEntity] = useState<Entity | null>(null);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadEntityDetails() {
            try {
                setLoading(true);
                const data = await fetchEntityDetails(entityId);
                setEntity(data.entity);
                setClaims(data.claims);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        }

        loadEntityDetails();
    }, [entityId]);

    return { entity, claims, loading };
};
