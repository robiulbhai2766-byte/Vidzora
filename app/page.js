"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadVideos() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("videos")
      .select(`
        id,
        user_id,
        title,
        description,
        video_url,
        thumbnail_url,
        status,
        moderation_status,
        created_at
      `)
      .eq("moderation_status", "approved")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setMessage("ভিডিও লোড করা যাচ্ছে না।");
      setVideos([]);
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
            ভিডিও লোড হচ্ছে...
          </div>
        )}

        {!loading && message && (
          <div style={styles.center}>
            {message}
          </div>
        )}

        {!loading &&
          !message &&
          videos.length === 0 && (
            <div style={styles.empty}>
              <h2>এখনো কোনো approved video নেই</h2>
              <p>
                প্রথম ভিডিওটি আপলোড করুন।
              </p>

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
  const [loadingVideo, setLoadingVideo] =
    useState(true);

  useEffect(() => {
    async function getSecureVideoUrl() {
      try {
        const response = await fetch(
          "/api/video-url",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              videoPath: video.video_url,
            }),
          }
        );

        const result =
          await response.json();

        if (response.ok && result.url) {
          setVideoUrl(result.url);
        }
      } catch (error) {
        console.error(error);
      }

      setLoadingVideo(false);
    }

    getSecureVideoUrl();
  }, [video.video_url]);

  return (
    <article style={styles.card}>
      <div style={styles.videoBox}>
        {loadingVideo && (
          <div style={styles.videoLoading}>
            ভিডিও প্রস্তুত হচ্ছে...
          </div>
        )}

        {!loadingVideo && videoUrl && (
          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            style={styles.video}
          />
        )}

        {!loadingVideo && !videoUrl && (
          <div style={styles.videoLoading}>
            ভিডিও চালানো যাচ্ছে না।
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

        <div style={styles.meta}>
          <span>👁️ Views</span>
          <span>❤️ Like</span>
          <span>💬 Comment</span>
          <span>↗️ Share</span>
        </div>

        <div style={styles.buttons}>
          <button style={styles.button}>
            ❤️ Like
          </button>

          <button style={styles.button}>
            💬 Comment
          </button>

          <button
            style={styles.button}
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: video.title,
                  url:
                    window.location.origin +
                    "/video/" +
                    video.id,
                });
              }
            }}
          >
            ↗️ Share
          </button>
        </div>
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
    background: "#ffffff",
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

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
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
