import { PlaylistModel } from "../../models/playlist.js"
import { PlaylistItemModel } from "@sonolus/express"

export async function fetchPlaylists(): Promise<PlaylistItemModel[]> {
    try {
        const playlists = await PlaylistModel.find().sort({ createdAt: -1 }).lean()

        return playlists.map(doc => {
            const { _id, __v, ...playlistData } = doc
            return playlistData as unknown as PlaylistItemModel
        })
    } catch (e) {
        console.error('Failed to fetch playlists:', e)
        throw new Error('Database error while fetching playlists')
    }
}