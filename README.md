# BlogFusion AI (Blog Writing AI Agent)

BlogFusion AI is an advanced, multi-agent AI application designed to autonomously generate, optimize, and publish high-quality technical blog posts. Leveraging the power of LangGraph, it orchestrates a team of specialized AI agents (researchers, orchestrators, writers, image planners, and SEO editors) to produce comprehensive content with embedded images and contextual YouTube videos.

## 🚀 Features

- **Multi-Agent Architecture**: Powered by LangGraph to distribute tasks like researching, outlining, writing, and editing across specialized agents.
- **Provider Agnostic LLMs**: Supports multiple AI providers out of the box, including OpenAI, Anthropic (Claude), Google (Gemini), DeepSeek, Groq, OpenRouter, and Cohere.
- **Real-time Web Research**: Integrates with Tavily Search to gather the latest evidence and properly cite sources for factual accuracy.
- **Automated Image Generation & Placement**: Automatically plans, generates, and places contextual images throughout the blog post using Cloudflare/Stable Diffusion and Cloudinary.
- **Contextual YouTube Integrations**: Automatically searches and embeds relevant YouTube tutorial videos within the generated blog.
- **SEO Optimization**: Synthesizes metadata, focus keywords, and URL slugs to make every blog search-engine friendly.
- **Direct CMS Publishing**: Effortlessly publish generated blogs directly to platforms like WordPress and Medium.
- **LinkedIn AI Promotion**: Automatically generates optimized, short-form LinkedIn posts to promote your published blogs.
- **Subscription & Payment System**: Built-in Razorpay integration for handling user credits and Pro plan subscriptions.
- **Google OAuth Authentication**: Secure and fast login capabilities alongside standard JWT authentication.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **Icons & Animations**: Lucide React, Framer Motion
- **Markdown Rendering**: React Markdown (with GFM, Math, Katex, and Mermaid Diagram support)
- **Data Visualization**: Recharts

### Backend
- **Framework**: FastAPI (Python 3)
- **Database ORM**: SQLModel & Alembic (PostgreSQL)
- **AI & Agents**: LangChain, LangGraph
- **Task Queue & Checkpointing**: LangGraph Checkpoint Postgres (Async Connection Pool)
- **Payments**: Razorpay SDK
- **Security & Rate Limiting**: Passlib (Bcrypt), PyJWT, SlowAPI

## 📂 Project Structure

```text
blog-writing-ai-agent/
├── frontend/                 # React UI application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth, Theme)
│   │   ├── pages/            # Application views (Home, Workspace, Settings, etc.)
│   │   └── utils/            # Helper functions and API clients
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── api/routes/       # API endpoints (auth, blogs, users, payments, support)
│   │   ├── core/             # Configuration, Database connection, Security
│   │   ├── models/           # SQLModel Database schema definitions
│   │   └── services/         # Business logic (Agent workflow, Cloudinary, CMS integrations)
│   ├── alembic/              # Database migration scripts
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL Database

### 1. Clone the repository
```bash
git clone https://github.com/SaurabhYadav45/blog-writing-ai-agent.git
cd blog-writing-ai-agent
```

### 2. Backend Setup
Navigate to the backend directory and set up a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file based on the provided template:
```bash
cp .env.example .env
```
Update the `.env` file with your actual API keys (OpenAI, Anthropic, Gemini, Tavily, Cloudinary, Database URL, etc.).

Apply database migrations:
```bash
alembic upgrade head
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`. API documentation can be accessed at `http://localhost:8000/docs`.

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

## 🔒 Environment Variables

Your `backend/.env` file requires several keys to operate fully. Below are the core services required:

- **DATABASE_URL**: Connection string to your PostgreSQL instance.
- **SECRET_KEY**: A secure random string for JWT signing.
- **TAVILY_API_KEY**: Required for the research agent to browse the web.
- **LLM Provider Keys**: At least one LLM key (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`).
- **CLOUDINARY_***: Keys for storing generated images.
- **YOUTUBE_API_KEY**: Required for fetching relevant video tutorials.
- **RAZORPAY_***: For handling subscription payments (Pro plan).

*(See `backend/.env.example` for the complete list of variables)*

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is proprietary. Please check with the repository owner for licensing details.
