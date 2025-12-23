import {Link} from 'react-router';

import {Image} from '@shopify/hydrogen';

import {PaginatedResourceSection} from '@components/pagination/PaginatedResourceSection';

import styles from './blog-handle.view.module.css';

import type {ArticleItemFragment, BlogQuery} from 'storefrontapi.generated';

interface BlogHandleViewProps {
  blog: BlogQuery['blog'];
}

export function BlogHandleView({blog}: BlogHandleViewProps) {
  if (!blog) return null;
  const {articles} = blog;

  return (
    <div className={styles.blog}>
      <h1>{blog.title}</h1>
      <div className={styles.blogsGrid}>
        <PaginatedResourceSection<ArticleItemFragment> connection={articles}>
          {({node: article, index}) => (
            <ArticleItem
              article={article}
              key={article.id}
              loading={index < 2 ? 'eager' : 'lazy'}
            />
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}

function ArticleItem({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  const publishedAt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt!));
  return (
    <div className={styles.blogArticle} key={article.id}>
      <Link to={`/blogs/${article.blog.handle}/${article.handle}`}>
        {article.image && (
          <div className={styles.blogArticleImage}>
            <Image
              alt={article.image.altText || article.title}
              aspectRatio="3/2"
              data={article.image}
              loading={loading}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        )}
        <h3>{article.title}</h3>
        <small>{publishedAt}</small>
      </Link>
    </div>
  );
}
