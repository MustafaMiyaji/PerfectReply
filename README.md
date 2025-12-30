# PerfectReply

**Don't just reply. Connect.** 
Your personal AI empathy engine & relationship coach.

## Overview

PerfectReply is an AI-powered application designed to help users navigate complex relationship dynamics and digital communication. By analyzing conversation context from screenshots, audio recordings, or text logs, it provides tailored advice and suggested replies based on a specific "vibe" and intensity level.

## Features

*   **Multimodal Analysis**: Upload screenshots, screen recordings, or call audio to get deep insights into communication patterns.
*   **Vibe Selector**: Choose your response style (Spark, Repair, Cool, Deep, Humorous, Empathetic).
*   **Intensity Control**: Adjust the risk level of your replies from Safe to Bold.
*   **Coach Chat**: Ask follow-up questions to an AI relationship coach about the specific context.
*   **Visual Aids**: Generate custom emoji stickers to match the sentiment.

## Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS, Framer Motion
*   **AI**: Google Gemini API (Gemini 1.5 Pro & Flash)
*   **Icons**: Lucide React

## Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory and add your Gemini API key:
    ```
    API_KEY=your_google_gemini_api_key_here
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## Deployment

This project is optimized for deployment on Vercel.

1.  Import the project to Vercel.
2.  Add the `API_KEY` environment variable in the Vercel dashboard.
3.  Deploy.

## License

MIT
