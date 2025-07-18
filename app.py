from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import fitz 
import requests
from typing import List
from datetime import datetime

from langchain.vectorstores import FAISS
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.llms.base import LLM
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate

# Database imports
from database import get_db, create_tables
from models import PDFUpload, QuestionAnswer

# --- FastAPI Setup ---
app = FastAPI()

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Adjust to match your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Globals ---
UPLOAD_FOLDER = "docs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = None


# --- Ollama LLM Wrapper ---
class OllamaLLM(LLM):
    def _call(self, prompt: str, **kwargs) -> str:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False}
        )
        if response.status_code == 200:
            return response.json().get("response", "").strip()
        return "Error contacting LLM."

    @property
    def _llm_type(self):
        return "ollama-llm"


# --- Upload PDF Endpoint ---
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text from PDF
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()

    # Split and embed
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_text(text)

    global vectorstore
    vectorstore = FAISS.from_texts(chunks, embedding_model)

    # --- DATABASE LOGGING ---
    # Store PDF upload record in database
    pdf_record = PDFUpload(
        filename=file.filename,
        file_path=file_path,
        upload_timestamp=datetime.utcnow(),
        user_info=None  # Can be extended later for user authentication
    )
    db.add(pdf_record)
    db.commit()
    db.refresh(pdf_record)

    return {
        "message": f"Uploaded and processed {file.filename}",
        "pdf_id": pdf_record.id
    }


# --- Ask Question Endpoint ---
class QuestionRequest(BaseModel):
    question: str


@app.post("/ask")
async def ask_question(payload: QuestionRequest, db: Session = Depends(get_db)):
    if vectorstore is None:
        raise HTTPException(status_code=400, detail="No document uploaded yet.")

    docs = vectorstore.similarity_search(payload.question, k=3)

    # Custom system prompt
    qa_prompt = PromptTemplate(
        input_variables=["context", "question"],
        template="""
You are a helpful assistant. Use only the provided context to answer the question.
If the answer is not contained in the context, reply with: "I don't know."

Context:
{context}

Question: {question}
Answer:"""
    )

    llm = OllamaLLM()
    chain = load_qa_chain(llm, chain_type="stuff", prompt=qa_prompt)

    answer = chain.run(input_documents=docs, question=payload.question)

    # --- DATABASE LOGGING ---
    # Get the most recent PDF upload (you might want to modify this logic)
    latest_pdf = db.query(PDFUpload).order_by(PDFUpload.upload_timestamp.desc()).first()
    
    if latest_pdf:
        # Store question-answer pair in database
        qa_record = QuestionAnswer(
            question=payload.question,
            answer=answer,
            timestamp=datetime.utcnow(),
            pdf_upload_id=latest_pdf.id
        )
        db.add(qa_record)
        db.commit()
        db.refresh(qa_record)

    return {
        "answer": answer,
        "sources": [doc.page_content for doc in docs],
        "qa_id": qa_record.id if latest_pdf else None
    }


# --- Health Check Endpoint ---
@app.get("/health")
def health_check():
    return {"status": "OK"}
