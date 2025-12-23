import {getSchema} from '@shopify/hydrogen-codegen';

import type {IGraphQLConfig} from 'graphql-config';

/**
 * GraphQL Config
 * @see https://the-guild.dev/graphql/config/docs/user/usage
 */
export default {
  projects: {
    default: {
      schema: getSchema('storefront'),
      documents: ['./*.{ts,tsx,js,jsx}', './app/**/*.{ts,tsx,js,jsx}'],
    },
    // Uncomment when adding Customer Account API functionality
    // See: https://shopify.dev/docs/custom-storefronts/building-with-the-customer-account-api/hydrogen
    // customer: {
    //   schema: getSchema('customer-account'),
    //   documents: ['./app/modules/account/graphql/*.{ts,tsx,js,jsx}'],
    // },
  },
} as IGraphQLConfig;
