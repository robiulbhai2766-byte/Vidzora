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

    if (!error) setVideos(data || []);
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
          <a href="/chat">Chat</a>
          <a href="/profile">Profile</a>
          <a href="/withdraw">Withdraw</a>
          <a href="/login">Login</a>
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

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    loadLikes();
  }, []);

  async function loadLikes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { count } = await supabase
      .from("video_likes")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("video_id", video.id);

    setLikeCount(count || 0);

    if (user) {
      const { data } = await supabase
        .from("video_likes")
        .select("id")
        .eq("video_id", video.id)
        .eq("user_id", user.id)
        .maybeSingle();

      setLiked(!!data);
    }
  }

  async function toggleLike() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (liked) {
      const { error } = await supabase
        .from("video_likes")
        .delete()
        .eq("video_id", video.id)
        .eq("user_id", user.id);

      if (!error) {
        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      }
    } else {
      const { error } = await supabase
        .from("video_likes")
        .insert({
          video_id: video.id,
          user_id: user.id,
        });

      if (!error) {
        setLiked(true);
        setLikeCount((count) => count + 1);
      }
    }
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("video_comments")
      .select("*")
      .eq("video_id", video.id)
      .order("created_at", {
        ascending: true,
      });

    if (!error) {
      setComments(data || []);
    }
  }

  async function toggleComments() {
    const nextState = !showComments;

    setShowComments(nextState);

    if (nextState) {
      await loadComments();
    }
  }

  async function submitComment(e) {
    e.preventDefault();

    const text = commentText.trim();

    if (!text) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setSendingComment(true);

    const { error } = await supabase
      .from("video_comments")
      .insert({
        video_id: video.id,
        user_id: user.id,
        comment: text,
      });

    setSendingComment(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCommentText("");
    await loadComments();
  }

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
      } else {
        alert(result.error || "Unable to load video");
      }
    } finally {
      setLoadingUrl(false);
    }
  }

  return (
    <article className="vz-card">
      <div className="vz-content">
        <h2>{video.title}</h2>

        {video.description && (
          <p>{video.description}</p>
        )}
      </div>

      {!videoUrl ? (
        <button
          onClick={getSecureVideoUrl}
          disabled={loadingUrl}
          style={styles.watchButton}
        >
          {loadingUrl
            ? "Preparing video..."
            : "▶ Watch Video"}
        </button>
      ) : (
        <video
          controls
          preload="metadata"
          poster={video.thumbnail_url || undefined}
          src={videoUrl}
          style={styles.video}
        />
      )}

      <div className="vz-actions">
        <button
          className="vz-action"
          onClick={toggleLike}
        >
          {liked ? "❤️" : "👍"} {likeCount}
        </button>

        <button
          className="vz-action"
          onClick={toggleComments}
        >
          💬 Comments
        </button>

        <button
          className="vz-action"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: video.title,
                text: video.description || "",
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(
                window.location.href
              );
              alert("Link copied");
            }
          }}
        >
          ↗ Share
        </button>

        <span className="vz-action">
          👁 {video.views_count || 0}
        </span>
      </div>

      {showComments && (
        <div style={styles.comments}>
          <h3>Comments</h3>

          <form
            onSubmit={submitComment}
            style={styles.commentForm}
          >
            <input
              value={commentText}
              onChange={(e) =>
                setCommentText(e.target.value)
              }
              maxLength={1000}
              placeholder="Write a comment..."
              style={styles.commentInput}
            />

            <button
              type="submit"
              disabled={sendingComment}
              style={styles.commentButton}
            >
              {sendingComment ? "..." : "Send"}
            </button>
          </form>

          {comments.length === 0 ? (
            <p style={styles.empty}>
              No comments yet.
            </p>
          ) : (
            comments.map((item) => (
              <div
                key={item.id}
                style={styles.comment}
              >
                {item.comment}
              </div>
            ))
          )}
        </div>
      )}
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

  comments: {
    padding: "15px",
    borderTop: "1px solid #e5e7eb",
  },

  commentForm: {
    display: "flex",
    gap: "8px",
    marginBottom: "15px",
  },

  commentInput: {
    flex: 1,
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
  },

  commentButton: {
    padding: "0 16px",
    border: 0,
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
  },

  comment: {
    padding: "10px",
    marginBottom: "8px",
    background: "#f3f4f6",
    borderRadius: "10px",
  },

  empty: {
    color: "#6b7280",
  },
};
