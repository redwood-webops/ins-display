import React from 'react';
import type { Post } from './types/post';
import InsCard from './InsCard';
import styles from './App.module.scss';

function App() {
  const [post, setPost] = React.useState<Post | null>(null);

  React.useEffect(() => {
    (async () => {
      const idx = new URLSearchParams(window.location.search).get('idx') ?? '0';
      const resp = await fetch(`/api/posts?idx=${idx}`);
      const data = await resp.json();
      setPost(data);
    })();
  }, []);

  if (!post) {
    return null;
  }

  return (
    <div className={styles.postsContainer}>
      <InsCard post={post} />
    </div>
  );
}

export default App;
