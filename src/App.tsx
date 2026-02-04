import React from 'react';
import type { Post } from './types/post';
import InsCard from './InsCard';
import styles from './App.module.scss';

function App() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  React.useEffect(() => {
    (async () => {
      const resp = await fetch('/api/posts');
      const data = await resp.json();
      setPosts(data);
    })();
  }, []);

  return (
    <div className={styles.postsContainer}>
      {posts.map((post) => (
        <div key={post.id}>
          <InsCard post={post} />
        </div>
      ))}
    </div>
  );
}

export default App;
