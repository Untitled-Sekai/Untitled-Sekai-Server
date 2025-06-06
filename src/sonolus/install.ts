import { levels } from "./level/index.js";
import { installInfo } from "./info/index.js"
import { engine } from "./engine/index.js";
import { redirectRouter } from "./router.js";
import { setupWebAuth } from "./auth/webauth.js";
import { background } from "./background/index.js";

export const installSonolus = () => {
    setupWebAuth();
    redirectRouter();
    installInfo();
    engine();
    levels();
    background();

}