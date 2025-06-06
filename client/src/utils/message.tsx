export const MESSAGE_TYPE = {
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info',
} as const;

export const ERROR_MESSAGE = {
    FETCH_FAILED: {en: "Failed to fetch data", ja: "データの取得に失敗しました"},
    SERVER_ERROR: {en: "Server error occurred", ja: "サーバーエラーが発生しました"},
    NOT_FOUND: {en: "Data not found", ja: "データが見つかりませんでした"},
    NETWORK_ERROR: {en: "Network error occurred", ja: "ネットワークエラーが発生しました"},
    TIMEOUT: {en: "Request timed out", ja: "リクエストがタイムアウトしました"},

    // ------------------------------------------------------------

    LOGIN_FAILED: {en: "Login failed", ja: "ログインに失敗しました"},
    UNAUTHORIZED: {en: "Unauthorized access", ja: "認証されていません"},
    SESSION_EXPIRED: {en: "Session expired", ja: "セッションが期限切れです"},

    // ------------------------------------------------------------
    
    REQUIRED_FIELD: {en: "This field is required", ja: "このフィールドは必須です"},
    PASSWORD_TOO_SHORT: {en: "Password is too short", ja: "パスワードが短すぎます"},
    PASSWORD_MISMATCH: {en: "Passwords do not match", ja: "パスワードが一致しません"},
    INVALID_USERNAME: {en: "Invalid username", ja: "無効なユーザー名です"},

    // ------------------------------------------------------------

    UPLOAD_FAILED: {en: "Upload failed", ja: "アップロードに失敗しました"},
    FILE_TOO_LARGE: {en: "File is too large", ja: "ファイルが大きすぎます"},
    INVALID_FILE_TYPE: {en: "Invalid file type", ja: "無効なファイルタイプです"},

    // ------------------------------------------------------------

    CHART_NOT_FOUND: {en: "Chart not found", ja: "譜面が見つかりませんでした"},
    CHART_UPLOAD_FAILED: {en: "Chart upload failed", ja: "譜面のアップロードに失敗しました"},

    // ------------------------------------------------------------

    UNKNOW: {en: "Unknown error occurred", ja: "不明なエラーが発生しました"},
    MAINTENANCE: {en: "Server is under maintenance", ja: "サーバーはメンテナンス中です"},
    RATE_LIMIT: {en: "Rate limit exceeded", ja: "レート制限を超えました"},
} as const;

// ------------------------------------------------------------

export const SUCCESS_MESSAGE = {
    LOGIN_SUCCESS: {en: "Login successful", ja: "ログインに成功しました"},
    LOGOUT_SUCCESS: {en: "Logout successful", ja: "ログアウトに成功しました"},
    UPLOAD_SUCCESS: {en: "Upload successful", ja: "アップロードに成功しました"},
    DELETE_SUCCESS: {en: "Delete successful", ja: "削除に成功しました"},
    UPDATE_SUCCESS: {en: "Update successful", ja: "更新に成功しました"},
} as const;

// ------------------------------------------------------------

export const WARNING_MESSAGE = {
    UNSAVED_CHANGES: {en: "You have unsaved changes", ja: "保存されていない変更があります"},
    FILE_NOT_FOUND: {en: "File not found", ja: "ファイルが見つかりませんでした"},
    INVALID_INPUT: {en: "Invalid input", ja: "無効な入力です"},
} as const;

// ------------------------------------------------------------

export const INFO_MESSAGE = {
    LOADING: {en: "Loading...", ja: "読み込み中..."},
    SAVING: {en: "Saving...", ja: "保存中..."},
    DELETING: {en: "Deleting...", ja: "削除中..."},
    UPLOADING: {en: "Uploading...", ja: "アップロード中..."},
} as const;

// ------------------------------------------------------------

export const LABELS = {
    SUBMIT: {en: "Submit", ja: "送信"},
    CANCEL: {en: "Cancel", ja: "キャンセル"},
    DELETE: {en: "Delete", ja: "削除"},
    SAVE: {en: "Save", ja: "保存"},
    EDIT: {en: "Edit", ja: "編集"},
    BACK: {en: "Back", ja: "戻る"},
    NEXT: {en: "Next", ja: "次へ"},
    LOGIN: {en: "Login", ja: "ログイン"},
    REGISTER: {en: "Register", ja: "登録"},
    UPLOAD: {en: "Upload", ja: "アップロード"},
    DOWNLOAD: {en: "Download", ja: "ダウンロード"},
    PLAY: {en: "Play in Sonolus", ja: "Sonolusでプレイ"},
} as const;

// ------------------------------------------------------------

export const BUTTONS_TEXT = {
    CONFIRM: {en: "Confirm", ja: "確認"},
    DISMISS: {en: "Dismiss", ja: "閉じる"},
    CLOSE: {en: "Close", ja: "閉じる"},
    SUBMIT: {en: "Submit", ja: "送信"},
    CANCEL: {en: "Cancel", ja: "キャンセル"},
    DELETE: {en: "Delete", ja: "削除"},
    SAVE: {en: "Save", ja: "保存"},
    EDIT: {en: "Edit", ja: "編集"},
    BACK: {en: "Back", ja: "戻る"},
    NEXT: {en: "Next", ja: "次へ"},
    LOGIN: {en: "Login", ja: "ログイン"},
    REGISTER: {en: "Register", ja: "登録"},
    UPLOAD: {en: "Upload", ja: "アップロード"},
    DOWNLOAD: {en: "Download", ja: "ダウンロード"},
    PLAY: {en: "Play in Sonolus", ja: "Sonolusでプレイ"},
} as const;