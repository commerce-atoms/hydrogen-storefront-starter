# Adding a New Feature or Page

Step-by-step guide for adding new features while respecting architectural constraints.

**Use this guide when:**

- Adding a new page
- Introducing a new domain area
- Extending an existing module with a new route

**See Also:**

- [../reference/modules.md](../reference/modules.md) - Module structure and import rules
- [../reference/routing.md](../reference/routing.md) - Routing conventions
- [../governance/governance.md](../governance/governance.md) - Review checklist

---

## Step 1: Decide Module Ownership

Before creating files, answer: **Does this belong to an existing domain?**

### Extend Existing Module If:

- Feature is tightly coupled to an existing domain
- Would require frequent cross-module imports if separated
- Belongs to same business context (products, cart, account, etc.)

### Create New Module If:

- Feature represents a distinct domain boundary
- Can be developed and deleted independently
- Has minimal dependencies on other domains

**Prefer fewer, well-defined modules over many thin ones.**

---

## Step 2: Create Files (Start Flat)

### For a New Module

```bash
# Create module folder
mkdir -p app/modules/reviews

# Create route and view files
touch app/modules/reviews/reviews-index.route.tsx
touch app/modules/reviews/reviews-index.view.tsx
touch app/modules/reviews/reviews-index.view.module.css
```

**At this stage:**

- ❌ No `routes/` folder
- ❌ No `components/` folder
- ❌ No `graphql/` folder

**Only add what is required for the first route.**

### For Extending Existing Module

```bash
# Add route and view to existing module
touch app/modules/products/product-reviews.route.tsx
touch app/modules/products/product-reviews.view.tsx
touch app/modules/products/product-reviews.view.module.css
```

---

## Step 3: Create Route File

**File:** `{name}.route.tsx`

### Route Responsibilities

- ✅ Loader (data fetching)
- ✅ Action (form handling)
- ✅ Redirects and validation
- ✅ Error handling
- ✅ Metadata exports (SEO, breadcrumbs)
- ✅ Cache strategy

### Example

```typescript
// reviews-index.route.tsx
import type {LoaderFunctionArgs} from 'react-router';
import {ReviewsIndexView} from './reviews-index.view';

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;

  const {reviews} = await storefront.query(REVIEWS_QUERY, {
    cache: storefront.CacheShort(),
  });

  return {reviews};
}

export const handle = {
  breadcrumb: () => 'Reviews',
};

export default function ReviewsIndexRoute() {
  return <ReviewsIndexView />;
}
```

---

## Step 4: Create View File

**File:** `{name}.view.tsx`

### View Responsibilities

- ✅ UI rendering
- ✅ Composing module components
- ✅ Client-side interactions

### Example

```typescript
// reviews-index.view.tsx
import {useLoaderData} from 'react-router';
import type {loader} from './reviews-index.route';

export function ReviewsIndexView() {
  const {reviews} = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Customer Reviews</h1>
      {reviews.map((review) => (
        <article key={review.id}>
          <h2>{review.title}</h2>
          <p>{review.content}</p>
        </article>
      ))}
    </div>
  );
}
```

**Do not mix route and view responsibilities.**

---

## Step 5: Wire Route in Manifest

Open **`app/routes.ts`** and add your route.

### For UI Routes (Inside Layout)

```typescript
...prefix(':locale?', [
  layout('platform/routing/locale.route.tsx', [
    // Existing routes...
    route('reviews', 'modules/reviews/reviews-index.route.tsx'),
    // More routes...
  ]),
]),
```

### For Resource Routes (Outside Layout)

```typescript
export default hydrogenRoutes([
  // Resource routes
  route('api/reviews.json', 'modules/reviews/api.route.tsx'),

  // Layout routes...
]);
```

### Confirm

- ✅ URL pattern matches commerce conventions
- ✅ Layout nesting is intentional
- ✅ Route path is explicit

---

## Step 6: Add Data Access (If Needed)

### Create GraphQL Files

Only when you need data fetching:

```bash
# Create graphql folder
mkdir -p app/modules/reviews/graphql

# Create queries file
touch app/modules/reviews/graphql/queries.ts
```

### Example Query

```typescript
// graphql/queries.ts
export const REVIEWS_QUERY = `#graphql
  query Reviews($first: Int!) {
    reviews(first: $first) {
      nodes {
        id
        title
        content
        rating
        createdAt
      }
    }
  }
` as const;
```

**Rules:**

- Keep queries scoped to module's domain
- Do not import GraphQL files across modules
- Start consolidated (one `queries.ts` file)

---

## Step 7: Add Module Components (If Needed)

Only when UI complexity grows.

### Create Components Folder

```bash
mkdir -p app/modules/reviews/components
```

### Example Component

```typescript
// components/ReviewCard.tsx
import styles from './review-card.module.css';

export function ReviewCard({review}) {
  return (
    <article className={styles.card}>
      <h3>{review.title}</h3>
      <p>{review.content}</p>
      <div>Rating: {review.rating}/5</div>
    </article>
  );
}
```

**Module components:**

- ✅ May know about the domain
- ✅ May assume specific data shapes
- ❌ Must not fetch data
- ❌ Must not import other modules

---

## Step 8: Add Metadata for Layout

Export metadata from route for layout to consume.

### Example

```typescript
// reviews-index.route.tsx
export const handle = {
  breadcrumb: () => 'Reviews',
  pageHeader: () => ({
    title: 'Customer Reviews',
    subtitle: 'What our customers say',
  }),
};
```

**Layout responsibility:** Interpret metadata and render chrome.

**Route responsibility:** Provide metadata, not render chrome.

---

## Pre-Commit Checklist

Before committing your changes:

- [ ] ✅ Feature is inside the correct module
- [ ] ✅ Route is wired in `app/routes.ts`
- [ ] ✅ Route/view responsibilities are cleanly separated
- [ ] ✅ No cross-module imports
- [ ] ✅ CSS is colocated with components
- [ ] ✅ Structure added only where needed (no premature folders)
- [ ] ✅ TypeScript compiles without errors
- [ ] ✅ Route works in browser

---

## Common Mistakes to Avoid

### ❌ Creating Too Much Structure Up Front

```
# Don't create all these folders immediately
modules/reviews/
├── routes/          ❌ Only 1 route
├── components/      ❌ No components yet
├── graphql/         ❌ No queries yet
├── hooks/           ❌ No hooks yet
└── utils/           ❌ No utils yet
```

**Instead:** Start flat, add folders only when friction appears.

### ❌ Rendering Chrome in Views

```typescript
// ❌ BAD
export function ProductView() {
  return (
    <div>
      <Header />  {/* Don't render global chrome */}
      <div>{/* Product content */}</div>
      <Footer />  {/* Layout handles this */}
    </div>
  );
}
```

### ❌ Fetching Data in Views

```typescript
// ❌ BAD
export function ProductView() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch('/api/product').then(/* ... */); // Don't fetch in views
  }, []);
}
```

**Fix:** Fetch in loader, consume via `useLoaderData()`.

### ❌ Cross-Module Imports

```typescript
// ❌ BAD
import {ProductCard} from '@modules/products/components/ProductCard';
// in reviews module
```

**Fix:** Promote to `app/components/` or duplicate.

---

## Summary

**Adding features should be:**

- ✅ Incremental - Start flat, grow as needed
- ✅ Explicit - Wire routes manually in manifest
- ✅ Domain-owned - Keep related code together

This process keeps the codebase understandable as it grows.
