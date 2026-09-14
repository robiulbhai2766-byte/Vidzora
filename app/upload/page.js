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

    if (!title.trim()) {
      setMessage("Please enter a video title.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // ------------------------------------------
      // 1. Upload video
      // ------------------------------------------

      const videoPath =
        `${user.id}/${Date.now()}-${videoFile.name}`;

      const { error: videoError } =
        await supabase.storage
          .from("videos")
          .upload(videoPath, videoFile);

      if (videoError) {
        setMessage(videoError.message);
        setLoading(false);
        return;
      }

      // ------------------------------------------
      // 2. Upload thumbnail
      // ------------------------------------------

      let thumbnailUrl = null;

      if (thumbnailFile) {
        const thumbnailPath =
          `${user.id}/${Date.now()}-${thumbnailFile.name}`;

        const { error: thumbnailError } =
          await supabase.storage
            .from("thumbnails")
            .upload(
              thumbnailPath,
              thumbnailFile
            );

        if (!thumbnailError) {
          const { data } =
            supabase.storage
              .from("thumbnails")
              .getPublicUrl(
                thumbnailPath
              );

          thumbnailUrl = data.publicUrl;
        }
      }

      // ------------------------------------------
      // 3. Create video record
      // ------------------------------------------

      const { data: video, error } =
        await supabase
          .from("videos")
          .insert({
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            video_url: videoPath,
            thumbnail_url: thumbnailUrl,

            status: "pending",

            moderation_status: "pending",
            monetization_status: "pending",

            ai_generated: false,

            content_risk_score: 0,
            similarity_score: 0,

            moderation_reason:
              "Waiting for automatic checking.",

            checked_at: null,
          })
          .select("id")
          .single();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      // ------------------------------------------
      // 4. Get current session
      // ------------------------------------------

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage(
          "Video uploaded, but security session expired."
        );

        setLoading(false);
        return;
      }

      // ------------------------------------------
      // 5. Start automatic AI checking
      // ------------------------------------------

      const moderationResponse =
        await fetch(
          "/api/moderation/check",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              videoId: video.id,
            }),
          }
        );

      const moderationResult =
        await moderationResponse.json();

      // ------------------------------------------
      // 6. Result
      // ------------------------------------------

      if (!moderationResponse.ok) {
        setMessage(
          "Video uploaded. Automatic checking could not start. Please try again later."
        );

        setLoading(false);
        return;
      }

      if (
        moderationResult.moderationStatus ===
        "approved"
      ) {
        setMessage(
          "Video uploaded and approved."
        );
      } else if (
        moderationResult.moderationStatus ===
        "rejected"
      ) {
        setMessage(
          "Video was rejected by the automatic safety check."
        );
      } else {
        setMessage(
          "Video uploaded successfully. It is now under automatic review."
        );
      }

      // ------------------------------------------
      // 7. Reset form
      // ------------------------------------------

      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);

      const videoInput =
        document.getElementById(
          "video-file"
        );

      const thumbnailInput =
        document.getElementById(
          "thumbnail-file"
        );

      if (videoInput) {
        videoInput.value = "";
      }

      if (thumbnailInput) {
        thumbnailInput.value = "";
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong. Please try again."
      );
    }

    setLoading(false);
  }

  return (
    <main style={styles.page}>
      <form
        onSubmit={handleUpload}
        style={styles.card}
      >
        <h1>Upload to Vidzora</h1>

        <p style={styles.info}>
          Every video is automatically checked
          before monetization.
        </p>

        <label>Video Title</label>

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Enter video title"
          required
          style={styles.input}
        />

        <label>Description</label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Describe your video"
          rows="5"
          style={styles.input}
        />

        <label>Video</label>

        <input
          id="video-file"
          type="file"
          accept="video/*"
          onChange={(e) =>
            setVideoFile(
              e.target.files?.[0] || null
            )
          }
          required
          style={styles.file}
        />

        <label>Thumbnail</label>

        <input
          id="thumbnail-file"
          type="file"
          accept="image/*"
          onChange={(e) =>
            setThumbnailFile(
              e.target.files?.[0] || null
            )
          }
          style={styles.file}
        />

        <button
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? "Uploading & Checking..."
            : "Upload Video"}
        </button>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <div style={styles.security}>
          🛡️ Automatic Security Check
          <br />
          🔍 Content Risk Analysis
          <br />
          ♻️ Similarity Check
          <br />
          💰 Monetization Eligibility
        </div>

        <a
          href="/"
          style={styles.home}
        >
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
    lineHeight: 1.5,
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
    cursor: "pointer",
  },

  message: {
    marginTop: "15px",
    padding: "12px",
    background: "#f3f4f6",
    borderRadius: "10px",
    lineHeight: 1.5,
  },

  security: {
    marginTop: "18px",
    padding: "14px",
    background: "#f9fafb",
    borderRadius: "10px",
    fontSize: "13px",
    lineHeight: 1.8,
  },

  home: {
    display: "block",
    marginTop: "20px",
    textAlign: "center",
  },
};
