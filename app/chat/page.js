"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const channelRef = useRef(null);

  useEffect(() => {
    initializeChat();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
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

    await loadMemberships();

    setLoading(false);
  }

  async function loadMemberships() {
    const { data, error } = await supabase
      .from("conversation_members")
      .select("conversation_id, joined_at")
      .eq("user_id", user?.id)
      .order("joined_at", { ascending: false });

    if (!error) {
      setMemberships(data || []);
    }
  }

  async function searchUsers(value) {
    setSearch(value);

    if (value.trim().length < 2) {
      setUsers([]);
      return;
    }

    setSearching(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setSearching(false);
      return;
    }

    const response = await fetch(
      `/api/chat/users?q=${encodeURIComponent(value.trim())}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await response.json();

    setUsers(result.users || []);
    setSearching(false);
  }

  async function startChat(otherUserId) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch(
      "/api/chat/conversation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          otherUserId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Unable to start chat");
      return;
    }

    setSearch("");
    setUsers([]);

    await loadMemberships();

    openChat(result.conversationId);
  }

  async function openChat(conversationId) {
    setSelectedChat(conversationId);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", {
        ascending: true,
      });

    if (!error) {
      setMessages(data || []);
    }

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => {
            const exists = current.some(
              (item) => item.id === payload.new.id
            );

            if (exists) return current;

            return [...current, payload.new];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
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
  }

  if (loading) {
    return (
      <main style={styles.center}>
        Loading Vidzora Chat...
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

        <div style={styles.searchBox}>
          <input
            value={search}
            onChange={(e) =>
              searchUsers(e.target.value)
            }
            placeholder="Search users..."
            style={styles.searchInput}
          />

          {searching && (
            <div style={styles.searchStatus}>
              Searching...
            </div>
          )}

          {users.length > 0 && (
            <div style={styles.results}>
              {users.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    startChat(item.id)
                  }
                  style={styles.userResult}
                >
                  <div style={styles.avatar}>
                    {item.avatar_url ? (
                      <img
                        src={item.avatar_url}
                        alt=""
                        style={styles.avatarImage}
                      />
                    ) : (
                      "👤"
                    )}
                  </div>

                  <div>
                    <strong>
                      {item.full_name ||
                        item.username ||
                        "Vidzora User"}
                    </strong>

                    {item.username && (
                      <div style={styles.username}>
                        @{item.username}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.body}>

          <aside style={styles.sidebar}>
            <h3>Chats</h3>

            {memberships.length === 0 ? (
              <p style={styles.empty}>
                Search a user above to start a chat.
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
                    ...(selectedChat ===
                    chat.conversation_id
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
                  Search for a user and start messaging.
                </p>
              </div>
            ) : (
              <>
                <div style={styles.messages}>
                  {messages.length === 0 ? (
                    <p style={styles.empty}>
                      No messages yet. Say hello!
                    </p>
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
    position: "relative",
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

  searchBox: {
    position: "relative",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },

  searchInput: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    boxSizing: "border-box",
  },

  searchStatus: {
    padding: "8px",
    color: "#6b7280",
    fontSize: "13px",
  },

  results: {
    position: "absolute",
    left: "12px",
    right: "12px",
    top: "62px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    zIndex: 20,
    overflow: "hidden",
  },

  userResult: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    border: 0,
    borderBottom: "1px solid #eee",
    background: "#fff",
    textAlign: "left",
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  username: {
    color: "#6b7280",
    fontSize: "13px",
  },

  body: {
    height: "calc(100% - 122px)",
    display: "flex",
  },

  sidebar: {
    width: "250px",
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
