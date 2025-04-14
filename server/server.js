import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
});

app.use(cors());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const getGroqResponse = async (userMsg) => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: userMsg }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);
      return "Sorry, there was a problem with the AI response.";
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq error:", error);
    return "Something went wrong!";
  }
};

io.on("connection", (socket) => {
  console.log("✅ New client connected");

  socket.on("chat message", async (msg) => {
    // console.log("📩 User says:", msg);
    const botResponse = await getGroqResponse(msg);
    socket.emit("bot reply", botResponse);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(5000, () => {
  console.log("🚀 Server listening on port 5000");
});
