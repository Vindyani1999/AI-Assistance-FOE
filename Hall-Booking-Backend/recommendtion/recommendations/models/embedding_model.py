# recommendtion/recommendations/models/embedding_model.py
from langchain_community.embeddings import HuggingFaceEmbeddings
import numpy as np
from typing import List, Dict, Any, Optional
import logging
import json
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class EmbeddingModel:
    """
    Manages embeddings for rooms, users, and time slots using Hugging Face models
    """
    
    def __init__(self, 
                 model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
                 persist_directory: str = "./data/embeddings"):
        """
        Initialize the embedding model
        
        Args:
            model_name: Hugging Face model name for embeddings
            persist_directory: Directory to store vector database
        """
        logger.info(f"Initializing EmbeddingModel with model: {model_name}")
        
        try:
            try:
                from langchain_huggingface import HuggingFaceEmbeddings
                self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
                logger.info("Using new langchain-huggingface package")
            except ImportError:
                import warnings
                warnings.filterwarnings('ignore', category=DeprecationWarning)
                from langchain_community.embeddings import HuggingFaceEmbeddings
                self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
                logger.info("Using langchain_community package (deprecated)")
            
            self.model_name = model_name
            logger.info("Successfully loaded embedding model")
            
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            self.embeddings = None
            self.model_name = "fallback"
            logger.warning("Using fallback embedding method")
        
        os.makedirs(persist_directory, exist_ok=True)
        self.persist_directory = persist_directory
        
        # Initialize simple storage instead of ChromaDB for now
        self._room_embeddings = {}
        self._user_embeddings = {}
        self._booking_embeddings = {}
        
        logger.info("EmbeddingModel initialized successfully")
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """
        Get embedding for text with fallback support
        
        Args:
            text: Input text to embed
            
        Returns:
            numpy array of embedding
        """
        try:
            if self.embeddings is not None:
                # Use actual embedding model
                embedding = self.embeddings.embed_query(text)
                return np.array(embedding, dtype=np.float32)
            else:
                # Fallback: create deterministic hash-based embedding
                import hashlib
                hash_obj = hashlib.md5(text.encode())
                hash_int = int(hash_obj.hexdigest(), 16)
                
                # Create reproducible random embedding
                np.random.seed(hash_int % (2**32))
                embedding = np.random.normal(0, 1, 384).astype(np.float32)
                return embedding
                
        except Exception as e:
            logger.error(f"Error generating embedding for text: {e}")
            # Return zero embedding as last resort
            return np.zeros(384, dtype=np.float32)
    
    def get_room_embedding(self, room_description: str) -> Optional[np.ndarray]:
        """
        Get embedding for room description (compatible with test expectations)
        
        Args:
            room_description: Description of the room
            
        Returns:
            numpy array of room embedding or None if failed
        """
        try:
            if not room_description or not isinstance(room_description, str):
                logger.warning("Invalid room description provided")
                return None
            
            embedding = self._get_embedding(room_description)
            
            if embedding is not None and embedding.size > 0:
                logger.debug(f"Generated room embedding with dimension: {len(embedding)}")
                return embedding
            else:
                logger.warning("Generated empty embedding")
                return None
                
        except Exception as e:
            logger.error(f"Error in get_room_embedding: {e}")
            return None
    
    def get_user_embedding(self, user_preferences: str) -> Optional[np.ndarray]:
        """
        Get embedding for user preferences (compatible with test expectations)
        
        Args:
            user_preferences: User preference description
            
        Returns:
            numpy array of user embedding or None if failed
        """
        try:
            if not user_preferences or not isinstance(user_preferences, str):
                logger.warning("Invalid user preferences provided")
                return None
            
            embedding = self._get_embedding(user_preferences)
            
            if embedding is not None and embedding.size > 0:
                logger.debug(f"Generated user embedding with dimension: {len(embedding)}")
                return embedding
            else:
                logger.warning("Generated empty user embedding")
                return None
                
        except Exception as e:
            logger.error(f"Error in get_user_embedding: {e}")
            return None
    
    def get_query_embedding(self, query: str) -> Optional[np.ndarray]:
        """
        Get embedding for search query
        
        Args:
            query: Search query string
            
        Returns:
            numpy array of query embedding or None if failed
        """
        try:
            if not query or not isinstance(query, str):
                logger.warning("Invalid query provided")
                return None
            
            embedding = self._get_embedding(query)
            
            if embedding is not None and embedding.size > 0:
                logger.debug(f"Generated query embedding with dimension: {len(embedding)}")
                return embedding
            else:
                logger.warning("Generated empty query embedding")
                return None
                
        except Exception as e:
            logger.error(f"Error in get_query_embedding: {e}")
            return None
    
    def create_room_embedding(self, room_data: Dict[str, Any]) -> np.ndarray:
        """
        Create embedding for a room based on its features
        
        Args:
            room_data: Dictionary containing room information
            
        Returns:
            numpy array of room embedding
        """
        try:
            name = room_data.get('name', 'Unknown Room')
            capacity = room_data.get('capacity', 0)
            description = room_data.get('description', '')
            features = room_data.get('features', [])
            location = room_data.get('location', '')
            equipment = room_data.get('equipment', [])
            room_type = room_data.get('type', 'general')
            
            # Create comprehensive room description
            room_text = f"""
            Room Name: {name}
            Type: {room_type}
            Capacity: {capacity} people
            Location: {location}
            Description: {description}
            Features: {', '.join(features) if features else 'None'}
            Equipment: {', '.join(equipment) if equipment else 'None'}
            Suitable for: {self._infer_suitable_activities(room_data)}
            """.strip()
            
            embedding = self._get_embedding(room_text)
            logger.debug(f"Created embedding for room: {name}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error creating room embedding: {e}")
            # Return a default embedding
            return np.zeros(384, dtype=np.float32)
    
    def create_user_embedding(self, user_data: Dict[str, Any]) -> np.ndarray:
        """
        Create embedding for a user based on booking history and preferences
        
        Args:
            user_data: Dictionary containing user information and booking patterns
            
        Returns:
            numpy array of user embedding
        """
        try:
            # Extract user information with defaults
            booking_patterns = user_data.get('booking_patterns', {})
            preferred_rooms = user_data.get('preferred_rooms', [])
            common_times = user_data.get('common_times', [])
            department = user_data.get('department', 'unknown')
            role = user_data.get('role', 'staff')
            
            # Extract booking pattern details
            avg_duration = booking_patterns.get('avg_duration', 1.0)
            frequency = booking_patterns.get('frequency', 'occasional')
            preferred_capacity = booking_patterns.get('preferred_capacity', 10)
            common_purposes = booking_patterns.get('common_purposes', [])
            
            # Create user profile text
            user_text = f"""
            Department: {department}
            Role: {role}
            Preferred rooms: {', '.join(preferred_rooms) if preferred_rooms else 'No preference'}
            Common booking times: {', '.join(common_times) if common_times else 'Flexible'}
            Average booking duration: {avg_duration} hours
            Booking frequency: {frequency}
            Preferred room capacity: {preferred_capacity} people
            Common meeting purposes: {', '.join(common_purposes) if common_purposes else 'General meetings'}
            Booking style: {self._infer_booking_style(booking_patterns)}
            """.strip()
            
            embedding = self._get_embedding(user_text)
            logger.debug(f"Created embedding for user with {len(preferred_rooms)} preferred rooms")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error creating user embedding: {e}")
            return np.zeros(384, dtype=np.float32)
    
    def create_booking_embedding(self, booking_data: Dict[str, Any]) -> np.ndarray:
        """
        Create embedding for a booking based on context and patterns
        
        Args:
            booking_data: Dictionary containing booking information
            
        Returns:
            numpy array of booking embedding
        """
        try:
            room_name = booking_data.get('room_name', '')
            purpose = booking_data.get('purpose', 'meeting')
            duration = booking_data.get('duration_hours', 1.0)
            attendees = booking_data.get('attendee_count', 1)
            time_slot = booking_data.get('time_slot', 'morning')
            day_of_week = booking_data.get('day_of_week', 'weekday')
            
            booking_text = f"""
            Room: {room_name}
            Purpose: {purpose}
            Duration: {duration} hours
            Attendees: {attendees} people
            Time preference: {time_slot}
            Day type: {day_of_week}
            Booking context: {booking_data.get('context', 'regular meeting')}
            """.strip()
            
            embedding = self._get_embedding(booking_text)
            logger.debug(f"Created booking embedding for {room_name}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error creating booking embedding: {e}")
            return np.zeros(384, dtype=np.float32)
    
    def _infer_suitable_activities(self, room_data: Dict[str, Any]) -> str:
        """Infer suitable activities based on room features"""
        capacity = room_data.get('capacity', 0)
        features = room_data.get('features', [])
        equipment = room_data.get('equipment', [])
        
        activities = []
        
        if capacity <= 4:
            activities.append("small meetings")
        elif capacity <= 12:
            activities.append("team meetings")
        else:
            activities.append("large presentations")
        
        if 'projector' in equipment or 'screen' in equipment:
            activities.append("presentations")
        
        if 'whiteboard' in equipment:
            activities.append("brainstorming")
        
        if 'video_conference' in equipment:
            activities.append("video calls")
        
        return ', '.join(activities) if activities else 'general meetings'
    
    def _infer_booking_style(self, booking_patterns: Dict[str, Any]) -> str:
        """Infer user's booking style from patterns"""
        frequency = booking_patterns.get('frequency', 'occasional')
        avg_duration = booking_patterns.get('avg_duration', 1.0)
        
        if frequency == 'daily' and avg_duration < 1:
            return 'frequent short meetings'
        elif frequency == 'daily' and avg_duration >= 2:
            return 'daily long sessions'
        elif frequency == 'weekly':
            return 'regular weekly meetings'
        else:
            return 'occasional bookings'
    
    def store_room_embedding(self, room_id: str, room_data: Dict[str, Any]) -> bool:
        """
        Store room embedding in memory (simplified version)
        
        Args:
            room_id: Unique room identifier
            room_data: Room information dictionary
            
        Returns:
            True if successful, False otherwise
        """
        try:
            embedding = self.create_room_embedding(room_data)
            
            # Store in memory
            self._room_embeddings[room_id] = {
                'embedding': embedding,
                'data': room_data,
                'created_at': datetime.utcnow().isoformat()
            }
            
            logger.debug(f"Stored embedding for room {room_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing room embedding for {room_id}: {e}")
            return False
    
    def store_user_embedding(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """
        Store user embedding in memory (simplified version)
        
        Args:
            user_id: Unique user identifier
            user_data: User information and booking patterns
            
        Returns:
            True if successful, False otherwise
        """
        try:
            embedding = self.create_user_embedding(user_data)
            
            # Store in memory
            self._user_embeddings[user_id] = {
                'embedding': embedding,
                'data': user_data,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            logger.debug(f"Stored embedding for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing user embedding for {user_id}: {e}")
            return False
    
    def find_similar_rooms(self, target_room_id: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Find similar rooms using vector similarity (simplified version)
        
        Args:
            target_room_id: ID of the target room
            n_results: Number of similar rooms to return
            
        Returns:
            List of similar rooms with similarity scores
        """
        try:
            if target_room_id not in self._room_embeddings:
                logger.warning(f"No embedding found for room {target_room_id}")
                return []
            
            target_embedding = self._room_embeddings[target_room_id]['embedding']
            similarities = []
            
            for room_id, room_info in self._room_embeddings.items():
                if room_id != target_room_id:
                    similarity = self._cosine_similarity(target_embedding, room_info['embedding'])
                    similarities.append({
                        'room_id': room_id,
                        'similarity_score': round(float(similarity), 3),
                        'metadata': room_info['data']
                    })
            
            # Sort by similarity score (highest first)
            similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            logger.debug(f"Found {len(similarities)} similar rooms for {target_room_id}")
            return similarities[:n_results]
            
        except Exception as e:
            logger.error(f"Error finding similar rooms for {target_room_id}: {e}")
            return []
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            # Ensure arrays are not empty
            if a.size == 0 or b.size == 0:
                return 0.0
            
            dot_product = np.dot(a, b)
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)
            
            if norm_a == 0 or norm_b == 0:
                return 0.0
            
            return float(dot_product / (norm_a * norm_b))
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the stored embeddings"""
        try:
            return {
                'rooms': len(self._room_embeddings),
                'users': len(self._user_embeddings),
                'bookings': len(self._booking_embeddings),
                'total_embeddings': len(self._room_embeddings) + len(self._user_embeddings) + len(self._booking_embeddings),
                'model': self.model_name
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}
    
    def health_check(self) -> Dict[str, Any]:
        """Check the health of the embedding system"""
        try:
            # Test embedding creation
            test_embedding = self._get_embedding("test")
            
            # Get stats
            stats = self.get_collection_stats()
            
            return {
                'status': 'healthy',
                'embedding_dimension': len(test_embedding) if test_embedding is not None else 0,
                'model': self.model_name,
                'collections': stats,
                'fallback_mode': self.embeddings is None
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }