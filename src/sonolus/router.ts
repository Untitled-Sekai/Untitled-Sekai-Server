import { sonolus } from "../index.js";
import { MESSAGE } from "../message.js";

import path from "path";
import fs from "fs";
import axios from 'axios';

export const redirectRouter = () => {
    sonolus.router.get('/repository/:type/:id', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        const { type, id } = req.params;
        const fileUrl = `https://storage.pim4n-net.com/us/repository/${type}/${id}`;

        try {
            const fileRes = await axios.get(fileUrl, { responseType: 'stream' });
            res.setHeader('Content-Type', fileRes.headers['content-type'] || 'application/octet-stream');
            fileRes.data.pipe(res);
        } catch (e) {
            res.status(404).send('File not found');
        }
    });
}