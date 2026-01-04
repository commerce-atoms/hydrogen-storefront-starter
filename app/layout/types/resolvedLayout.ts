import type {BreadcrumbItem} from './breadcrumb';

export interface ResolvedLayoutData {
  pageTitle?: string;
  breadcrumb?: BreadcrumbItem[];
  pageHeader?: {
    title?: string;
    description?: string;
    image?: string;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonical?: string;
  };
  layoutVariant?: 'default' | 'shop';
}
