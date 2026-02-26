import type { Entity, Claim } from '@/lib/queries/types';
import type { EntityType } from '@/lib/appwrite/entity-utils';
import { TerritoryView } from './TerritoryView';
import { InstitutionView } from './InstitutionView';
import { PartyView } from './PartyView';
import { SurveyView } from './SurveyView';
import { PollingFirmView } from './PollingFirmView';
import { EducationView } from './EducationView';
import { RoleView } from './RoleView';
import { EntityDetail } from '../EntityDetail';

interface EntityRendererProps {
  entity: Entity;
  claims: Claim[];
  type: EntityType;
}

export function EntityRenderer({ entity, claims, type }: EntityRendererProps) {
  switch (type) {
    case 'TERRITORIO':
      return <TerritoryView entity={entity} claims={claims} />;
    case 'INSTITUCION':
      return <InstitutionView entity={entity} claims={claims} />;
    case 'PARTIDO_POLITICO':
      return <PartyView entity={entity} claims={claims} />;
    case 'ENCUESTA':
      return <SurveyView entity={entity} claims={claims} />;
    case 'CASA_ENCUESTADORA':
      return <PollingFirmView entity={entity} claims={claims} />;
    case 'EDUCACION':
      return <EducationView entity={entity} claims={claims} />;
    case 'ROL':
      return <RoleView entity={entity} claims={claims} />;
    case 'POLITICO':
    case 'PERSONA':
      return <EntityDetail entity={entity} claims={claims} />;
    default:
      return <EntityDetail entity={entity} claims={claims} />;
  }
}
