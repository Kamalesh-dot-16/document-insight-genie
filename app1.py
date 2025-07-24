from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import fitz 
import requests
from typing import List
from docx import Document

from langchain.vectorstores import FAISS
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.llms.base import LLM
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate

#from database import get_db, create_tables
#from models import PDFUpload, QuestionAnswer

# --- FastAPI Setup ---
app = FastAPI()

# Create database tables on startup
#@app.on_event("startup")
#def startup_event():
    #create_tables()

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
ALLOWED_EXTENSIONS = {'.pdf', '.txt', '.docx', '.md'}

def allowed_file(filename: str):
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    contents = await file.read()

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    text = ""

    if ext == ".pdf":
        with fitz.open(file_path) as pdf:
            for page in pdf:
                text += page.get_text()

    elif ext in [".txt", ".md"]:
        text = contents.decode("utf-8")

    elif ext == ".docx":
        temp_path = os.path.join(UPLOAD_FOLDER, "temp.docx")
        with open(temp_path, "wb") as f:
            f.write(contents)
        doc = Document(temp_path)
        text = "\n".join(p.text for p in doc.paragraphs)

    # Split and embed
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_text(text)

    global vectorstore
    vectorstore = FAISS.from_texts(chunks, embedding_model)

    return {"message": f"Uploaded and processed {file.filename}"}



    # Extract text from PDF
  


# --- Ask Question Endpoint ---
class QuestionRequest(BaseModel):
    question: str


@app.post("/ask")
async def ask_question(payload: QuestionRequest):
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

    return {
        "answer": answer,
        "sources": [doc.page_content for doc in docs]
    }


# --- Health Check Endpoint ---
@app.get("/health")
def health_check():
    return {"status": "OK"}
