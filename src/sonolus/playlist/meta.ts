declare module '@sonolus/express' {
    interface PlaylistItemModel {
        meta: {
            isPublic: boolean;
            conditions: string[];
        }
    }
}