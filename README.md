<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Xiaozhi AI Phicomm R1 Client (Hub)

A web-based administration and control hub for the Phicomm R1 Smart Speaker, powered by Google Gemini AI. This client provides a comprehensive interface for managing device settings, media playback, network configuration, and interacting with the integrated AI assistant.

## Features

- **AI Assistant Integration:** Powered by Google GenAI (Gemini), featuring customizable system prompts and a built-in chat interface. Includes filtering for unwanted phrases.
- **Device Management:**
  - **Bluetooth Control:** Manage paired devices, create custom audio profiles, and organize multi-device speaker groups.
  - **Network Configuration:** Scan and connect to WiFi networks directly from the hub.
  - **OTA Updates:** Check and manage over-the-air firmware updates for the speaker.
- **Media & Casting:**
  - Unified media player with support for local and cloud sources.
  - Media queue management, repeat/shuffle controls, and equalizer (EQ) settings.
  - AirPlay and DLNA casting configuration.
- **Smart Home & Utilities:**
  - Set Alarms and Timers.
  - MQTT-based Smart Home device overview (Lights, Climate, etc.).
  - Interactive LED mode and color adjustments.

## Tech Stack

- **Frontend:** React 19, TailwindCSS v4, Framer Motion, Lucide React
- **Backend:** Node.js, Express (API routes & static serving)
- **AI Integration:** `@google/genai`
- **Build Tool:** Vite

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. Clone the repository and navigate into the directory:
   ```bash
   git clone git@github.com:tvad911/xiaozhi-ai-phicomm-r1-client.git
   cd xiaozhi-ai-phicomm-r1-client
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Environment Configuration:
   Create a `.env` file in the root directory (you can use `.env.example` as a template):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

### Building for Production

To build the optimized application for production:
```bash
npm run build
```

After building, start the production Express server:
```bash
npm run start
```

## Project Structure

- `server.ts`: The Express backend handling API routes (`/api/config`, `/api/health`) and serving the Vite frontend.
- `src/App.tsx`: The core React application containing the UI modules for Status, Chat, Setup, Bluetooth, and Media.
- `vite.config.ts`: Vite setup with TailwindCSS integration and environment proxy settings.
