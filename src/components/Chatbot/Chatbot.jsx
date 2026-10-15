import { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiX,
  FiMaximize2,
  FiMinimize2,
  FiRotateCcw,
  FiCpu,
} from "react-icons/fi";
import { BsStars } from "react-icons/bs";
import { sendChatMessage } from "../../services/chatbotService";
import "./Chatbot.css";

const QUICK_SUGGESTIONS = [
  "📊 Summarize monthly revenue & failed transactions",
  "⚠️ Which job crawler sources need attention and why?",
  "👥 Show candidate roster status and expiring plans",
  "💼 What internal jobs are currently open in Siddipet?",
  "⚡ Give me an overview of AI token spend & ATS feature costs",
];

const INITIAL_GREETING = {
  role: "assistant",
  content:
    "Hello! I am your AIFaGen Portal AI Assistant. I have real-time access to all portal data including candidates, subscriptions, failed payments, job crawlers, interviews, delivery team, and AI token quotas.\n\nHow can I help you manage the platform today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (textToSend) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    setErrorMessage("");
    const userMessage = {
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // Send chat history to OpenRouter
      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const botReply = await sendChatMessage(apiMessages);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Chatbot Error:", err);
      setErrorMessage(err.message || "Failed to communicate with AI Assistant.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Sorry, I encountered an issue processing your request: ${err.message || "Unknown error"}. Please check your connection or API key.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_GREETING]);
    setErrorMessage("");
    setInput("");
  };

  return (
    <div className="chatbot-floating-root">
      {!isOpen ? (
        <button
          type="button"
          className="chatbot-launcher-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
        >
          <span className="launcher-icon">
            <BsStars />
          </span>
          <span>Ask AI Assistant</span>
        </button>
      ) : (
        <div className={`chatbot-window ${isExpanded ? "expanded" : ""}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="bot-avatar">
                <img
                  src="/aifagenlogo-icon.png"
                  alt="AiFAGen"
                  className="bot-avatar-logo"
                />
              </div>
              <div className="bot-header-titles">
                <h4>AiFAGen AI Assistant</h4>
                <span>Live Portal Intelligence · Groq AI</span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={handleResetChat}
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <FiRotateCcw />
              </button>
              <button
                type="button"
                className="chatbot-icon-btn"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? "Restore window size" : "Expand window"}
                aria-label={isExpanded ? "Restore window size" : "Expand window"}
              >
                {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
              </button>
              <button
                type="button"
                className="chatbot-icon-btn close"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="chatbot-messages-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message-row ${msg.role === "user" ? "user-row" : "bot-row"}`}
              >
                <div className="message-avatar">
                  {msg.role === "user" ? "You" : <FiCpu />}
                </div>
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div className="chat-message-row bot-row">
                <div className="message-avatar">
                  <FiCpu />
                </div>
                <div className="message-bubble loading-bubble">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="chatbot-error-banner">{errorMessage}</div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions (shown when only greeting exists or user wants quick queries) */}
          {messages.length <= 2 && !loading && (
            <div className="chatbot-suggestions">
              <span className="suggestions-title">Quick Inquiries</span>
              {QUICK_SUGGESTIONS.slice(0, isExpanded ? 5 : 3).map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="chatbot-input-bar">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about users, payments, jobs, AI usage..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              aria-label="Ask AI Assistant"
            />
            <button
              type="button"
              className="send-msg-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
