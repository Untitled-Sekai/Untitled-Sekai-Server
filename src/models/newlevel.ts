import mongoose from "mongoose";

const newlevelSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    levelName: { tupe: String },
    publishedAt: { type: Date, default: Date.now },
    title: {
        en: String,
        ja: String
    },
    artists: {
        en: String,
        ja: String
    },
    artist: {
        en: String,
        ja: String
    },
    author: {
        en: String,
        ja: String
    },
    rating: Number,
    coverUrl: String,
})

export const NewChartModel = mongoose.model('NewChart', newlevelSchema);