export interface StorageData {
    usedSpace: number;
    totalSpace: number;
    fileCount: number;
    fileTypes: Record<string, { count: number; size: number }>;
    largestFiles: Array<{ name: string; size: number; type: string }>;
}

export interface MaintenanceState {
    enabled: boolean;
    lastUpdated: string;
    updatedBy: string;
    estimatedRecovery?: string;
}