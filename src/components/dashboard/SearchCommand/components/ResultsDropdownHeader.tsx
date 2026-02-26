import { memo, useMemo } from 'react';
import { loadRecentEntities } from '../utils/recentStorageHelpers';

const ResultsDropdownHeader = memo(() => {
  const recentEntities = useMemo(() => loadRecentEntities(), []);
  const hasRecent = recentEntities.length > 0;

  return (
    <div className="px-6 py-3 border-b border-primary-green/10">
      <p className="text-xs font-bold text-primary-green/50 uppercase tracking-wider">
        {hasRecent ? 'Búsquedas recientes' : 'Sugerencias'}
      </p>
    </div>
  );
});

ResultsDropdownHeader.displayName = 'ResultsDropdownHeader';

export default ResultsDropdownHeader;
