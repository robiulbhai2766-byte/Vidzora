"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./globals.css";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (!error) {
      setVideos(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="vz-container">
        <h2>Loading Vidzora...</h2>
      </main>
    );
  }

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
          <a href="/upload">Upload</a>
          <a href="/profile">Profile</a>
          <a href="/login" className="vz-login">
            Login
          </a>
        </nav>
      </header>

      <main className="vz-container">
        <section className="vz-hero">
          <h1>Welcome to Vidzora</h1>
          <p>Create • Share • Watch • Earn</p>

          <a href="/upload" className="vz-create">
            Upload Content
          </a>
        </section>

        <section className="vz-feed">
          {videos.length === 0 ? (
            <div className="vz-card">
              <div className="vz-content">
                <h2>No videos yet</h2>
                <p>
                  Approved videos will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))
          )}
        </section>

        <footer className="vz-footer">
          © 2026 Vidzora — Create • Share • Watch • Earn
        </footer>
      </main>
    </>
  );
}

function VideoCard({ video }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [started, setStarted] = useState(false);

  async function getSecureVideoUrl() {
    if (videoUrl || loadingUrl) return;

    setLoadingUrl(true);

    try {
      const response = await fetch("/api/video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoPath: video.video_url,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setVideoUrl(result.url);
      }
    } finally {
      setLoadingUrl(false);
    }
  }

  async function startWatching() {
    await getSecureVideoUrl();
    setStarted(true);
  }

  return (
    <article className="vz-card">
      <div className="vz-content">
        <h2>{video.title}</h2>

        {video.description && <p>{video.description}</p>}
      </div>

      {!started ? (
        <button
          onClick={startWatching}
          disabled={loadingUrl}
          style={styles.watchButton}
        >
          {loadingUrl ? "Preparing video..." : "▶ Watch Video"}
        </button>
      ) : videoUrl ? (
        <video
          controls
          preload="metadata"
          poster={video.thumbnail_url || undefined}
          src={videoUrl}
          style={styles.video}
        />
      ) : (
        <div style={styles.error}>
          Unable to load video.
        </div>
      )}

      <div className="vz-actions">
        <button className="vz-action">👍 Like</button>
        <button className="vz-action">💬 Comment</button>
        <button className="vz-action">↗ Share</button>
        <button className="vz-action">
          👁 {video.views_count || 0}
        </button>
      </div>
    </article>
  );
}

const styles = {
  watchButton: {
    width: "100%",
    padding: "16px",
    border: 0,
    background: "#111827",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
  },

  video: {
    width: "100%",
    display: "block",
    background: "#000",
  },

  error: {
    padding: "30px",
    textAlign: "center",
  },
};
