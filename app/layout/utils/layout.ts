import type {LayoutHandle} from '../types/handle';
import type {ResolvedLayoutData} from '../types/resolvedLayout';
import type {useMatches} from 'react-router';

/**
 * Extract and resolve layout metadata from matched routes.
 * Resolves breadcrumb functions and normalizes all metadata.
 *
 * Resolution strategy:
 * - Breadcrumb: Accumulated root→leaf (all matches contribute)
 * - pageTitle, pageHeader, seo, layoutVariant: Deepest route wins (leaf→root)
 */
export function getLayoutData(
  matches: ReturnType<typeof useMatches>,
): ResolvedLayoutData {
  const resolved: ResolvedLayoutData = {};
  const breadcrumbTrail: Array<{label: string; href: string}> = [];

  // Pass 1: Breadcrumb accumulation (root→leaf)
  // Process matches from root to leaf (matches are in order from root to leaf)
  for (const match of matches) {
    if (!match.handle || typeof match.handle !== 'object') {
      continue;
    }

    const handle = match.handle as Partial<LayoutHandle>;

    // Resolve breadcrumb - can be function, array, or single item
    if (handle.breadcrumb) {
      const breadcrumb =
        typeof handle.breadcrumb === 'function'
          ? handle.breadcrumb(match.data)
          : handle.breadcrumb;

      if (Array.isArray(breadcrumb)) {
        breadcrumbTrail.push(...breadcrumb);
      } else if (breadcrumb && 'label' in breadcrumb && 'href' in breadcrumb) {
        breadcrumbTrail.push(breadcrumb);
      }
    }
  }

  // Only set breadcrumb if trail has items
  if (breadcrumbTrail.length > 0) {
    resolved.breadcrumb = breadcrumbTrail;
  }

  // Pass 2: Deepest route wins (leaf→root)
  // Process matches from leaf to root (reverse order)
  for (const match of [...matches].reverse()) {
    if (!match.handle || typeof match.handle !== 'object') {
      continue;
    }

    const handle = match.handle as Partial<LayoutHandle>;

    // Deepest route wins for pageTitle
    if (handle.pageTitle && !resolved.pageTitle) {
      resolved.pageTitle = handle.pageTitle;
    }

    // Deepest route wins for pageHeader
    if (handle.pageHeader && !resolved.pageHeader) {
      resolved.pageHeader = handle.pageHeader;
    }

    // Deepest route wins for seo
    if (handle.seo && !resolved.seo) {
      resolved.seo = handle.seo;
    }

    // Deepest route wins for layoutVariant
    if (handle.layoutVariant && !resolved.layoutVariant) {
      resolved.layoutVariant = handle.layoutVariant;
    }
  }

  return resolved;
}
