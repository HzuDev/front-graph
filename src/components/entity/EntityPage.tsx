import React, { useEffect, useReducer } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchEntityDetails, type Entity, type Claim } from '../../lib/queries';
import type { EntityType } from '../../lib/appwrite/entity-utils';
import { EntityDetail } from './EntityDetail';
import { EntityRenderer } from '@/components/entity/views/EntityRenderer';
import { buildPath } from '../../lib/utils/paths';

interface EntityPageState {
  entity: Entity | null;
  claims: Claim[];
  loading: boolean;
  entityType: EntityType;
  error: string | null;
}

type EntityPageAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | {
      type: 'SET_DATA';
      payload: { entity: Entity; claims: Claim[]; entityType: EntityType };
    }
  | { type: 'SET_ERROR'; payload: string };

const entityPageReducer = (
  state: EntityPageState,
  action: EntityPageAction
): EntityPageState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_DATA':
      return {
        ...state,
        entity: action.payload.entity,
        claims: action.payload.claims,
        entityType: action.payload.entityType,
        loading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};

export default function EntityPage() {
  const [state, dispatch] = useReducer(entityPageReducer, {
    entity: null,
    claims: [],
    loading: true,
    entityType: 'UNKNOWN',
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
          dispatch({
            type: 'SET_ERROR',
            payload: 'ID de entidad no proporcionado',
          });
          return;
        }

        // Single await — fetches entity, all claims, qualifiers, references,
        // and derives entity type all in one pass. No intermediate empty renders.
        const {
          entity: loadedEntity,
          claims: loadedClaims,
          entityType: resolvedType,
        } = await fetchEntityDetails(id);

        dispatch({
          type: 'SET_DATA',
          payload: {
            entity: loadedEntity as Entity,
            claims: loadedClaims,
            entityType: resolvedType,
          },
        });
      } catch (err: unknown) {
        console.error('Error loading entity:', err);
        dispatch({
          type: 'SET_ERROR',
          payload: 'Error cargando la entidad. Verifique el ID o su conexión.',
        });
      }
    };

    loadData();
  }, []);

  const { loading, error, entity, claims, entityType } = state;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary-green" />
          <p className="text-primary-green/60 font-medium">
            Cargando detalles...
          </p>
        </div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Entidad no encontrada'}
          </p>
          <a
            href={buildPath('/')}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-green text-white rounded-xl font-bold hover:opacity-90 transition-opacity w-full"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  if (
    entityType !== 'UNKNOWN' &&
    entityType !== 'POLITICO' &&
    entityType !== 'PERSONA'
  ) {
    return <EntityRenderer entity={entity} claims={claims} type={entityType} />;
  }

  return <EntityDetail entity={entity} claims={claims} />;
}
