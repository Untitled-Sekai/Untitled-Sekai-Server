import { sonolus } from "../index.js";
import { MESSAGE } from "../message.js";

import path from "path";
import fs from "fs";

export const redirectRouter = () => {
    sonolus.router.get('/repository/:type/:id', (req, res) => {
        const { type, id } = req.params;
        const redirectURL = `https://storage.pim4n-net.com/us/repository/${type}/${id}`;

        res.redirect(308, redirectURL);
    });
}