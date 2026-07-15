# Customer Support Resolution Agent (CSRA)

An AI-powered customer support platform that uses LangGraph, RAG (Retrieval-Augmented Generation), and tool orchestration to automatically resolve customer queries with confidence scoring, prompt injection detection, and human escalation workflows.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                      │
│  Vite + TypeScript + TailwindCSS + Framer Motion           │
│  Dashboard | AI Assistant | Tickets | Orders | Audit Logs  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Axios (REST API)
┌──────────────────────────▼──────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              LangGraph Agent Pipeline                │    │
│  │  Intent Detection → RAG Retrieval → Tool Selection  │    │
│  │  → Resolution Generation → Confidence Gate → Done   │    │
│  └─────────────┬───────────────┬───────────────────────┘    │
│  ┌─────────────▼──────┐ ┌──────▼────────────────────────┐  │
│  │   RAG Pipeline     │ │    Tool Registry               │  │
│  │   ChromaDB +       │ │    Order Lookup | Refund       │  │
│  │   OpenAI Embeds    │ │    Password Reset | Escalation │  │
│  └────────────────────┘ └────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   SQLite Database        │
              │   Tickets | Orders |     │
              │   Policies | Audit Logs  │
              └─────────────────────────┘
```

## Folder Structure

```
customer-support-agent/
├── backend/
│   ├── app/
│   │   ├── agents/          # LangGraph agent nodes, state, prompts, security
│   │   ├── api/             # FastAPI routes
│   │   ├── config/          # Settings, database, logging
│   │   ├── database/        # Seed data
│   │   ├── middleware/       # Rate limiting, auth
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── rag/             # RAG pipeline (loader, splitter, embeddings, vector store, retriever)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # CRUD services, agent service
│   │   ├── tools/           # Agent tools (order lookup, refund, credit, etc.)
│   │   └── utils/           # Utility routes
│   ├── tests/               # pytest test suite (80 tests)
│   ├── knowledge_base/      # Markdown policy documents
│   ├── main.py              # Application entry point
│   ├── conftest.py          # Test fixtures
│   ├── pytest.ini           # Pytest configuration
│   └── requirements.txt     # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios client + API functions
    │   ├── components/
    │   │   ├── chat/        # Conversation window
    │   │   ├── common/      # Bottom drawer (inspector)
    │   │   ├── dashboard/   # Stats, ticket queue, AI resolution panel
    │   │   ├── layout/      # Sidebar, top navbar, layout
    │   │   └── ui/          # Reusable UI primitives (Button, Badge, Input, etc.)
    │   ├── hooks/           # React Query hooks
    │   ├── lib/             # Utilities (cn, time formatting)
    │   ├── pages/           # Dashboard, Assistant, Tickets, Orders, Policies, Audit, Analytics, Settings
    │   ├── store/           # Zustand global state
    │   └── types/           # TypeScript type definitions
    ├── tailwind.config.js
    ├── vite.config.ts
    └── package.json
```

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI 0.115 |
| AI Agent | LangGraph 0.2 |
| LLM | OpenAI GPT-4o (with keyword fallback) |
| RAG | LangChain + ChromaDB |
| Database | SQLite + SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Testing | pytest 8.3 (80 tests) |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | TailwindCSS 3 (Dark Glassmorphism) |
| Animation | Framer Motion |
| Data Fetching | TanStack React Query + Axios |
| State | Zustand |
| Icons | Lucide React |
| Routing | React Router 7 |

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:
```env
OPENAI_API_KEY=sk-your-api-key-here
DATABASE_URL=sqlite:///./data/support_agent.db
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Start Backend (port 8000)
```bash
cd backend
python main.py
```

The backend automatically:
1. Initializes the database
2. Seeds sample data (65 records)
3. Loads and indexes knowledge base documents into ChromaDB
4. Starts the FastAPI server with Swagger docs at `/docs`

### Start Frontend (port 5173)
```bash
cd frontend
npm run dev
```

The frontend proxies all `/api` requests to `http://localhost:8000`.

## Environment Variables

### Backend (`.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | `""` | OpenAI API key (falls back to keyword matching if empty) |
| `DATABASE_URL` | `sqlite:///./data/support_agent.db` | Database connection string |
| `CHROMA_PERSIST_DIRECTORY` | `./data/chroma_db` | ChromaDB storage path |
| `CHUNK_SIZE` | `500` | RAG document chunk size |
| `RETRIEVAL_TOP_K` | `5` | Number of documents to retrieve |
| `MAX_GOODWILL_CREDIT` | `10.00` | Maximum goodwill credit amount |
| `REFUND_WINDOW_DAYS` | `30` | Refund eligibility window |
| `RATE_LIMIT_PER_MINUTE` | `60` | API rate limit |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/system/health` | System health |
| `POST` | `/api/v1/tickets` | Create ticket |
| `GET` | `/api/v1/tickets` | List tickets |
| `GET` | `/api/v1/tickets/{id}` | Get ticket |
| `PUT` | `/api/v1/tickets/{id}` | Update ticket |
| `DELETE` | `/api/v1/tickets/{id}` | Delete ticket |
| `GET` | `/api/v1/orders` | List orders |
| `GET` | `/api/v1/orders/{id}` | Get order |
| `POST` | `/api/v1/refunds` | Create refund |
| `GET` | `/api/v1/policies` | List policies |
| `GET` | `/api/v1/audit` | List audit logs |
| `POST` | `/api/v1/agent/invoke` | **Invoke AI agent** |

### Agent Invoke Request
```json
{
  "customer_message": "Where is my order ORD-2024-001?",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "ticket_id": ""
}
```

### Agent Invoke Response
```json
{
  "ticket_id": "uuid",
  "resolution": "Your order is currently shipped...",
  "intent": "order_status",
  "confidence": 0.85,
  "escalated": false,
  "tool_used": "order_lookup",
  "citations": [{"title": "Shipping Policy", "content_preview": "..."}]
}
```

## AI Agent Workflow

```
Customer Message
       │
       ▼
┌─────────────────┐
│ Prompt Injection │──── Detected → Escalate immediately
│ Detection        │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Escalation       │──── Legal/Account deletion → Escalate
│ Trigger Check    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Intent Detection │──── LLM classification (8 intents)
│ (LLM + Keywords)│     with keyword fallback
└────────┬────────┘
         ▼
┌─────────────────┐
│ RAG Document     │──── ChromaDB similarity search
│ Retrieval        │     Top-K policy documents
└────────┬────────┘
         ▼
┌─────────────────┐
│ Tool Selection   │──── Intent → Tool mapping
│ & Execution      │     Order lookup, refund check, etc.
└────────┬────────┘
         ▼
┌─────────────────┐
│ Resolution       │──── LLM generates response
│ Generation       │     grounded in retrieved docs
└────────┬────────┘
         ▼
┌─────────────────┐
│ Confidence       │──── Weighted scoring:
│ Evaluation       │     intent + retrieval + tool + safety
│                  │     < 0.75 → Escalate to human
└────────┬────────┘
         ▼
┌─────────────────┐
│ Final Response   │──── Resolution or escalation message
└─────────────────┘
```

### Supported Intents
- `order_status` - Check order/shipping status
- `refund_request` - Process refund requests
- `account_help` - Account-related issues
- `password_reset` - Password reset requests
- `legal_issue` - Legal matters (auto-escalated)
- `account_closure` - Account deletion (auto-escalated)
- `out_of_scope` - Non-support queries
- `ambiguous` - Unclear intent

## Frontend Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Stats cards + 3-panel layout (ticket queue, conversation, AI resolution) |
| **AI Assistant** | Full-screen chat interface with suggested prompts |
| **Tickets** | Sortable/filterable ticket list with status badges |
| **Orders** | Order management with status tracking |
| **Policies** | Knowledge base policy cards |
| **Audit Logs** | Agent execution audit trail |
| **Analytics** | Resolution rates, intent distribution, confidence metrics |
| **Settings** | System configuration display |

### Inspector (Bottom Drawer)
- **Timeline** - Step-by-step agent execution flow
- **Raw JSON** - Full agent response with copy button
- **Tool Calls** - Tool execution details
- **Agent State** - Current state inspection
- **RAG Results** - Retrieved document citations

## Running Tests

### Backend Tests (80 tests)
```bash
cd backend
python -m pytest
```

Test coverage:
- `test_agent.py` - 45 tests (state, intent detection, security, confidence, citations, graph)
- `test_api.py` - 10 tests (all API endpoints)
- `test_rag.py` - 7 tests (document splitter, knowledge loader)
- `test_tools.py` - 18 tests (all tools + registry)

### Frontend Build
```bash
cd frontend
npm run build
```

## Project Workflow

1. Customer sends a message via the AI Assistant or Dashboard
2. Frontend calls `POST /api/v1/agent/invoke`
3. Backend creates a ticket and runs the LangGraph pipeline
4. Agent detects intent, retrieves relevant policies, executes tools
5. Resolution is generated with confidence scoring
6. Low confidence or escalation triggers route to human review
7. Response returns with intent, confidence, citations, and tool results
8. Frontend displays the full AI analysis in the resolution panel
9. Audit log is created for compliance and review

## Future Improvements

- Real-time WebSocket streaming for agent responses
- Multi-turn conversation context window
- User authentication and role-based access control
- File upload and image processing support
- Email/Slack integration for escalation notifications
- Dashboard with real-time analytics charts
- Dark/Light theme toggle
- Conversation export and reporting
- Multi-language support
- A/B testing for resolution strategies

## License

Capstone Project - AI Customer Support Resolution Agent
