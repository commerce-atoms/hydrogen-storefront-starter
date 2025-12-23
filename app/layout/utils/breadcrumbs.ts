import type {BreadcrumbItem} from '../types/breadcrumb';

export function breadcrumb(label: string, href: string): BreadcrumbItem {
  return {label, href};
}
