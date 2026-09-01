/**
 * Shared between the inline boot script in the layout (server) and the toggle
 * (client). It must not live in a "use client" module: importing a value from
 * one on the server yields a reference proxy, not the string — which silently
 * corrupted the inline script.
 */
export const THEME_STORAGE_KEY = "noqta-theme";
