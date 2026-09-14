"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(e) {
    e.preventDefault();

    if (!videoFile) {
      setMessage("Please select a video.");
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const videoPath = `${user.id}/${Date.now()}-${videoFile.name}`;

    const { error: videoError } = await supabase.storage
      .from("videos")
      .upload(videoPath, videoFile);

    if (videoError) {
      setLoading(false);
      setMessage(videoError.message);
      return;
    }

    let thumbnailUrl = null;

    if (thumbnailFile) {
      const thumbnailPath =
        `${user.id}/${Date.now()}-${thumbnailFile.name}`;

      const { error: thumbnailError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailPath, thumbnailFile);

      if (!thumbnailError) {
        const { data } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(thumbnailPath);

        thumbnailUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("videos").insert({
      user_id: user.id,
      title,
      description,
      video_url: videoPath,
      thumbnail_url: thumbnailUrl,
      status: "pending",
      monetization_status: "pending",
      ai_generated: false,
      ai_check_status: "pending",
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setDescription("");
    setVideoFile(null);
    setThumbnailFile(null);

    setMessage(
      "Video uploaded successfully. It is now waiting for automatic checking."
    );
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleUpload} style={styles.card}>
        <h1>Upload to Vidzora</h1>

        <p style={styles.info}>
          Your content will be checked before monetization.
        </p>

        <label>Video Title</label>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter video title"
          required
          style={styles.input}
        />

        <label>Description</label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your video"
          rows="5"
          style={styles.input}
        />

        <label>Video</label>

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          required
          style={styles.file}
        />

        <label>Thumbnail</label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setThumbnailFile(e.target.files?.[0] || null)
          }
          style={styles.file}
        />

        <button disabled={loading} style={styles.button}>
          {loading ? "Uploading..." : "Upload Video"}
        </button>

        {message && <p style={styles.message}>{message}</p>}

        <a href="/" style={styles.home}>
          ← Back to Home
        </a>
      </form>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px 15px",
  },

  card: {
    width: "100%",
    maxWidth: "600px",
    margin: "auto",
    background: "#fff",
    padding: "28px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },

  info: {
    color: "#6b7280",
  },

  input: {
    width: "100%",
    padding: "12px",
    margin: "8px 0 18px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    boxSizing: "border-box",
    fontSize: "15px",
  },

  file: {
    width: "100%",
    margin: "8px 0 20px",
  },

  button: {
    width: "100%",
    padding: "13px",
    background: "#111827",
    color: "#fff",
    border: 0,
    borderRadius: "10px",
    fontWeight: "700",
  },

  message: {
    marginTop: "15px",
  },

  home: {
    display: "block",
    marginTop: "20px",
    textAlign: "center",
  },
};
