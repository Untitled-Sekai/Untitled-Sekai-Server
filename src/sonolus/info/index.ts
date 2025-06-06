import { sonolus } from "../../index.js";
import { getProfile } from "../auth/state.js";

export const installInfo = () => {
    sonolus.serverInfoHandler = (query) => {
        const profile = query.session ? getProfile(query.session) : null;

        return {
            title: {
                en: 'Untitled_Sekai β',
                ja: 'Untitled_Sekai β'
            },
            description: {
                en: profile ? `Login ${profile.name}#${profile.handle}\n\nUntitled Sekai` : "Untitled Sekai",
                ja: profile ? `ログイン ${profile.name}#${profile.handle}\n\nUntitled Sekai` : "Untitled Sekai"
            },
            buttons: [
                { type: 'authentication' },
                { type: 'post'},
                { type: 'level' },
                { type: 'skin' },
                { type: 'background' },
                { type: 'effect' },
                { type: 'particle' },
                { type: 'engine' },
                { type: 'configuration' }
            ],
            configuration: {
                options: []
            },
            banner: {
                hash: 'banner',
                url: '/repository/banner/banner'
            }
        }
    }
}