import "./globals.css";

const demoPosts = [
  {
    user: "Vidzora Creator",
    title: "Welcome to Vidzora",
    text: "Create, share, watch and build your audience on Vidzora.",
    views: "0 views",
  },
  {
    user: "Vidzora Team",
    title: "Your Creator Journey Starts Here",
    text: "Upload original photos and videos. Valid content views can become eligible for monetization.",
    views: "0 views",
  },
];

export default function Home() {
  return (
    <>
      <header className="vz-header">
        <div className="vz-logo">Vidzora</div>

        <input
          className="vz-search"
          type="search"
          placeholder="Search Vidzora..."
        />

        <nav className="vz-nav">
          <a href="/">Home</a>
          <a href="/login" className="vz-login">
            Login
          </a>
        </nav>
      </header>

      <main className="vz-container">
        <section className="vz-hero">
          <h1>Welcome to Vidzora</h1>
          <p>Create • Share • Watch • Earn</p>

          <a href="/signup" className="vz-create">
            Create Account
          </a>
        </section>

        <section className="vz-feed">
          {demoPosts.map((post, index) => (
            <article className="vz-card" key={index}>
              <div className="vz-card-top">
                <div className="vz-avatar" />

                <div>
                  <div className="vz-user">{post.user}</div>
                  <div className="vz-time">Just now</div>
                </div>
              </div>

              <div className="vz-content">
                <h2>{post.title}</h2>
                <p>{post.text}</p>
              </div>

              <div className="vz-media">
                Video / Content
              </div>

              <div className="vz-actions">
                <button className="vz-action">👍 Like</button>
                <button className="vz-action">💬 Comment</button>
                <button className="vz-action">↗ Share</button>
                <button className="vz-action">👁 {post.views}</button>
              </div>
            </article>
          ))}
        </section>

        <footer className="vz-footer">
          © 2026 Vidzora — Create • Share • Watch • Earn
        </footer>
      </main>
    </>
  );
}
