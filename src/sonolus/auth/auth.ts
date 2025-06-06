// sonolusでのログイン
// なぜか既存のsonolus expressのsonolus関数で動かなかったので、expressのexpress.Routerを使用
import { Response, Request } from "express";
import { ServerAuthenticateResponse, ServerAuthenticateRequest } from "@sonolus/core";
import crypto from "crypto";
import { setProfile } from "./state.js";
import bodyParser from "body-parser";
import express from "express";

const sonolusAuthRouter = express.Router();

sonolusAuthRouter.use(bodyParser.json({limit: '10mb'}));

sonolusAuthRouter.post('/sonolus/authenticate', async (req: Request, res: Response) => {
    const authRequest = req.body as ServerAuthenticateRequest;

    const session = crypto.randomUUID();
    const expiration = Date.now() + 30 * 60 * 1000; // 30分

    setProfile(session, authRequest.userProfile, expiration);

    const response: ServerAuthenticateResponse = {
        session: session,
        expiration: expiration,
    }

    res.status(200).json(response);
});

export default sonolusAuthRouter;