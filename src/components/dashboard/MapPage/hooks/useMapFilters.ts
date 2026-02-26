import { useState, useEffect } from 'react';

export const useMapFilters = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
    debouncedSearch,
  };
};
