import { LOCALE, NO_DATE } from "../constants";

export const formatDate = (dateString: string | undefined) => {
  if (!dateString) return NO_DATE;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(LOCALE, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

export const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const getSigla = (name: string) => {
  const match = name.match(/\b[A-Z]{2,5}\b/);
  if (match) return match[0];
  const parts = name.split(' ').filter(word => word.length > 2 && !['del', 'los', 'las', 'con'].includes(word.toLowerCase()));
  if (parts.length >= 2) return parts.map(w => w[0]).join('').toUpperCase();
  return name.slice(0, 3).toUpperCase();
};
