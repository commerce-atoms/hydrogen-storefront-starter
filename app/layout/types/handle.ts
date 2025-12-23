import type {BreadcrumbItem} from './breadcrumb';

export interface LayoutHandle {
  /** Page title for SEO and browser tab */
  pageTitle?: string;

  /** Breadcrumb trail for navigation
   * Can be an array of items, a single item, or a function that receives loader data
   */
  breadcrumb?:
    | BreadcrumbItem[]
    | BreadcrumbItem
    | ((data: unknown) => BreadcrumbItem[] | BreadcrumbItem);

  /** Optional page header data for hero sections */
  pageHeader?: {
    title?: string;
    description?: string;
    image?: string;
  };

  /** SEO-specific metadata */
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonical?: string;
  };
}
