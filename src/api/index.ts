import { charts } from "./chart.js";
import { getStorageData } from "./storage.js";
import { getUser } from "./users.js";
import { getMaintenanceState } from "../discord/maintenance.js";
import { newChartApis, getExternalNewCharts } from "./new.js";
import { registerWebhookApi } from "./webhook.js";
import { anonymous } from "./anonymous.js";
import { ogp } from "./ogp.js";

export const api = () => {
    charts();
    getStorageData();
    getUser();
    getMaintenanceState();
    newChartApis();
    anonymous();
    ogp();

    // webhook
    registerWebhookApi();
    getExternalNewCharts();
}