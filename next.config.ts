import type { NextConfig } from "next";

/** Local chatbot API (FastAPI + Ollama in `chatbot/`); 8000 is taken by the main backend. */
const CHATBOT_API_URL = process.env.CHATBOT_API_URL ?? "http://localhost:8001/api";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/chatbot-api/:path*",
        destination: `${CHATBOT_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
