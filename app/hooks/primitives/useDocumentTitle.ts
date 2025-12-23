import {useEffect} from 'react';

/**
 * Updates the document title when the value changes.
 * Useful for setting page titles based on route metadata or dynamic content.
 *
 * @param title - The title to set. If null/undefined, title remains unchanged.
 * @param suffix - Optional suffix to append (e.g., " | Store Name")
 *
 * @example
 * ```tsx
 * const {pageTitle} = useLoaderData();
 * useDocumentTitle(pageTitle, ' | My Store');
 * ```
 */
export function useDocumentTitle(
  title: string | null | undefined,
  suffix = '',
): void {
  useEffect(() => {
    if (title) {
      document.title = title + suffix;
    }
  }, [title, suffix]);
}
