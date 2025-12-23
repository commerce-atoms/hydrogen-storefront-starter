import {useLoaderData} from 'react-router';

import {type Shop} from '@shopify/hydrogen/storefront-api-types';

import {buildPageMeta} from '@commerce-atoms/seo/meta/buildPageMeta';

import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {POLICY_CONTENT_QUERY} from './graphql/queries';
import {PolicyHandleView} from './policy-handle.view';

import type {Route} from './+types/policy-handle.route';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({data, ...args}) => {
  const request = (args as {request?: Request}).request;
  if (!data?.policy) {
    return [{title: 'Policy'}];
  }
  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url
    ? `${url.origin}/policies/${data.policy.handle}`
    : undefined;
  const seoMeta = buildPageMeta({
    title: data.policy.title || 'Policy',
    canonicalUrl,
  });
  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) => [
    breadcrumb('Policies', '/policies'),
    breadcrumb(data.policy.title, `/policies/${data.policy.handle}`),
  ],
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Could not find the policy', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();
  return <PolicyHandleView policy={policy} />;
}
