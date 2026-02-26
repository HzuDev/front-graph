import { buildPath } from '../../../../lib/utils/paths';
import type { Claim } from '../../../../lib/queries';
import { normalizeText } from './formatters';

export const getQualifierValue = (claim: Claim, labelIncludes: string) => {
  const normalized = normalizeText(labelIncludes);
  const qualifier = (claim.qualifiers || []).find((q) => {
    const label = typeof q.property === 'object' ? q.property?.label : '';
    return normalizeText(label || '').includes(normalized);
  });

  if (!qualifier) return null;
  if (qualifier.value_relation) {
    return extractLabel(qualifier.value_relation);
  }
  return qualifier.value_raw || null;
};

export const getQualifierEntity = (claim: Claim, labelIncludes: string) => {
  const normalized = normalizeText(labelIncludes);
  return (
    (claim.qualifiers || []).find((q) => {
      const label = typeof q.property === 'object' ? q.property?.label : '';
      return normalizeText(label || '').includes(normalized);
    })?.value_relation || null
  );
};

export const getQualifierValueByLabels = (claim: Claim, labels: string[]) => {
  const normalized = labels.map((label) => normalizeText(label));
  const qualifier = (claim.qualifiers || []).find((q) => {
    const label = typeof q.property === 'object' ? q.property?.label : '';
    const normalizedLabel = normalizeText(label || '');
    return normalized.some((value) => normalizedLabel.includes(value));
  });

  if (!qualifier) return null;
  if (qualifier.value_relation) {
    return extractLabel(qualifier.value_relation);
  }
  return qualifier.value_raw || null;
};

export const isIdLike = (value: string) =>
  /^[a-f0-9]{20,}$/i.test(value.trim());

export const getEntityId = (entity: unknown) => {
  if (!entity) return null;
  if (typeof entity === 'string') return entity;
  return (entity as { $id?: string }).$id || null;
};

export const getEntityLink = (entity: unknown) => {
  const id = getEntityId(entity);
  return id ? buildPath(`/entity?id=${id}`) : null;
};

export const extractLabel = (entity: unknown): string => {
  if (!entity) return 'Desconocido';
  if (typeof entity === 'string') return entity;
  return (entity as { label?: string }).label || 'Entidad relacionada';
};
