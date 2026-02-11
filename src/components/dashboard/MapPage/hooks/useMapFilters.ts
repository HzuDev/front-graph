import { useState, useEffect } from 'react';
import { fetchEntitiesFiltered, DEPARTMENT_IDS } from '../../../../lib/queries';
import type { Entity } from '../../../../lib/queries';

export const useMapFilters = () => {
    const [selectedDepartment, setSelectedDepartment] = useState('Todos');
    const [selectedType, setSelectedType] = useState('Todas');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return {
        selectedDepartment,
        setSelectedDepartment,
        selectedType,
        setSelectedType,
        searchQuery,
        setSearchQuery,
        debouncedSearch
    };
};
