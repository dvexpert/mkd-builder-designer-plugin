declare module "*.svg?raw" {
    const content: string;
    export default content;
}

declare module "*.html?raw" {
    const content: string;
    export default content;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BUILDING_FOR_DEMO: string;
    readonly VITE_NODE_ENVIRONMENT: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
