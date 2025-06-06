import { engineInfo } from "../../../lib/sonolus-pjsekai-engine-extended/index.js"
import { resolveEngineResource } from "./utils.js";
import { sonolus } from "../../index.js";

export const installEngine = () => {
    sonolus.engine.items.push({
        ...engineInfo,
        skin: 'chcy-pjsekai-extended-01',
        background: 'darkblue',
        effect: 'chcy-pjsekai-fixed',
        particle: 'chcy-pjsekai-v3',
        tags: [],
        thumbnail: sonolus.add(resolveEngineResource('thumbnail.png')),
        playData: sonolus.add(resolveEngineResource('EnginePlayData')),
        watchData: sonolus.add(resolveEngineResource('EngineWatchData')),
        previewData: sonolus.add(resolveEngineResource('EnginePreviewData')),
        tutorialData: sonolus.add(resolveEngineResource('EngineTutorialData')),
        configuration: sonolus.add(resolveEngineResource('EngineConfiguration')),
    })
}