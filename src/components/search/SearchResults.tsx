import React, { useState, useEffect } from 'react';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { fetchEntities, type Entity } from '../../lib/queries';

export const SearchResults: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);

    // Get initial search query from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q') || '';
        setSearchQuery(query);
    }, []);

    // Perform search whenever searchQuery changes
    useEffect(() => {
        performSearch();
    }, [searchQuery]);

    const performSearch = async () => {
        if (!searchQuery) {
            setResults([]);
            setTotalResults(0);
            return;
        }

        setLoading(true);

        try {
            const response = await fetchEntities({ search: searchQuery, limit: 100 });
            setResults(response.documents);
            setTotalResults(response.total);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
            setTotalResults(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = formData.get('q') as string;
        
        if (query && query.trim()) {
            setSearchQuery(query.trim());
            // Update URL without reload
            const newUrl = `/search?q=${encodeURIComponent(query.trim())}`;
            window.history.pushState({}, '', newUrl);
        }
    };

    // Empty state
    if (!searchQuery) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-primary-green/40">
                <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Ingresa un término para buscar</p>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary-green animate-spin" />
                    <p className="text-sm text-primary-green/50 font-medium">Buscando...</p>
                </div>
            </div>
        );
    }

    // No results
    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-primary-green/40 bg-white rounded-[2rem] border-2 border-dashed border-primary-green/10">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-lg font-medium mb-2">No se encontraron resultados</p>
                <p className="text-sm">Intenta con otros términos de búsqueda</p>
            </div>
        );
    }

    // Results
    return (
        <>
            <div className="mb-6">
                <h2 className="text-sm font-bold text-primary-green/40 uppercase tracking-widest">
                    {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map(entity => (
                    <a 
                        key={entity.$id}
                        href={`/entity?id=${entity.$id}`}
                        className="group bg-white border border-primary-green/5 p-6 rounded-[2rem] hover:border-primary-green hover:shadow-2xl hover:shadow-primary-green/5 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                            </svg>
                        </div>
                        <span className="inline-block px-2 py-1 bg-primary-green/5 rounded text-[10px] font-mono text-primary-green/50 mb-4 tracking-tighter">
                            {entity.$id.substring(0, 10)}...
                        </span>
                        <h3 className="text-xl font-black leading-tight mb-2 group-hover:text-primary-green">
                            {entity.label || 'Sin nombre'}
                        </h3>
                        {entity.aliases && entity.aliases.length > 0 && (
                            <p className="text-sm text-primary-green/40 font-medium mb-4">
                                También: {entity.aliases[0]}
                            </p>
                        )}
                        {entity.description && (
                            <div className="flex items-center gap-2 text-[11px] font-bold text-primary-green">
                                <span className="w-2 h-2 bg-primary-green rounded-full"></span>
                                {entity.description.substring(0, 80)}{entity.description.length > 80 ? '...' : ''}
                            </div>
                        )}
                    </a>
                ))}
            </div>
        </>
    );
};
