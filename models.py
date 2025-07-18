from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class PDFUpload(Base):
    __tablename__ = "pdf_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_info = Column(String(255), nullable=True)  # Optional user info
    file_path = Column(String(500), nullable=False)  # Store file path
    
    # Relationship to questions
    questions = relationship("QuestionAnswer", back_populates="pdf_upload", cascade="all, delete-orphan")


class QuestionAnswer(Base):
    __tablename__ = "question_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    pdf_upload_id = Column(Integer, ForeignKey("pdf_uploads.id"), nullable=False)
    
    # Relationship back to PDF
    pdf_upload = relationship("PDFUpload", back_populates="questions")