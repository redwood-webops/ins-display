import { useEffect, useState } from 'react';
import { MediaType, type Post } from './types/post';
import styles from './InsCard.module.scss';

interface Props {
  post: Post;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#F77737" />
          <stop offset="50%" stopColor="#F56040" />
          <stop offset="75%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#instagram-gradient)" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="4" stroke="url(#instagram-gradient)" strokeWidth="2" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="url(#instagram-gradient)" />
    </svg>
  );
}

function formatDate(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

function Header() {
  return (
    <div className={styles.header}>
      <InstagramIcon className={styles.instagramIcon} />
      <a href="https://www.instagram.com/redwoodkyudojo/" className={styles.username}>
        redwoodkyudojo
      </a>
    </div>
  );
}

function Footer({ post }: Props) {
  return (
    <div className={styles.footer}>
      <a href={post.permalink ?? '#'} className={styles.viewOnInstagram}>
        View this post on Instagram
      </a>
      <time className={styles.timestamp}>{formatDate(post.timestamp)}</time>
    </div>
  );
}

function InsCard({ post }: Props) {
  const caption = post.caption && <div className={styles.captionContainer}>{post.caption}</div>;

  // Carousel.
  if (post.children) {
    return (
      <div className={styles.card}>
        <Header />
        <Carousel>{post.children}</Carousel>
        {caption}
        <Footer post={post} />
      </div>
    );
  }

  // Image or video.
  return (
    <div className={styles.card}>
      <Header />
      <Media post={post} />
      {caption}
      <Footer post={post} />
    </div>
  );
}

export default InsCard;
