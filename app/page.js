"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadVideos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setVideos(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>Vidzora</h1>
          <p style={styles.subtitle}>
            Watch • Share • Connect
          </p>
        </div>

        <div style={styles.actions}>
          <a href="/upload" style={styles.upload}>
            + Upload
          </a>

          <a href="/profile" style={styles.profile}>
            Profile
          </a>
        </div>
      </header>

      <section style={styles.feed}>
        {loading && (
          <div style={styles.center}>
            Loading videos...
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div style={styles.empty}>
            <h2>No approved videos yet</h2>
            <p>Upload the first video to Vidzora.</p>

            <a
              href="/upload"
              style={styles.primaryButton}
            >
              Upload Video
            </a>
          </div>
        )}

        {!loading &&
          videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
            />
          ))}
      </section>
    </main>
  );
}

function VideoCard({ video }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLoading, setVideoLoading] =
    useState(true);

  const [views, setViews] = useState(
    Number(video.views || 0)
  );

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] =
    useState("");

  const [commentLoading, setCommentLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  useEffect(() => {
    loadVideoData();
    getSecureVideoUrl();
  }, []);

  async function getSecureVideoUrl() {
    try {
      const response = await fetch(
        "/api/video-url",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoPath: video.video_url,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.url) {
        setVideoUrl(result.url);
      }
    } catch (error) {
      console.error(error);
    }

    setVideoLoading(false);
  }

  async function loadVideoData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { count: likeCount } =
      await supabase
        .from("video_likes")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("video_id", video.id);

    setLikes(likeCount || 0);

    const { data: commentData } =
      await supabase
        .from("video_comments")
        .select(`
          id,
          comment,
          created_at,
          user_id
        `)
        .eq("video_id", video.id)
        .order("created_at", {
          ascending: false,
        });

    setComments(commentData || []);

    if (user) {
      const { data: existingLike } =
        await supabase
          .from("video_likes")
          .select("id")
          .eq("video_id", video.id)
          .eq("user_id", user.id)
          .maybeSingle();

      setLiked(!!existingLike);
    }
  }

  async function handleLike() {
    if (actionLoading) return;

    setActionLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      setActionLoading(false);
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
        setLikes((value) =>
          Math.max(0, value - 1)
        );
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
        setLikes((value) => value + 1);
      }
    }

    setActionLoading(false);
  }

  async function addComment(e) {
    e.preventDefault();

    if (!commentText.trim()) return;

    setCommentLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      setCommentLoading(false);
      return;
    }

    const { data, error } =
      await supabase
        .from("video_comments")
        .insert({
          video_id: video.id,
          user_id: user.id,
          comment: commentText.trim(),
        })
        .select(`
          id,
          comment,
          created_at,
          user_id
        `)
        .single();

    if (!error && data) {
      setComments((old) => [
        data,
        ...old,
      ]);

      setCommentText("");
    } else {
      console.error(error);
    }

    setCommentLoading(false);
  }

  async function registerView() {
    try {
      const response = await fetch(
        "/api/video-view",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId: video.id,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.views !== undefined) {
        setViews(result.views);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <article style={styles.card}>
      <div style={styles.videoBox}>
        {videoLoading && (
          <div style={styles.videoLoading}>
            Loading video...
          </div>
        )}

        {!videoLoading && videoUrl && (
          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            style={styles.video}
            onPlay={registerView}
          />
        )}

        {!videoLoading && !videoUrl && (
          <div style={styles.videoLoading}>
            Video unavailable
          </div>
        )}
      </div>

      <div style={styles.content}>
        <h2 style={styles.title}>
          {video.title}
        </h2>

        {video.description && (
          <p style={styles.description}>
            {video.description}
          </p>
        )}

        <div style={styles.stats}>
          👁️ {views} Views
          {" • "}
          ❤️ {likes} Likes
          {" • "}
          💬 {comments.length} Comments
        </div>

        <div style={styles.buttons}>
          <button
            onClick={handleLike}
            disabled={actionLoading}
            style={{
              ...styles.button,
              ...(liked
                ? styles.liked
                : {}),
            }}
          >
            {liked ? "❤️ Liked" : "🤍 Like"}
          </button>

          <button
            onClick={() =>
              document
                .getElementById(
                  `comment-${video.id}`
                )
                ?.focus()
            }
            style={styles.button}
          >
            💬 Comment
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: video.title,
                  url:
                    window.location.origin +
                    "/video/" +
                    video.id,
                });
              } else {
                navigator.clipboard.writeText(
                  window.location.origin +
                    "/video/" +
                    video.id
                );

                alert("Video link copied.");
              }
            }}
            style={styles.button}
          >
            ↗️ Share
          </button>
        </div>

        <form
          onSubmit={addComment}
          style={styles.commentForm}
        >
          <input
            id={`comment-${video.id}`}
            value={commentText}
            onChange={(e) =>
              setCommentText(e.target.value)
            }
            placeholder="Write a comment..."
            style={styles.commentInput}
          />

          <button
            type="submit"
            disabled={commentLoading}
            style={styles.commentButton}
          >
            {commentLoading
              ? "..."
              : "Send"}
          </button>
        </form>

        {comments.length > 0 && (
          <div style={styles.comments}>
            {comments.slice(0, 10).map(
              (item) => (
                <div
                  key={item.id}
                  style={styles.comment}
                >
                  <strong>User</strong>

                  <div>
                    {item.comment}
                  </div>
                </div>
              )
            )}

            {comments.length > 10 && (
              <p style={styles.more}>
                Showing latest 10 comments
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    paddingBottom: "40px",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#fff",
    borderBottom:
      "1px solid #e5e7eb",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  logo: {
    margin: 0,
    fontSize: "25px",
  },

  subtitle: {
    margin: "3px 0 0",
    color: "#6b7280",
    fontSize: "12px",
  },

  actions: {
    display: "flex",
    gap: "8px",
  },

  upload: {
    textDecoration: "none",
    background: "#111827",
    color: "#fff",
    padding: "9px 13px",
    borderRadius: "9px",
    fontWeight: "700",
    fontSize: "13px",
  },

  profile: {
    textDecoration: "none",
    background: "#f3f4f6",
    color: "#111827",
    padding: "9px 13px",
    borderRadius: "9px",
    fontWeight: "600",
    fontSize: "13px",
  },

  feed: {
    width: "100%",
    maxWidth: "700px",
    margin: "20px auto",
    padding: "0 12px",
    boxSizing: "border-box",
  },

  card: {
    background: "#fff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "16px",
    marginBottom: "20px",
    overflow: "hidden",
  },

  videoBox: {
    width: "100%",
    aspectRatio: "16 / 9",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#000",
  },

  videoLoading: {
    color: "#fff",
    fontSize: "14px",
  },

  content: {
    padding: "16px",
  },

  title: {
    margin: "0 0 8px",
    fontSize: "20px",
  },

  description: {
    color: "#6b7280",
    lineHeight: 1.5,
    margin: "0 0 12px",
  },

  stats: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "12px",
  },

  buttons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  button: {
    border: 0,
    background: "#f3f4f6",
    padding: "9px 12px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
  },

  liked: {
    background: "#fee2e2",
  },

  commentForm: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
  },

  commentInput: {
    flex: 1,
    minWidth: 0,
    padding: "11px",
    border:
      "1px solid #d1d5db",
    borderRadius: "9px",
    outline: "none",
  },

  commentButton: {
    border: 0,
    background: "#111827",
    color: "#fff",
    padding: "0 15px",
    borderRadius: "9px",
    fontWeight: "700",
  },

  comments: {
    marginTop: "15px",
  },

  comment: {
    padding: "10px 0",
    borderTop:
      "1px solid #f0f0f0",
    fontSize: "14px",
  },

  more: {
    color: "#6b7280",
    fontSize: "12px",
  },

  center: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
  },

  empty: {
    textAlign: "center",
    background: "#fff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "50px 20px",
  },

  primaryButton: {
    display: "inline-block",
    marginTop: "15px",
    background: "#111827",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: "700",
  },
};
