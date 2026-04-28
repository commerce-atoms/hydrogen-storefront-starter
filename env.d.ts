/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

// Extend the Env interface from @shopify/oxygen-workers-types
declare global {
  interface Env {
    // Shopify Store Configuration
    PUBLIC_STORE_DOMAIN: string;
    PUBLIC_STORE_FRONTEND_DOMAIN?: string;

    // Storefront API Configuration
    PUBLIC_STOREFRONT_ID: string;
    PUBLIC_STOREFRONT_API_VERSION?: string;

    // Storefront API Tokens
    PRIVATE_STOREFRONT_API_TOKEN: string; // Required by Hydrogen (recommended)
    PUBLIC_STOREFRONT_API_TOKEN: string; // Required by Hydrogen

    // Checkout Configuration
    PUBLIC_CHECKOUT_DOMAIN: string;

    // Internationalization / Market Defaults
    PUBLIC_DEFAULT_LOCALE?: string;
    PUBLIC_DEFAULT_COUNTRY?: string;

    // Session & Security
    SESSION_SECRET: string;
  }
}
