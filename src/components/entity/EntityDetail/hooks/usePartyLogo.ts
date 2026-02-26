import { useEffect, useState } from 'react';
import {
  databases,
  DATABASE_ID,
  COLLECTIONS,
  Query,
} from '../../../../lib/appwrite';
import type { Claim } from '../../../../lib/queries';

export const usePartyLogo = (
  partyId: string | undefined,
  existingLogo: string | null | undefined
) => {
  const [fetchedLogo, setFetchedLogo] = useState<string | null>(null);

  useEffect(() => {
    if (!existingLogo && partyId && !fetchedLogo) {
      databases
        .listDocuments<Claim>(DATABASE_ID, COLLECTIONS.CLAIMS, [
          Query.equal('subject', partyId),
          Query.equal('datatype', 'image'),
          Query.limit(10),
        ])
        .then((res) => {
          if (res.documents && res.documents.length > 0) {
            const logoClaim =
              res.documents.find((c) => {
                const label =
                  typeof c.property === 'object'
                    ? c.property?.label?.toLowerCase() || ''
                    : '';
                return (
                  label.includes('logo') ||
                  label.includes('emblema') ||
                  label.includes('organizacion')
                );
              }) || res.documents[0];
            if (logoClaim && logoClaim.value_raw) {
              setFetchedLogo(logoClaim.value_raw);
            }
          }
        })
        .catch(console.error);
    }
  }, [partyId, existingLogo, fetchedLogo]);

  return fetchedLogo;
};
