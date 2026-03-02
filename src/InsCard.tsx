import { useEffect, useRef, useState } from 'react';
import { MediaType, type Post, type Media } from './types/post';
import styles from './InsCard.module.scss';

interface Props {
  posts: Post[];
}

function postsToMedia(posts: Post[]): Media[] {
  const items: Media[] = [];
  for (const post of posts) {
    if (post.media_type === MediaType.CAROUSEL && post.children) {
      for (const child of post.children) {
        items.push({
          id: child.id,
          caption: post.caption,
          media_url: child.media_url,
          media_type: child.media_type as 'IMAGE' | 'VIDEO',
          timestamp: post.timestamp,
        });
      }
    } else if (post.media_type !== MediaType.CAROUSEL) {
      items.push({
        id: post.id,
        caption: post.caption,
        media_url: post.media_url,
        media_type: post.media_type as 'IMAGE' | 'VIDEO',
        timestamp: post.timestamp,
      });
    }
  }
  return items;
}

function Media({ media }: { media: Media }) {
  if (media.media_type === 'IMAGE') {
    return <img className={styles.media} src={media.media_url ?? undefined} />;
  }
  if (media.media_type === 'VIDEO') {
    return (
      <video autoPlay loop muted className={styles.media} src={media.media_url ?? undefined} />
    );
  }
  return null;
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
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="url(#instagram-gradient)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="12" cy="12" r="4" stroke="url(#instagram-gradient)" strokeWidth="2" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="url(#instagram-gradient)" />
    </svg>
  );
}

interface CarouselProps {
  items: Media[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
}

function Carousel({ items, index, setIndex }: CarouselProps) {
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i === items.length - 1 ? 0 : i + 1));
      }, 5000);
    }
  };

  const prev = () => {
    setIndex((i) => (i === 0 ? items.length - 1 : i - 1));
    resetTimer();
  };

  const next = () => {
    setIndex((i) => (i === items.length - 1 ? 0 : i + 1));
    resetTimer();
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length]);

  return (
    <div className={styles.carousel}>
      <div className={styles.track} style={{ transform: `translateX(-${index * 400}px)` }}>
        {items.map((item) => (
          <Media media={item} key={item.id} />
        ))}
      </div>
      {items.length > 1 && (
        <>
          <button className={`${styles.chevron} ${styles.chevronLeft}`} onClick={prev}>
            ‹
          </button>
          <button className={`${styles.chevron} ${styles.chevronRight}`} onClick={next}>
            ›
          </button>
        </>
      )}
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

function Caption({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset to full text to measure
    el.textContent = text;

    // Check if text overflows
    if (el.scrollHeight <= el.clientHeight) {
      setDisplayText(text);
      return;
    }

    // Binary search for the right length
    let low = 0;
    let high = text.length;
    const ellipsis = '…';

    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      el.textContent = text.slice(0, mid) + ellipsis;
      if (el.scrollHeight > el.clientHeight) {
        high = mid - 1;
      } else {
        low = mid;
      }
    }

    setDisplayText(text.slice(0, low) + ellipsis);
  }, [text]);

  return (
    <div ref={ref} className={styles.captionContainer}>
      {displayText}
    </div>
  );
}

function InsCard({ posts }: Props) {
  const mediaList = postsToMedia(posts);
  const [index, setIndex] = useState(0);

  if (mediaList.length === 0) {
    return null;
  }

  const selectedMedia = mediaList[index];

  return (
    <div className={styles.card}>
      <Header />
      <Carousel items={mediaList} index={index} setIndex={setIndex} />
      {selectedMedia?.caption && <Caption text={selectedMedia.caption} />}
    </div>
  );
}

export default InsCard;
