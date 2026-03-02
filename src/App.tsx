import React from 'react';
import type { Post } from './types/post';
import InsCard from './InsCard';
import styles from './App.module.scss';

function App() {
  const [posts, setPosts] = React.useState<Post[]>([]);

  React.useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const idx = params.get('idx') ?? '0';
      const range = params.get('range') ?? '1';
      const resp = await fetch(`/api/posts?idx=${idx}&range=${range}`);
      const data = await resp.json();
      setPosts(data);
    })();
  }, []);

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className={styles.postsContainer}>
      <InsCard posts={posts} />
    </div>
  );
}

export default App;
