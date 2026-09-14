"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [binanceUid, setBinanceUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitWithdrawal(e) {
    e.preventDefault();
    setMessage("");

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Enter a valid withdrawal amount.");
      return;
    }

    if (numericAmount < 10) {
      setMessage("Minimum withdrawal is $10.");
      return;
    }

    if (!binanceUid.trim()) {
      setMessage("Enter your Binance UID.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      window.location.href = "/login";
      return;
    }

    /*
      IMPORTANT:
      The actual withdrawal request must be created
      by a secure server-side API.

      Do NOT insert directly into withdrawal_requests
      from the browser.
    */

    setLoading(false);

    setMessage(
      "Withdrawal form is ready. Secure server-side withdrawal processing will be connected next."
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1>Withdraw</h1>

        <p style={styles.info}>
          Withdraw your eligible Vidzora earnings through Binance.
        </p>

        <form onSubmit={submitWithdrawal}>
          <label>Withdrawal Amount (USD)</label>

          <input
            type="number"
            min="10"
            step="0.01"
            placeholder="Minimum $10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
            required
          />

          <label>Binance UID</label>

          <input
            type="text"
            placeholder="Enter Binance UID"
            value={binanceUid}
            onChange={(e) => setBinanceUid(e.target.value)}
            style={styles.input}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Checking..." : "Request Withdrawal"}
          </button>
        </form>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <div style={styles.note}>
          <strong>Security:</strong>
          <br />
          Every withdrawal will pass balance and fraud checks
          before processing.
        </div>

        <a href="/" style={styles.home}>
          ← Back to Vidzora
        </a>
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

  card: {
    width: "100%",
    maxWidth: "500px",
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
    padding: "13px",
    margin: "8px 0 18px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    boxSizing: "border-box",
    fontSize: "15px",
  },

  button: {
    width: "100%",
    padding: "13px",
    border: 0,
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
  },

  message: {
    marginTop: "18px",
    padding: "12px",
    background: "#f3f4f6",
    borderRadius: "10px",
    fontSize: "14px",
  },

  note: {
    marginTop: "20px",
    padding: "14px",
    background: "#f9fafb",
    borderRadius: "10px",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  home: {
    display: "block",
    marginTop: "20px",
    textAlign: "center",
  },
};
