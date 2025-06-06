import { sonolus } from "../index.js";
import { LevelModel } from "../models/level.js";
import { RequestHandler } from "express";

export const ogp = () => {
    // クローラー判定用
    const crawlerRegex = /(bot|crawler|spider|facebookexternalhit|discordbot|twitterbot|whatsapp|telegram|linkedin|slack|line|pinterest|pocket)/i;

    sonolus.router.get('/charts/:id', (async (req, res, next) => {
        try {
            const userAgent = req.headers['user-agent'] || '';
            const isWebCrawler = crawlerRegex.test(userAgent);
            
            if (!isWebCrawler) {
                return next();
            }
            
            const { id } = req.params;
            const chart = await LevelModel.findOne({ name: id });

            if (!chart) {
                return res.status(404).send('Chart not found');
            }

            const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
            
            const coverUrl = chart.cover?.url?.startsWith('https') 
                ? chart.cover.url 
                : `${baseUrl}${chart.cover?.url || ''}`;
            
            const title = chart.title?.ja || chart.title?.en || 'No Title';
            const artist = chart.artists?.ja || chart.artists?.en || 'No Artist';
            const description = chart.description?.ja || chart.description?.en || '説明なし';
            
            res.setHeader('Content-Type', 'text/html');
            res.send(`
                <!DOCTYPE html>
                <html lang="ja">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${title} (${artist}) - 難易度${chart.rating} | Reuntitled Sekai</title>
                    
                    <!-- OGP Meta Tags -->
                    <meta property="og:title" content="${title} - 難易度${chart.rating}">
                    <meta property="og:description" content="${description}">
                    <meta property="og:image" content="${coverUrl}">
                    <meta property="og:type" content="music.song">
                    <meta property="og:url" content="${baseUrl}/charts/${id}">
                    
                    <!-- Twitter Card -->
                    <meta name="twitter:card" content="summary_large_image">
                    <meta name="twitter:title" content="${title} (${artist}) - 難易度${chart.rating}">
                    <meta name="twitter:description" content="${description}">
                    <meta name="twitter:image" content="${coverUrl}">
                    
                    <style>
                        body {
                            font-family: sans-serif;
                            text-align: center;
                            margin-top: 50px;
                        }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <p><a href="${baseUrl}/charts/${id}">この譜面を見る</a></p>
                </body>
                </html>
            `);
        } catch (e) {
            console.error("OGP generation error:", e);
            return res.status(500).json({ error: "An error occurred while generating OGP." });
        }
    }) as RequestHandler);
}