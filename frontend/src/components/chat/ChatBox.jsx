import { useEffect, useRef, useState } from "react";

import { apiRequest } from "../../api/client";
import Loader from "../Loader";
import { useAppContext } from "../../context/AppContext";
import { connectSocket } from "../../services/socket";

function formatTime(value) {
  if (!value) {
    return "Now";
  }

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(label) {
  return String(label || "LF")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function ChatBox({ bookingId, anchorId }) {
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const { currentUser, showNotice, socketConnected } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadChat = async () => {
      try {
        const data = await apiRequest(`/api/chat/booking/${bookingId}`);

        if (!isActive) {
          return;
        }

        setMessages(data.chat?.messages || []);
      } catch (error) {
        if (isActive) {
          showNotice("error", error.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadChat();

    return () => {
      isActive = false;
    };
  }, [bookingId, showNotice]);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const handleChatMessage = ({ bookingId: incomingBookingId, message }) => {
      if (String(incomingBookingId) !== String(bookingId) || !message) {
        return;
      }

      setMessages((current) =>
        current.some((existingMessage) => existingMessage.id === message.id)
          ? current
          : [...current, message],
      );
    };

    const handleTypingStart = ({ bookingId: incomingBookingId, userId }) => {
      if (
        String(incomingBookingId) !== String(bookingId) ||
        String(userId) === String(currentUser?.id)
      ) {
        return;
      }

      setOtherUserTyping(true);
    };

    const handleTypingStop = ({ bookingId: incomingBookingId, userId }) => {
      if (
        String(incomingBookingId) !== String(bookingId) ||
        String(userId) === String(currentUser?.id)
      ) {
        return;
      }

      setOtherUserTyping(false);
    };

    socket.on("chat:message", handleChatMessage);
    socket.on("chat:typing:start", handleTypingStart);
    socket.on("chat:typing:stop", handleTypingStop);
    socket.emit("chat:join", bookingId, (response) => {
      if (!response?.success) {
        showNotice("error", response?.message || "Unable to join the chat.");
      }
    });

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      socket.emit("chat:leave", bookingId);
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:typing:start", handleTypingStart);
      socket.off("chat:typing:stop", handleTypingStop);
      setOtherUserTyping(false);
    };
  }, [bookingId, currentUser?.id, showNotice]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  const emitTypingState = (type) => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit(type, bookingId);
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setText(nextValue);

    emitTypingState("chat:typing:start");

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      emitTypingState("chat:typing:stop");
    }, 1200);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText || sending) {
      return;
    }

    setSending(true);
    setText("");
    emitTypingState("chat:typing:stop");

    const socket = socketRef.current;

    try {
      if (socket) {
        await new Promise((resolve, reject) => {
          socket.emit("chat:send", { bookingId, text: trimmedText }, (response) => {
            if (!response?.success) {
              reject(new Error(response?.message || "Unable to send the message."));
              return;
            }

            resolve(response);
          });
        });
      } else {
        const data = await apiRequest(`/api/chat/booking/${bookingId}/messages`, {
          method: "POST",
          body: { text: trimmedText },
        });

        setMessages((current) =>
          current.some((message) => message.id === data.message?.id)
            ? current
            : [...current, data.message],
        );
      }
    } catch (error) {
      setText(trimmedText);
      showNotice("error", error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Loader label="Loading chat..." />;
  }

  return (
    <section id={anchorId} className="chat-card">
      <div className="chat-card__header">
        <div>
          <span className="eyebrow">Live booking chat</span>
          <h2>Talk to the other side in real time</h2>
        </div>
        <span className={socketConnected ? "chat-status is-live" : "chat-status"}>
          {socketConnected ? "Realtime live" : "Connecting"}
        </span>
      </div>

      <div className="chat-thread">
        {!messages.length ? (
          <div className="chat-empty">
            No messages yet. Use this chat to confirm requirements, updates, or timing details.
          </div>
        ) : null}

        {messages.map((message) => {
          const isMine = String(message.sender?.id || message.sender) === String(currentUser?.id);

          return (
            <article key={message.id} className={isMine ? "chat-bubble is-mine" : "chat-bubble"}>
              {!isMine ? (
                <div className="chat-bubble__avatar">
                  {getInitials(message.sender?.username || "LF")}
                </div>
              ) : null}

              <div className="chat-bubble__content">
                <div className="chat-bubble__top">
                  <strong>{isMine ? "You" : message.sender?.username || "LocalFix user"}</strong>
                  <span>{formatTime(message.createdAt)}</span>
                </div>
                <p>{message.text}</p>
              </div>
            </article>
          );
        })}

        {otherUserTyping ? <div className="chat-typing">The other person is typing...</div> : null}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          rows="3"
          value={text}
          onChange={handleChange}
          placeholder="Type a message about this booking..."
        />
        <button type="submit" className="button button-primary" disabled={!text.trim() || sending}>
          {sending ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  );
}
