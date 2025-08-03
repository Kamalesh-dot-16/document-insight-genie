This application is a Retrieval-Augmented Generation (RAG) chat interface that allows users to upload PDF documents and interact with them through natural language queries.

✨ Features
	•	📄 Upload PDFs and extract content using advanced chunking
	•	🔍 Semantic search via vector similarity (FAISS)
	•	🤖 Chat interface that answers based on document context
	•	🧠 Powered by OpenAI’s GPT APIs for intelligent responses

⸻

🧰 Tech Stack

🔙 Backend
	•	FastAPI: REST API framework to handle file uploads, PDF parsing, and chat inference
	•	PyMuPDF: For extracting and chunking content from PDFs
	•	FAISS: Vector store used for fast similarity search on document embeddings
	•	LangChain: Orchestrates the RAG pipeline (embedding → retrieval → generation)
	•	OpenAI API: Generates answers grounded in retrieved chunks
	•	PostgreSQL: Stores user data, session history, and logs

🔝 Frontend
	•	React (via Vite): Fast, modern frontend framework
	•	TypeScript: Static typing for better code safety
	•	Tailwind CSS: Utility-first styling
	•	shadcn/ui: Reusable and customizable component library
