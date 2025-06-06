export const MESSAGE = {
    ERROR: {
        NOTFOUND: {
            CODE: 404,
            MESSAGE: {en: "Not Found", ja: "見つかりませんでした"},
        },
        SERVERERROR: {
            CODE: 503,
            MESSAGE: {en: "Interval Server Error", ja: "サーバーエラー"},
        },
        BADREQUEST: {
            CODE: 400,
            MESSAGE: {en: "Bad Request", ja: "不正なリクエスト"},
        },
        UNAUTHORIZED: {
            CODE: 401,
            MESSAGE: {en: "Unauthorized", ja: "認証されていません"},
        },
        FORBIDDEN: {
            CODE: 403,
            MESSAGE: {en: "Forbidden", ja: "禁止されています"},
        },
        USERNAMEEXISTS: {
            CODE: 400,
            MESSAGE: {en: "Username already exists", ja: "ユーザー名はすでに存在します"},
        },
        USERNOTFOUND: {
            CODE: 404,
            MESSAGE: {en: "User not found", ja: "ユーザーが見つかりません"},
        },
        INVALIDCREDENTIALS: {
            CODE: 401,
            MESSAGE: {en: "Invalid credentials", ja: "認証情報が無効です"},
        },
        USERNAMELENGTH: {
            CODE: 400,
            MESSAGE: {en: "Username must be between 3 and 20 characters", ja: "ユーザー名は3〜20文字でなければなりません"},
        },
    },
    SUCCESS: {
        OK: {
            CODE: 200,
            MESSAGE: {en: "OK", ja: "成功"},
        },
        CREATED: {
            CODE: 201,
            MESSAGE: {en: "Created", ja: "作成されました"},
        },
        NO_CONTENT: {
            CODE: 204,
            MESSAGE: {en: "No Content", ja: "コンテンツがありません"},
        },
        ACCEPTED: {
            CODE: 202,
            MESSAGE: {en: "Accepted", ja: "受け入れられました"},
        },
        USERCREATED: {
            CODE: 201,
            MESSAGE: {en: "User Created", ja: "ユーザーが作成されました"},
        },
        SONOLUSAUTHENTICATED: {
            CODE: 200,
            MESSAGE: {en: "Sonolus Authenticated", ja: "Sonolus認証に成功しました"},
        },
        UPLOADSUCCESS: {
            CODE: 200,
            MESSAGE: {en: "Upload Success", ja: "アップロードに成功しました"},
        }
    }
}