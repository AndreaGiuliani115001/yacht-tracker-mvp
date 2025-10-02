export const DEFAULT_CENTER = [43.2094, 13.1455];
export const DEFAULT_ZOOM = 2;

// Endpoints: online e offline. OFFLINE deve esistere anche senza rete.
export const TILE_SOURCES = {
    OFFLINE_XYZ: {
        id: "OFFLINE_XYZ",
        url: "/tiles/{z}/{x}/{y}.png",
        attribution: "Offline tiles",
        isAvailableOffline: true,
    },
    ONLINE_OSM: {
        id: "ONLINE_OSM",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors",
    },
    ONLINE_OPENSEA: {
        id: "ONLINE_OPENSEA",
        url: "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
        attribution: "Map data © OpenSeaMap contributors",
        overlay: true,
    },
};