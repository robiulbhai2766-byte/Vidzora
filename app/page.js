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

  async function addView(videoId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("video_views").insert({
      video_id: videoId,
      user_id: user.id,
      watch_seconds: 0,
      is_valid: false,
      fraud_score: 0,
    });
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
              <article className="vz-card" key={video.id}>
                <div className="vz-content">
                  <h2>{video.title}</h2>

                  {video.description && (
                    <p>{video.description}</p>
                  )}
                </div>

                <video
                  controls
                  preload="metadata"
                  poster={video.thumbnail_url || undefined}
                  onPlay={() => addView(video.id)}
                  style={{
                    width: "100%",
                    display: "block",
                    background: "#000",
                  }}
                >
                  <source src={video.video_url} />
                  Your browser does not support video playback.
                </video>

                <div className="vz-actions">
                  <button className="vz-action">
                    👍 Like
                  </button>

                  <button className="vz-action">
                    💬 Comment
                  </button>

                  <button className="vz-action">
                    ↗ Share
                  </button>

                  <button className="vz-action">
                    👁 {video.views_count || 0}
                  </button>
                </div>
              </article>
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
