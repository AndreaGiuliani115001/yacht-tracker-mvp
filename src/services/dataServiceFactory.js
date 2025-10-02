// src/services/dataServiceFactory.js
import MockDataService from "./MockDataService.js";
import WebSocketService from "./ws/WebSocketService.js";

/**
 * @param {{ USE_MOCK:boolean, WS_URL:string, WS_NORMALIZE:boolean, DEBUG_WS?:boolean }} cfg
 */
export function createDataService(cfg) {
    if (cfg.USE_MOCK) return new MockDataService();
    return new WebSocketService(cfg.WS_URL, {
        normalize: cfg.WS_NORMALIZE,
        debug: cfg.DEBUG_WS,
    });
}
