import {useLoaderData} from 'react-router';

import {buildPageMeta} from '@commerce-atoms/seo/meta/buildPageMeta';

import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {POLICIES_QUERY} from './graphql/queries';
import {PoliciesIndexView} from './policies-index.view';

import type {Route} from './+types/policies-index.route';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = ({...args}) => {
  const request = (args as {request?: Request}).request;
  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url ? `${url.origin}/policies` : undefined;
  const seoMeta = buildPageMeta({
    title: 'Policies',
    canonicalUrl,
  });
  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: () => breadcrumb('Policies', '/policies'),
};

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();
  return <PoliciesIndexView policies={policies} />;
}
