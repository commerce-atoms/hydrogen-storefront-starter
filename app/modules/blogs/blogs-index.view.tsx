import {Link} from 'react-router';

import {PaginatedResourceSection} from '@components/pagination/PaginatedResourceSection';

import styles from './blogs-index.view.module.css';

import type {BlogsQuery} from 'storefrontapi.generated';

interface BlogsIndexViewProps {
  blogs: BlogsQuery['blogs'];
}

export function BlogsIndexView({blogs}: BlogsIndexViewProps) {
  return (
    <div className={styles.blogs}>
      <h1>Blogs</h1>
      <div className={styles.blogsGrid}>
        <PaginatedResourceSection connection={blogs}>
          {({node: blog}: {node: BlogsQuery['blogs']['nodes'][0]}) => (
            <Link
              key={blog.handle}
              prefetch="intent"
              to={`/blogs/${blog.handle}`}
            >
              <h2>{blog.title}</h2>
            </Link>
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}
