import { useEffect, useState } from 'react';
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

function Carousel({ children }: { children: Post[] }) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i === 0 ? children.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === children.length - 1 ? 0 : i + 1));

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [children.length]);

  return (
    <div className={styles.carousel}>
      <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
        {children.map((child) => (
          <Media post={child} key={child.id} />
        ))}
      </div>
      <button className={`${styles.chevron} ${styles.chevronLeft}`} onClick={prev}>‹</button>
      <button className={`${styles.chevron} ${styles.chevronRight}`} onClick={next}>›</button>
    </div>
  );
}

function InsCard({ post }: Props) {
  const caption = post.caption && <div className={styles.captionContainer}>{post.caption}</div>;

  // Carousel.
  if (post.children) {
    return (
      <div className={styles.card}>
        <Carousel>{post.children}</Carousel>
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
