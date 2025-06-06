// 認証の状態を管理するモジュール
import { ServiceUserProfile } from "@sonolus/core";

export type ServiceUserId = string;

interface AuthState {
    [session: string]: {
        expiration: number;
        profile: ServiceUserProfile;
    }
}

export const authState: AuthState = {};

export const isValidSession = (session: string): boolean => {
    const auth = authState[session];
    if (!auth) return false;
    return auth.expiration > Date.now();
}

export const getProfile = (session: string): ServiceUserProfile | null => {
    const auth = authState[session];
    if (!auth) return null;
    return auth.profile;
}

export const setProfile = (session: string, profile: ServiceUserProfile, expiration?: number): void => {
    authState[session] = {
        expiration: expiration || Date.now() + 30 * 60 * 1000,
        profile: profile
    };
}