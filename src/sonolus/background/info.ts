import { sonolus } from "../../index.js";
import { Text } from "@sonolus/core";

export const info_background = () => {
    sonolus.background.infoHandler = async () => {
        return {
            searches: [],
            sections: [
                {
                    title: { en: Text.Background, ja: Text.Background },
                    icon: "background",
                    itemType: "background" as const,
                    items: sonolus.background.items.filter(item => !item.tags.some(
                        tag => tag.title.en === "background" || tag.title.ja === "background"
                    ))
                }
            ]
        }
    }
}