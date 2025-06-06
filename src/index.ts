import { Sonolus, SonolusSpaShare } from "@sonolus/express";
import express from "express";
import dotenv from "dotenv";
import { packPath } from "@sonolus/free-pack"
import { install } from "./install.js";
import sonolusAuthRouter from "./sonolus/auth/auth.js";
import { maintenanceMiddleware } from "./api/middleware/maintenance.js";
import { likeRouter } from "./api/liked.js";

import cors from 'cors';
import morgan from "morgan";

dotenv.config();

export const sonolus = new Sonolus();
const share = new SonolusSpaShare('./public');
const port = process.env.PORT || 3000;
const app = express();
app.use(morgan("dev")); // DEV only, remove in production
app.use(cors({
    origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(maintenanceMiddleware);

app.use(sonolusAuthRouter);
app.use(likeRouter);
app.use(sonolus.router);
app.use(share.router);

sonolus.load('./pack')
sonolus.load(packPath);

install();

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})