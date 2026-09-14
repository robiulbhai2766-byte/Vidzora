"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Account created successfully. Please check your email for verification."
    );
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleSignup} style={styles.card}>
        <h1>Join Vidzora</h1>
        <p>Create your account</p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        {message && <p style={styles.message}>{message}</p>}

        <a href="/login" style={styles.link}>
          Already have an account? Login
        </a>
      </form>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    padding: "30px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
  },
  input: {
    width: "100%",
    padding: "13px",
    marginTop: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: "16px",
    padding: "13px",
    border: 0,
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
  },
  message: {
    marginTop: "15px",
    fontSize: "14px",
  },
  link: {
    display: "block",
    marginTop: "18px",
    textAlign: "center",
    fontSize: "14px",
  },
};
