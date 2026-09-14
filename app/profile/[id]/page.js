"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function UserProfile({ params }) {
  const [profile, setProfile] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [videos, setVideos] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const userId = params.id;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (user.id === userId) {
      window.location.href = "/profile";
      return;
    }

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { count: followerCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: followingCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    const { count: videoCount } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved");

    const { data: followData } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .maybeSingle();

    setFollowers(followerCount || 0);
    setFollowing(followingCount || 0);
    setVideos(videoCount || 0);
    setIsFollowing(!!followData);

    setLoading(false);
  }

  async function toggleFollow() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !profile) return;

    if (isFollowing) {
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);

      if (!error) {
        setIsFollowing(false);
        setFollowers((value) => Math.max(0, value - 1));
      }
    } else {
      const { error } = await supabase
        .from("user_follows")
        .insert({
          follower_id: user.id,
          following_id: profile.id,
        });

      if (!error) {
        setIsFollowing(true);
        setFollowers((value) => value + 1);
      }
    }
  }

  if (loading) {
    return (
      <main style={styles.center}>
        Loading profile...
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={styles.center}>
        <h2>User not found</h2>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>

        <div style={styles.cover}>
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt=""
              style={styles.coverImage}
            />
          )}
        </div>

        <div style={styles.avatar}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={styles.avatarImage}
            />
          ) : (
            "👤"
          )}
        </div>

        <div style={styles.content}>
          <h1>
            {profile.full_name || "Vidzora User"}
          </h1>

          {profile.username && (
            <p style={styles.username}>
              @{profile.username}
            </p>
          )}

          <p>
            {profile.bio ||
              "Welcome to Vidzora."}
          </p>

          <button
            onClick={toggleFollow}
            style={styles.followButton}
          >
            {isFollowing ? "✓ Following" : "+ Follow"}
          </button>

          <div style={styles.stats}>
            <div>
              <strong>{followers}</strong>
              <span>Followers</span>
            </div>

            <div>
              <strong>{following}</strong>
              <span>Following</span>
            </div>

            <div>
              <strong>{videos}</strong>
              <span>Videos</span>
            </div>
          </div>

          <div style={styles.links}>
            <a href="/">Home</a>
            <a href="/chat">Chat</a>
            <a href="/profile">My Profile</a>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px 15px",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    maxWidth: "700px",
    margin: "auto",
    background: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },

  cover: {
    height: "200px",
    background: "#111827",
  },

  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  avatar: {
    width: "100px",
    height: "100px",
    marginTop: "-50px",
    marginLeft: "25px",
    borderRadius: "50%",
    border: "4px solid white",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  content: {
    padding: "15px 25px 30px",
  },

  username: {
    color: "#6b7280",
  },

  followButton: {
    padding: "11px 25px",
    border: 0,
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  stats: {
    display: "flex",
    gap: "35px",
    marginTop: "25px",
  },

  links: {
    display: "flex",
    gap: "15px",
    marginTop: "25px",
  },
};
