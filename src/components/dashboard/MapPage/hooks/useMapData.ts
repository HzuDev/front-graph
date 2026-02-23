import { useState, useEffect } from 'react';
import { fetchEntitiesFiltered, DEPARTMENT_IDS } from '../../../../lib/queries';
import type { Entity } from '../../../../lib/queries';

export const useMapData = (selectedDepartment: string, selectedType: string, debouncedSearch: string) => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapZoomTarget, setMapZoomTarget] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                const entitiesData = await fetchEntitiesFiltered({
                    limit: 100,
                    entityType: selectedType,
                    department: selectedDepartment,
                    search: debouncedSearch || undefined
                });

                setEntities(entitiesData.documents);

                if (selectedDepartment !== 'Todos') {
                    const deptId = DEPARTMENT_IDS[selectedDepartment as keyof typeof DEPARTMENT_IDS];
                    if (deptId) {
                        setMapZoomTarget(deptId);
                    }
                } else if (entitiesData.documents.length > 0 && entitiesData.documents.length <= 10 && debouncedSearch) {
                    setMapZoomTarget(entitiesData.documents[0].$id);
                } else {
                    setMapZoomTarget(null);
                }
            } catch (error) {
                console.error('Error loading entities:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [selectedDepartment, selectedType, debouncedSearch]);

    return { entities, loading, mapZoomTarget };
};
