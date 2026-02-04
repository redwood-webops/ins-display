import React from 'react';
import { MediaType, type Post } from './types/post';
import styles from './InsCard.module.scss';

interface Props {
  post: Post;
}

function Media({ post }: Props) {
  if (post.media_type === MediaType.IMAGE) {
    return <img className={styles.media} src={post.media_url ?? undefined} />;
  }
  if (post.media_type === MediaType.VIDEO) {
    return <video autoPlay loop muted className={styles.media} src={post.media_url ?? undefined} />;
  }
  return null;
}

function InsCard({ post }: Props) {
  const caption = post.caption && <div className={styles.captionContainer}>{post.caption}</div>;

  // Carousel.
  if (post.children) {
    return (
      <div className={styles.card}>
        <div>
          {post.children.map((child) => (
            <Media post={child} key={post.id} />
          ))}
        </div>
        {caption}
      </div>
    );
  }

  // Image or video.
  return (
    <div className={styles.card}>
      <Media post={post} />
      {caption}
    </div>
  );
}

export default InsCard;
