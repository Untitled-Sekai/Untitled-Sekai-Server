import { sonolus } from "../index.js";
import { MESSAGE } from "../message.js";

import path from "path";
import fs from "fs";

export const redirectRouter = () => {
    sonolus.router.get('/repository/:type/:id', (req, res) => {
        const { type, id } = req.params;
        const filePath = path.join(process.cwd(), 'repository', type, id);
        
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send(MESSAGE.ERROR.NOTFOUND);
        }
    });
}