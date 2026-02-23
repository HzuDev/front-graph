import type { Entity, Claim } from "../../../lib/queries";

export interface SocialLink {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'web' | 'other';
  url: string;
}

export interface EntityDetailProps {
  entity: Entity;
  claims: Claim[];
}

export interface TimelineItem {
  id: string;
  cargo: string;
  entidad?: string | null;
  entidadId?: string | null;
  inicio?: string | null;
  fin?: string | null;
  territorio?: string | null;
}

export interface EducationItem {
  id: string;
  titulo: string;
  universidad?: string | null;
  universidadId?: string | null;
  fecha?: string | null;
}

export interface LinkItem {
  id: string;
  tipo: string;
  detalle: string;
  link?: string | null;
  relacion?: string | null;
  referencias?: { label: string; link?: string | null }[];
}
