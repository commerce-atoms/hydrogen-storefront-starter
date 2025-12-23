import {Image} from '@shopify/hydrogen';

import styles from './article-handle.view.module.css';

import type {ArticleQuery} from 'storefrontapi.generated';

interface ArticleHandleViewProps {
  article: NonNullable<NonNullable<ArticleQuery['blog']>['articleByHandle']>;
}

export function ArticleHandleView({article}: ArticleHandleViewProps) {
  const {title, image, contentHtml, author} = article;

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <div className={styles.article}>
      <h1 className={styles.articleHeader}>
        {title}
        <div>
          <time dateTime={article.publishedAt}>{publishedDate}</time> &middot;{' '}
          <address>{author?.name}</address>
        </div>
      </h1>

      {image && <Image data={image} sizes="90vw" loading="eager" />}
      <div
        dangerouslySetInnerHTML={{__html: contentHtml}}
        className={styles.articleContent}
      />
    </div>
  );
}
