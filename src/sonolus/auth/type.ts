import { Session } from "express-session";

export interface RequestWithSession extends Request {
    session: Session & {
        userId?: string;
        username?: string;
    }
}

export interface UserProfile {
    handle: string;
    name: string;
}

export interface AuthenticateExternalRequest {
    type: 'authenticateExternal';
    url: string;
    time: number;
    userProfile: UserProfile;
}