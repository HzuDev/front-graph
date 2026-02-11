export interface MapViewWrapperProps {
    selectedEntityId?: string | null;
    onMunicipalitySelect?: (municipality: { name: string; department: string; entityId: string }) => void;
}
