# app/vector/vector_db.py

import chromadb, uuid, json, traceback, os
from typing import List, Optional, Dict, Any

class VectorStore:
    """
    Optimized ChromaDB with proper multi-field metadata filtering using $and operator
    """

    def __init__(self, path: str = "./vector_db"):
        print("🔥 Initializing Persistent Chroma Client...")
        os.makedirs(path, exist_ok=True)

        self.client = chromadb.PersistentClient(path=path)
        self.collection = self.client.get_or_create_collection(
            name="documents",
            embedding_function=None,
            metadata={"hnsw:space": "cosine"},
        )

        print("🔥 Persistent Collection Ready!")
        print("➡️ Total stored vectors =", self.collection.count())



    def _ensure_python_floats(self, vec: List[float]) -> List[float]:
        return [float(x) for x in vec]

    def add_vector(self, vector: List[float], metadata: Dict[str, Any], document_details: Dict[str, Any] ) -> Optional[str]:
        """Add vector with metadata - ensures JSON-serializable metadata"""
        print("\n===== ADD VECTOR =====")

        vector = self._ensure_python_floats(vector)

        doc_id = metadata.get("document_id")
        if not doc_id:
            raise ValueError("❌ Missing required metadata: document_id")

        vector_id = f"{doc_id}_{metadata.get('chunk', 0)}_{uuid.uuid4().hex}"
        print("➡️ vector_id =", vector_id)

        # ✅ Make metadata JSON-safe & Chroma-safe (BEST PRACTICE)
        safe_meta = {}

        for k, v in metadata.items():
            if v is None:
                continue

            # ChromaDB supports only primitive types
            if isinstance(v, (str, int, float, bool)):
                safe_meta[k] = v
            else:
                # fallback: convert complex types (dict, list, datetime, etc.)
                safe_meta[k] = str(v)

        before = self.collection.count()
        document_text = json.dumps({**document_details})

        try:
            self.collection.add(
                ids=[str(vector_id)],
                embeddings=[vector],
                metadatas=[safe_meta],                # clean metadata
                documents=[document_text],      # store document content for retrieval
            )
            # self.client.persist()
        except Exception as e:
            print("❌ ERROR adding vector:", e)
            traceback.print_exc()
            return None

        after = self.collection.count()
        print(f"✔ Count: {before} → {after}")

        return vector_id


    def build_where_filter(self, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Builds proper ChromaDB WHERE filter with $and operator for multiple conditions
        
        Supports:
        - Multiple exact matches: {"document_type": "aadhaar_card", "gender": "Male"}
        - Comparisons: {"dob": {"$gt": "2000-01-01"}}
        - Combined: {"document_type": "pan_card", "dob": {"$gte": "1990-01-01"}}
        """
        if not filters:
            return None

        # Remove None/empty values
        clean_filters = {k: v for k, v in filters.items() if v not in (None, "", [])}
        
        if not clean_filters:
            return None

        # Single filter - return as-is
        if len(clean_filters) == 1:
            key, value = next(iter(clean_filters.items()))
            return {key: value}

        # Multiple filters - use $and
        conditions = []
        for key, value in clean_filters.items():
            conditions.append({key: value})

        return {"$and": conditions}

    # def build_where_filter(self, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    #     """
    #     Builds proper ChromaDB WHERE filter with $and operator for multiple conditions.
        
    #     Rules:
    #     - Exact matches: {"document_type": "aadhaar_card", "gender": "Male"}
    #     - Comparisons: {"dob": {"$gt": "2000-01-01"}}
    #     - Combined: {"document_type": "pan_card", "dob": {"$gte": "1990-01-01"}}
    #     - Special case: "full_name" always uses $contains for LIKE-style search
    #     """
    #     if not filters:
    #         return None

    #     # Remove None/empty values
    #     clean_filters = {k: v for k, v in filters.items() if v not in (None, "", [])}
    #     if not clean_filters:
    #         return None

    #     def normalize_condition(key: str, value: Any) -> Dict[str, Any]:
    #         # Special case: full_name → LIKE query
    #         if key == "full_name" and isinstance(value, str):
    #             return {key: {"$contains": value}}
    #         # If already operator dict (e.g. {"$gt": "2000-01-01"})
    #         if isinstance(value, dict):
    #             return {key: value}
    #         # Default exact match
    #         return {key: {"$eq": value}}

    #     # Single filter
    #     if len(clean_filters) == 1:
    #         key, value = next(iter(clean_filters.items()))
    #         return normalize_condition(key, value)

    #     # Multiple filters → $and
    #     conditions = [normalize_condition(k, v) for k, v in clean_filters.items()]
    #     return {"$and": conditions}


    def search( self, query_vector: List[float], top_k: int = 10, where: Dict[str, Any] = None) -> Dict[str, List]:
        """
        Vector search with proper multi-field metadata filtering
        
        Examples:
        --------
        # Single filter
        search(vec, where={"document_type": "aadhaar_card"})
        
        # Multiple filters (uses $and automatically)
        search(vec, where={"document_type": "pan_card", "gender": "Male"})
        
        # With operators
        search(vec, where={"document_type": "passport", "dob": {"$gt": "2000-01-01"}})
        """
        print("\n===== VECTOR SEARCH =====")

        query_vector = self._ensure_python_floats(query_vector)
        print("➡️ Query vector length:", len(query_vector))
        print("➡️ Total vectors:", self.collection.count())

        # Build proper WHERE clause
        where_clause = self.build_where_filter(where)
        
        if where_clause:
            print("➡️ ChromaDB WHERE filter:", json.dumps(where_clause, indent=2))

        try:
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=top_k,
                where=where_clause,
                include=["metadatas", "distances","documents"],
            )
        except Exception as e:
            print("❌ Search error:", e)
            traceback.print_exc()
            return {"ids": [], "metadatas": [], "distances": []}

        ids = results.get("ids", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dist = results.get("distances", [[]])[0]
        documents = results.get("documents", [[]])[0]

        print(f"✔ Found {len(ids)} results")
        print(f"✔ metas results:", metas)

        return {
            "ids": ids,
            "metadatas": metas,
            "documents": documents,
            "distances": dist,
        }

    def search_with_advanced_filters(
        self,
        query_vector: List[float],
        top_k: int = 10,
        document_type: str = None,
        gender: str = None,
        dob_operator: str = None,
        dob_value: str = None,
        document_id: str = None,
        **extra_filters
    ) -> Dict[str, List]:
        """
        Convenience method with named parameters for common filters
        
        Examples:
        --------
        search_with_advanced_filters(
            vec, 
            document_type="aadhaar_card",
            gender="Male"
        )
        
        search_with_advanced_filters(
            vec,
            document_type="pan_card",
            dob_operator="$gte",
            dob_value="1990-01-01"
        )
        """
        filters = {}

        if document_type:
            filters["document_type"] = document_type
        
        if gender:
            filters["gender"] = gender
        
        if document_id:
            filters["document_id"] = document_id

        # DOB with operators
        if dob_operator and dob_value:
            filters["dob"] = {dob_operator: dob_value}

        # Add any extra filters
        filters.update(extra_filters)

        return self.search(query_vector, top_k, where=filters)

    def delete_by_ids(self, ids: List[str]):
        """Delete vectors by IDs"""
        try:
            self.collection.delete(ids=ids)
            self.client.persist()
            print(f"🗑 Deleted {len(ids)} vector(s)")
        except Exception:
            traceback.print_exc()

    def delete_by_document(self, document_id: str):
        """Delete all vectors for a document"""
        try:
            self.collection.delete(where={"document_id": document_id})
            self.client.persist()
            print(f"🗑 Deleted vectors for document_id={document_id}")
        except Exception:
            traceback.print_exc()

    def delete_by_filter(self, where: dict):
        """
        Delete vectors using ChromaDB metadata filter.
        Example:
        delete_by_filter({
            "document_type": "pan_card",
            "record_id": 12
        })
        """
        try:
            print("where =========================================================> ",where)
            if not where or not isinstance(where, dict):
                print("⚠️ delete_by_filter skipped: empty filter")
                return
            
            # Build proper WHERE clause
            where_clause = self.build_where_filter(where)
            
            if where_clause:
                print("➡️ ChromaDB WHERE filter:", json.dumps(where_clause, indent=2))

            self.collection.delete(where=where_clause)

            # ❌ persist() NOT required in Chroma >= 0.4.x
            print(f"🗑 Deleted vectors with filter={where}")

        except Exception:
            traceback.print_exc()

    def get_by_ids(self, ids: List[str], include: List[str] = None):
        """Get vectors by IDs"""
        include = include or ["metadatas", "embeddings"]
        return self.collection.get(ids=ids, include=include)



# Global singleton instance
vector_db = VectorStore()

print("LOADED VECTOR_DB FROM:", __file__)
print("🔥 Global Vector DB Loaded — Count =", vector_db.collection.count())


# ============================================================
# USAGE EXAMPLES
# ============================================================

"""
# Example 1: Single filter
results = vector_db.search(
    query_vector=embedding,
    top_k=10,
    where={"document_type": "aadhaar_card"}
)

# Example 2: Multiple filters (automatic $and)
results = vector_db.search(
    query_vector=embedding,
    top_k=10,
    where={
        "document_type": "pan_card",
        "gender": "Male"
    }
)

# Example 3: With comparison operators
results = vector_db.search(
    query_vector=embedding,
    top_k=10,
    where={
        "document_type": "passport",
        "dob": {"$gte": "1990-01-01"}
    }
)

# Example 4: Using convenience method
results = vector_db.search_with_advanced_filters(
    query_vector=embedding,
    top_k=10,
    document_type="aadhaar_card",
    gender="Female",
    dob_operator="$lt",
    dob_value="2000-01-01"
)

# Example 5: Complex nested $and with $or
results = vector_db.search(
    query_vector=embedding,
    where={
        "$and": [
            {"document_type": "pan_card"},
            {
                "$or": [
                    {"gender": "Male"},
                    {"gender": "Female"}
                ]
            }
        ]
    }
)
"""