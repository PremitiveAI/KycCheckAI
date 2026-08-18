from langchain_google_genai import (GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

from datetime import datetime
from app.config.env import env

CHROMA_DIR = env('CHROMA_DIR')

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.3)
splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)

def store_document(text: str, filename: str, file_type: str):
    chunks = splitter.split_text(text)

    metadata = [{
        "filename": filename,
        "file_type": file_type,
        "timestamp": datetime.utcnow().isoformat()
    } for _ in chunks]

    db = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=embeddings
    )

    db.add_texts(chunks, metadatas=metadata)
    db.persist()

def search_rag(query: str):
    db = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=embeddings
    )

    results = db.similarity_search_with_score(query, k=5)
    context = "\n".join([doc.page_content for doc, _ in results])

    answer = llm.invoke(
        f"Answer strictly from the context below:\n\n{context}\n\nQuestion: {query}"
    )

    return {
        "matches": [
            {
                "text": doc.page_content,
                "score": score,
                "metadata": doc.metadata
            }
            for doc, score in results
        ],
        "response": answer.content
    }
