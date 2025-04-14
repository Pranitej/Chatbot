import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://chatbot-pranitej.up.railway.app/");

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false); // New state for bot typing
  const [isSending, setIsSending] = useState(false); // New state to disable send button
  const bottomRef = useRef(null);

  // Load chat and theme from localStorage
  useEffect(() => {
    const savedChat = JSON.parse(localStorage.getItem("chat")) || [];
    if (savedChat.length > 0) {
      setChat(savedChat);
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  // Save chat to localStorage
  useEffect(() => {
    const last100 = chat.slice(-100);
    localStorage.setItem("chat", JSON.stringify(last100));
  }, [chat]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Scroll to bottom when chat updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Listen for bot reply
  useEffect(() => {
    socket.on("bot reply", (msg) => {
      setIsBotTyping(false); // Stop typing animation when bot replies
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setChat((prev) => [
        ...prev,
        { sender: "bot", text: msg, time: timestamp },
      ]);
      setIsSending(false); // Re-enable the send button after bot reply
    });

    return () => {
      socket.off("bot reply");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== "" && !isSending) {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      socket.emit("chat message", message);
      setChat((prev) => [
        ...prev,
        { sender: "user", text: message, time: timestamp },
      ]);
      setMessage("");
      setIsSending(true); // Disable send button while waiting for response
      setIsBotTyping(true); // Show bot typing animation
    }
  };

  const clearChat = () => {
    setChat([]);
    localStorage.setItem("chat", JSON.stringify([]));
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div
        className={`flex flex-col items-center justify-center min-h-screen px-4 transition-all duration-300 ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 to-black"
            : "bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100"
        }`}
      >
        <div className="w-full max-w-5xl p-6 rounded-2xl shadow-2xl backdrop-blur-xl bg-white/60 dark:bg-white/10 border border-white/20 dark:border-white/30 transition-all duration-300">
          {/* Theme Toggle */}
          <div className="flex justify-between mb-2">
            <button
              onClick={clearChat}
              className="text-sm px-4 py-2 bg-red-700 hover:bg-red-500 text-white rounded-full hover:scale-105 transition-all duration-200"
            >
              🗑️ Clear
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-sm px-4 py-2 bg-white/40 dark:bg-black/30 text-gray-800 dark:text-gray-200 rounded-full hover:scale-105 transition-all duration-200"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-extrabold text-center text-gray-800 dark:text-white mb-4">
            💬 AI Chatbot
          </h1>

          {/* Chat Messages */}
          <div className="h-90 overflow-y-auto mb-4 space-y-3 p-3 rounded-xl bg-white/40 dark:bg-gray-800/60">
            {chat.map((c, i) => (
              <div
                key={i}
                className={`flex items-end ${
                  c.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {c.sender === "bot" && <span className="mr-2 text-lg">🤖</span>}
                <div
                  className={`px-4 py-2 rounded-2xl text-sm shadow-md max-w-[75%] relative ${
                    c.sender === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-green-500 text-white rounded-bl-none"
                  }`}
                >
                  <div>{c.text}</div>
                  <div className="text-[10px] text-gray-200 mt-1 text-right">
                    {c.time}
                  </div>
                </div>
                {c.sender === "user" && (
                  <span className="ml-2 text-lg">👤</span>
                )}
              </div>
            ))}
            {isBotTyping && (
              <div className="flex items-end justify-start">
                <span className="mr-2 text-lg">🤖</span>
                <div className="px-4 py-2 rounded-2xl text-sm bg-green-500 text-white rounded-bl-none">
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Field */}
          <div className="flex mt-2">
            <input
              className="flex-1 px-4 py-2 rounded-l-full bg-white/70 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none"
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={isSending} // Disable the button when sending
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-r-full transition-all"
            >
              🚀
            </button>
          </div>
        </div>
        <p className="text-xs text-center text-gray-700 dark:text-gray-300 mt-3">
          ⚠️ Only the last 100 messages are stored locally and will be lost if
          you clear history or switch devices.
        </p>
      </div>
    </div>
  );
}

export default App;
