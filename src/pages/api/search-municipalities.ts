import type { APIRoute } from 'astro';
import { searchMunicipalities } from '../../lib/queries';

export const GET: APIRoute = async ({ url }) => {
    const searchTerm = url.searchParams.get('q');

    if (!searchTerm || searchTerm.trim().length < 2) {
        return new Response(
            JSON.stringify({ 
                municipalities: [],
                error: 'Search term must be at least 2 characters'
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    try {
        const municipalities = await searchMunicipalities(searchTerm);

        return new Response(
            JSON.stringify({ 
                municipalities,
                count: municipalities.length 
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        console.error('Error in search-municipalities API:', error);
        
        return new Response(
            JSON.stringify({ 
                municipalities: [],
                error: 'Internal server error'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};
