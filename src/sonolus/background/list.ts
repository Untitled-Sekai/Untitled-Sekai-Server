import { sonolus } from "../../index.js";
import { Text } from "@sonolus/core";

export const list_background = () => {
    sonolus.background.listHandler = async () => {
        return {
            items: sonolus.background.items.filter(item => !item.tags.some(
                tag => tag.title.en === "background" || tag.title.ja === "background"
            )),
            pageCount: 1,
        }
    }
}