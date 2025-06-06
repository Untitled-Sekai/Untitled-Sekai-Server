import { create } from "domain";
import e from "express";
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    levelName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now },
})

export const EventModel = mongoose.model('Event', eventSchema);