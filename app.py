from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import fitz  # PyMuPDF
from langchain.vectorstores import FAISS
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.question_answering import load_qa_chain
from langchain.llms.base import LLM
from typing import List
import requests
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "docs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load the embedding model
embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

# Initialize FAISS vectorstore
vectorstore = None


class OllamaLLM(LLM):
    def _call(self, prompt: str, **kwargs) -> str:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False}
        )
        if response.status_code == 200:
            return response.json().get("response", "").strip()
        else:
            return "Error contacting LLM."

    @property
    def _llm_type(self):
        return "ollama-llm"


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
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

    # Split into chunks and embed
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_text(text)

    global vectorstore
    vectorstore = FAISS.from_texts(texts, embedding_model)

    return {"message": f"Uploaded and processed {file.filename}"}


class QuestionRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_question(payload: QuestionRequest):
    if vectorstore is None:
        raise HTTPException(status_code=400, detail="No document uploaded yet.")

    docs = vectorstore.similarity_search(payload.question, k=3)

    llm = OllamaLLM()
    chain = load_qa_chain(llm, chain_type="stuff")

    answer = chain.run(input_documents=docs, question=payload.question)
    return {"answer": answer}



@app.get("/health")
def health_check():
    return {"status": "OK"}
