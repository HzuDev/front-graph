import type { Claim } from '../../../lib/queries';

export interface EntityDetailPanelProps {
    entityId: string;
    onClose: () => void;
    onSelectRelated: (entityId: string) => void;
}

export interface PropertyCardProps {
    property: string;
    claims: Claim[];
    onSelectRelated: (id: string) => void;
    type: 'incoming' | 'outgoing';
}

export interface ClaimValueProps {
    claim: Claim;
    onSelectRelated: (id: string) => void;
    type: 'incoming' | 'outgoing';
}
