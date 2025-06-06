import { RequestHandler } from "express";
import { sonolus } from '../index.js';
import { apiKeyAuth } from './middleware/auth.js';
import { WebhookModel } from '../models/webhook.js';

export const registerWebhookApi = () => {
    sonolus.router.post('/api/webhooks', apiKeyAuth, (async (req, res) => {
        try {
            const { url, secret, description, events } = req.body;
            if (!url || !secret) {
                return res.status(400).json({ error: "URL及びシークレットキーは必須です" });
            }

            const webhook = new WebhookModel({
                url,
                secret,
                description: description || "外部サービスWebhook",
                events: events || ['new_chart']
            });

            await webhook.save();

            res.status(201).json({
                success: true,
                message: "Webhookが登録されました",
                id: webhook._id
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Webhook registration failed.' });
        }
    }) as RequestHandler);

    sonolus.router.get("/api/webhooks", apiKeyAuth, (async (req, res) => {
        try {
            const webhooks = await WebhookModel.find().select('-secret').lean();

            res.json({
                success: true,
                data: webhooks
            });
        } catch (e) {
            console.error("Webhook一覧取得エラー:", e);
            res.status(500).json({ error: "サーバーエラーが発生しました" });
        }
    }) as RequestHandler);

    sonolus.router.delete("/api/webhooks/:id", apiKeyAuth, (async (req, res) => {
        try {
            const { id } = req.params;
            await WebhookModel.findByIdAndDelete(id);

            res.json({
                success: true,
                message: "Webhookが削除されました"
            });
        } catch (e) {
            console.error("Webhook削除エラー:", e);
            res.status(500).json({ error: "サーバーエラーが発生しました" });
        }
    }) as RequestHandler);
}

export const notifyWebhooks = async (eventType: string, data: any) => {
    try {
        const webhooks = await WebhookModel.find({ events: eventType });

        const promises = webhooks.map(async (webhooks) => {
            try {
                const crypto = await import('crypto');
                const hmac = crypto.createHmac('sha256', webhooks.secret);
                const signature = hmac.update(JSON.stringify(data)).digest('hex');

                const fetch = (await import('node-fetch')).default;
                await fetch(webhooks.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': signature
                    },
                    body: JSON.stringify({
                        event: eventType,
                        timestamp: new Date(),
                        data
                    })
                });
            } catch (e) {
                console.error(`Webhook通知エラー (${webhooks._id}):`, e);
                throw new Error(`Webhook通知に失敗しました: ${webhooks._id}`);
            }
        });

        await Promise.all(promises);
    } catch (e) {
        console.error("Webhook通知エラー:", e);
        throw new Error("Webhook通知に失敗しました");
    }
} 