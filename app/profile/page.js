"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUser(user);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <main style={styles.center}>Loading...</main>;
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.cover}>
          {profile?.cover_url && (
            <img
              src={profile.cover_url}
              alt="Cover"
              style={styles.coverImage}
            />
          )}
        </div>

        <div style={styles.avatar}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              style={styles.avatarImage}
            />
          ) : (
            "👤"
          )}
        </div>

        <div style={styles.content}>
          <h1>{profile?.full_name || "Vidzora User"}</h1>

          <p style={styles.username}>
            @{profile?.username || "user"}
          </p>

          <p>{profile?.bio || "Welcome to my Vidzora profile."}</p>

          <div style={styles.stats}>
            <div>
              <strong>0</strong>
              <span>Followers</span>
            </div>

            <div>
              <strong>0</strong>
              <span>Following</span>
            </div>

            <div>
              <strong>0</strong>
              <span>Videos</span>
            </div>
          </div>

          <div style={styles.actions}>
            <a href="/">Home</a>
            <button onClick={logout}>Logout</button>
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
    borderRadius: "50%",
    background: "#e5e7eb",
    border: "4px solid white",
    marginTop: "-50px",
    marginLeft: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    overflow: "hidden",
    position: "relative",
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

  stats: {
    display: "flex",
    gap: "35px",
    marginTop: "25px",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "25px",
  },
};
