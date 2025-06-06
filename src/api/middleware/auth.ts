import { Request, Response, NextFunction } from 'express';

const API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
    const apikey = req.header('X-API-Key');

    if (!apikey || !API_KEYS.includes(apikey)) {
        res.status(401).json({ error: '不正なAPIキーです' });
        return;
    }
    next();
}