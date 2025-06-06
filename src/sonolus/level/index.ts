import { uploadLevel,editLevel,deleteLevel} from "./router.js";
import { info_level } from "./info.js";
import { list_level } from "./list.js";
import { detail_level } from "./detail.js";

export const levels = () => {
    info_level();
    list_level();
    detail_level();

    // router
    uploadLevel();
    editLevel();
    deleteLevel();
}