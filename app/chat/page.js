"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeChat();
  }, []);

  async function initializeChat() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUser(user);

    const { data, error } = await supabase
      .from("conversation_members")
      .select("conversation_id, joined_at")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (!error) {
      setMemberships(data || []);
    }

    setLoading(false);
  }

  async function openChat(conversationId) {
    setSelectedChat(conversationId);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  async function sendMessage(e) {
    e.preventDefault();

    const text = message.trim();

    if (!text || !selectedChat || !user) {
      return;
    }

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedChat,
        sender_id: user.id,
        message: text,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setMessage("");

    openChat(selectedChat);
  }

  if (loading) {
    return (
      <main style={styles.center}>
        Loading Chat...
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.chatBox}>
        <header style={styles.header}>
          <strong>Vidzora Chat</strong>

          <a href="/" style={styles.home}>
            Home
          </a>
        </header>

        <div style={styles.body}>
          <aside style={styles.sidebar}>
            <h3>Chats</h3>

            {memberships.length === 0 ? (
              <p style={styles.empty}>
                No conversations yet.
              </p>
            ) : (
              memberships.map((chat) => (
                <button
                  key={chat.conversation_id}
                  onClick={() =>
                    openChat(chat.conversation_id)
                  }
                  style={{
                    ...styles.chatButton,
                    ...(selectedChat === chat.conversation_id
                      ? styles.activeChat
                      : {}),
                  }}
                >
                  💬 Conversation
                </button>
              ))
            )}
          </aside>

          <section style={styles.messagesArea}>
            {!selectedChat ? (
              <div style={styles.selectMessage}>
                <h2>Welcome to Vidzora Chat</h2>
                <p>
                  Select a conversation to start messaging.
                </p>
              </div>
            ) : (
              <>
                <div style={styles.messages}>
                  {messages.length === 0 ? (
                    <p>No messages yet.</p>
                  ) : (
                    messages.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          ...styles.message,
                          ...(item.sender_id === user.id
                            ? styles.myMessage
                            : styles.otherMessage),
                        }}
                      >
                        {item.message}
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  style={styles.form}
                >
                  <input
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value)
                    }
                    placeholder="Write a message..."
                    style={styles.input}
                  />

                  <button
                    type="submit"
                    style={styles.send}
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "15px",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  chatBox: {
    width: "100%",
    maxWidth: "1000px",
    height: "calc(100vh - 30px)",
    margin: "auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    overflow: "hidden",
  },

  header: {
    height: "60px",
    padding: "0 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #e5e7eb",
  },

  home: {
    textDecoration: "none",
  },

  body: {
    height: "calc(100% - 60px)",
    display: "flex",
  },

  sidebar: {
    width: "260px",
    borderRight: "1px solid #e5e7eb",
    padding: "15px",
    overflowY: "auto",
  },

  chatButton: {
    width: "100%",
    padding: "12px",
    marginBottom: "8px",
    border: 0,
    borderRadius: "10px",
    background: "#f3f4f6",
    textAlign: "left",
  },

  activeChat: {
    background: "#e5e7eb",
  },

  empty: {
    color: "#6b7280",
    fontSize: "14px",
  },

  messagesArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  selectMessage: {
    margin: "auto",
    textAlign: "center",
    color: "#6b7280",
    padding: "20px",
  },

  messages: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
  },

  message: {
    maxWidth: "70%",
    padding: "10px 13px",
    borderRadius: "12px",
    marginBottom: "10px",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },

  myMessage: {
    marginLeft: "auto",
    background: "#111827",
    color: "#fff",
  },

  otherMessage: {
    marginRight: "auto",
    background: "#f3f4f6",
  },

  form: {
    display: "flex",
    gap: "8px",
    padding: "12px",
    borderTop: "1px solid #e5e7eb",
  },

  input: {
    flex: 1,
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    outline: "none",
  },

  send: {
    padding: "0 18px",
    border: 0,
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
  },
};
