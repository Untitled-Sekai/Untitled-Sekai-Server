import mongoose from "mongoose";

export const webhookSchema = new mongoose.Schema({
    url: { type: String, required: true },
    secret: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    events: { type: [String], default: ['new_chart'] }
})

export const WebhookModel = mongoose.model('Webhook', webhookSchema);