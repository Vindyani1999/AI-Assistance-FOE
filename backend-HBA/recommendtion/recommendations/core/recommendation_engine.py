# recommendations/core/recommendation_engine.py
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_, func
import pandas as pd
import numpy as np
import logging
import time
import hashlib
import json
import asyncio

try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
except ImportError:
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
    except ImportError:
        HuggingFaceEmbeddings = None

try:
    from langchain_community.vectorstores import Chroma
except ImportError:
    Chroma = None

from ..strategies.alternative_time import AlternativeTimeStrategy
from ..strategies.alternative_room import AlternativeRoomStrategy
from ..strategies.proactive_suggestions import ProactiveSuggestionStrategy
from ..strategies.smart_scheduling import SmartSchedulingStrategy
from ..data.analytics_processor import AnalyticsProcessor
from ..utils.cache_manager import CacheManager
from ..utils.metrics import RecommendationMetrics
from .preference_learner import PreferenceLearner
from ...config.recommendation_config import RecommendationConfig, DatabaseManager
from src.models import MRBSRoom, MRBSEntry, MRBSRepeat

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Central recommendation engine that orchestrates different recommendation strategies
    Enhanced to properly work with MySQL main database using actual MRBS tables
    """
    
    def __init__(self, db: Session = None, config: Optional[RecommendationConfig] = None) -> None:
        """
        Initialize the recommendation engine
        
        Args:
            db: Database session (if None, will create from config)
            config: Configuration object (optional)
        """
        logger.info("Initializing RecommendationEngine with MySQL integration")
        
        self.config = config or RecommendationConfig()
        
        try:
            self.db_manager = DatabaseManager(self.config)
            
            if db:
                self.db = db
            else:
                self.db = self.db_manager.get_main_session()
            
            self.cache_db = self.db_manager.get_cache_engine()
        except Exception as e:
            logger.warning(f"Could not initialize database manager: {e}")
            self.db = db
            self.db_manager = None
            self.cache_db = None
        
        # Initialize core components with proper error handling
        self._initialize_components()
        
        # Initialize strategies with proper error handling
        self._initialize_strategies()
        
        # Initialize embeddings with proper error handling
        self._initialize_embeddings()
        
        # Valid request types
        self.valid_request_types = {
            "alternative_time", "alternative_room", "proactive", 
            "smart_scheduling", "comprehensive"
        }

        try:
            self._verify_database_connection()
        except Exception as e:
            logger.warning(f"Database verification failed: {e}")
    
    def _initialize_components(self):
        """Initialize core components with proper error handling"""
        try:
            self.analytics = AnalyticsProcessor(self.db)
        except Exception as e:
            logger.warning(f"Could not initialize AnalyticsProcessor: {e}")
            self.analytics = None
            
        try:
            self.cache = CacheManager()
        except Exception as e:
            logger.warning(f"Could not initialize CacheManager: {e}")
            self.cache = None

        try:
            self.metrics = RecommendationMetrics()
        except Exception as e:
            logger.warning(f"Could not initialize RecommendationMetrics: {e}")
            self.metrics = None
            
        # Initialize PreferenceLearner with required db parameter
        try:
            if self.db:
                self.preference_learner = PreferenceLearner(
                    db=self.db,
                    embedding_model=None,  
                    cache_manager=self.cache
                )
            else:
                logger.warning("No database session available for PreferenceLearner")
                self.preference_learner = None
        except Exception as e:
            logger.warning(f"Could not initialize PreferenceLearner: {e}")
            self.preference_learner = None
    
    def _initialize_strategies(self):
        """Initialize recommendation strategies with proper error handling"""
        # Initialize AlternativeTimeStrategy
        try:
            self.alternative_time = AlternativeTimeStrategy(self.db)
        except Exception as e:
            logger.warning(f"Could not initialize AlternativeTimeStrategy: {e}")
            self.alternative_time = None
            
        # Initialize AlternativeRoomStrategy
        try:
            self.alternative_room = AlternativeRoomStrategy(self.db)
        except Exception as e:
            logger.warning(f"Could not initialize AlternativeRoomStrategy: {e}")
            self.alternative_room = None
            
        # Initialize ProactiveSuggestionStrategy
        try:
            self.proactive = ProactiveSuggestionStrategy(self.db)
        except Exception as e:
            logger.warning(f"Could not initialize ProactiveSuggestionStrategy: {e}")
            self.proactive = None
            
        # Initialize SmartSchedulingStrategy with special handling for async issues
        try:
            self.smart_scheduling = self._initialize_smart_scheduling_strategy()
        except Exception as e:
            logger.warning(f"Could not initialize SmartSchedulingStrategy: {e}")
            self.smart_scheduling = None
    
    def _initialize_smart_scheduling_strategy(self):
        """Initialize SmartSchedulingStrategy with comprehensive error handling"""
        try:
            try:
                loop = asyncio.get_running_loop()
                logger.info("Running in async context, initializing SmartSchedulingStrategy carefully")
            except RuntimeError:
                logger.info("No running event loop, initializing SmartSchedulingStrategy normally")
            
            try:
                return SmartSchedulingStrategy(self.db, db_session=self.db)
            except TypeError:
                try:
                    return SmartSchedulingStrategy(self.db)
                except TypeError:
                    try:
                        return SmartSchedulingStrategy(db_session=self.db)
                    except TypeError:
                        try:
                            logger.warning("Initializing SmartSchedulingStrategy without database connection")
                            return SmartSchedulingStrategy()
                        except Exception as e:
                            logger.error(f"Could not initialize SmartSchedulingStrategy at all: {e}")
                            return None
                            
        except Exception as e:
            logger.error(f"Unexpected error initializing SmartSchedulingStrategy: {e}")
            return None
    
    def _initialize_embeddings(self):
        """Initialize embeddings with proper error handling"""
        try:
            if HuggingFaceEmbeddings is None:
                logger.warning("HuggingFaceEmbeddings not available, skipping embeddings initialization")
                self.embeddings = None
                return
                
            embedding_model = getattr(self.config, 'EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')
            self.embeddings = HuggingFaceEmbeddings(model_name=embedding_model)
            logger.info(f"Initialized embeddings with model: {embedding_model}")
            
            if self.preference_learner and hasattr(self.preference_learner, 'embedding_model'):
                self.preference_learner.embedding_model = self.embeddings
                
        except Exception as e:
            logger.warning(f"Failed to initialize embeddings: {e}")
            self.embeddings = None
   
    def get_recommendations(self, request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Get recommendations using actual database data
        
        Args:
            request_data: Dictionary containing request information
        
        Returns:
            List of recommendation dictionaries
        """
        try:
            # Extract information from request_data
            user_id = str(request_data.get('user_id', 'unknown'))
            room_id = request_data.get('room_id', '')
            start_time = request_data.get('start_time', '')
            end_time = request_data.get('end_time', '')
            purpose = request_data.get('purpose', '')
            requirements = request_data.get('requirements', {})
            
            logger.info(f"Generating recommendations for user {user_id}")
            
            recommendations = []
            
            try:
                alt_time_recs = self._get_alternative_time_recommendations_from_db(request_data)
                recommendations.extend(alt_time_recs)
            except Exception as e:
                logger.warning(f"Alternative time recommendations failed: {e}")
            
            try:
                alt_room_recs = self._get_alternative_room_recommendations_from_db(request_data)
                recommendations.extend(alt_room_recs)
            except Exception as e:
                logger.warning(f"Alternative room recommendations failed: {e}")
            
            try:
                proactive_recs = self._get_proactive_recommendations_from_db(request_data)
                recommendations.extend(proactive_recs)
            except Exception as e:
                logger.warning(f"Proactive recommendations failed: {e}")
            
            try:
                smart_recs = self._get_smart_scheduling_recommendations_from_db(request_data)
                recommendations.extend(smart_recs)
            except Exception as e:
                logger.warning(f"Smart scheduling recommendations failed: {e}")
            
            if not recommendations:
                logger.info("No recommendations generated, creating fallback recommendations")
                recommendations = self._create_fallback_recommendations(request_data)
            
            logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return self._create_fallback_recommendations(request_data)
    
    def _get_alternative_time_recommendations_from_db(self, request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get alternative time recommendations using actual database data"""
        if not self.db:
            return []
        
        try:
            room_name = request_data.get('room_id', '')
            start_time_str = request_data.get('start_time', '')
            end_time_str = request_data.get('end_time', '')
            capacity_required = request_data.get('capacity', 1)
            
            try:
                if 'T' in start_time_str:
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                else:
                    start_time = datetime.strptime(start_time_str, '%Y-%m-%d %H:%M:%S')
                    end_time = datetime.strptime(end_time_str, '%Y-%m-%d %H:%M:%S')
            except (ValueError, TypeError):
                logger.warning("Could not parse datetime strings, using current time")
                start_time = start_time_str
                end_time = end_time_str
            
            # Convert to Unix timestamps for database query
            start_timestamp = int(start_time.timestamp())
            end_timestamp = int(end_time.timestamp())
            
            # Find the room
            room = self.db.query(MRBSRoom).filter(
                MRBSRoom.room_name == room_name,
                MRBSRoom.disabled == False
            ).first()
            
            if not room:
                alternative_rooms_query = alternative_rooms_query.order_by(
                   func.abs(MRBSRoom.capacity - room.capacity)
                )
            else:
                alternative_rooms_query = alternative_rooms_query.order_by(MRBSRoom.capacity)
        
            alternative_rooms = alternative_rooms_query.limit(10).all()
        
            
            recommendations = []
            
            # Check for alternative times (1 hour earlier and later)
            time_alternatives = [
                (start_time - timedelta(hours=1), end_time - timedelta(hours=1), "1 hour earlier"),
                (start_time + timedelta(hours=1), end_time + timedelta(hours=1), "1 hour later"),
                (start_time - timedelta(hours=2), end_time - timedelta(hours=2), "2 hours earlier"),
                (start_time + timedelta(hours=2), end_time + timedelta(hours=2), "2 hours later"),
            ]
            
            for alt_start, alt_end, description in time_alternatives:
                alt_start_ts = int(alt_start.timestamp())
                alt_end_ts = int(alt_end.timestamp())
                
                conflicts = self.db.query(MRBSEntry).filter(
                    MRBSEntry.room_id == room.id,
                    MRBSEntry.start_time < alt_end_ts,
                    MRBSEntry.end_time > alt_start_ts,
                    MRBSEntry.status == 0  
                ).count()
                
                if conflicts == 0:
                    # Calculate score based on time preference
                    score = 0.8
                    if "earlier" in description:
                        score += 0.1  # Slightly prefer earlier times
                    if "1 hour" in description:
                        score += 0.1  # Prefer closer times
                    
                    recommendations.append({
                        'type': 'alternative_time',
                        'score': min(score, 1.0),
                        'reason': f'Room {room_name} available {description}',
                        'suggestion': {
                            'room_id': room_name,
                            'room_name': room_name,
                            'start_time': alt_start.isoformat(),
                            'end_time': alt_end.isoformat(),
                            'confidence': min(score, 1.0)
                        },
                        'data_source': 'mysql_alternative_time'
                    })
                    
                    # Limit to top 3 alternative times
                    if len(recommendations) >= 3:
                        break
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in alternative time recommendations: {e}")
            return []
    
    def _get_alternative_room_recommendations_from_db(self, request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get alternative room recommendations using actual database data"""
        if not self.db:
            return []
        
        try:
            room_name = request_data.get('room_id', '')
            start_time_str = request_data.get('start_time', '')
            end_time_str = request_data.get('end_time', '')
            capacity_required = request_data.get('capacity', 1)
            
            try:
                if 'T' in start_time_str:
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                else:
                    start_time = datetime.strptime(start_time_str, '%Y-%m-%d %H:%M:%S')
                    end_time = datetime.strptime(end_time_str, '%Y-%m-%d %H:%M:%S')
            except (ValueError, TypeError):
                logger.warning("Could not parse datetime strings, using current time")
                start_time = start_time_str
                end_time = end_time_str
            
            # Convert to Unix timestamps
            start_timestamp = int(start_time.timestamp())
            end_timestamp = int(end_time.timestamp())
            
            # Get the original room for comparison
            original_room = self.db.query(MRBSRoom).filter(
                MRBSRoom.room_name == room_name,
                MRBSRoom.disabled == False
            ).first()
            
            # Find alternative rooms with similar or better capacity
            alternative_rooms_query = self.db.query(MRBSRoom).filter(
                MRBSRoom.disabled == False,
                MRBSRoom.room_name != room_name,
                MRBSRoom.capacity >= capacity_required
            )
            
            # If we have the original room, prioritize rooms with similar capacity
            if original_room:
                alternative_rooms_query = alternative_rooms_query.order_by(
                    func.abs(MRBSRoom.capacity - original_room.capacity)
                )
            else:
                alternative_rooms_query = alternative_rooms_query.order_by(MRBSRoom.capacity)
            
            alternative_rooms = alternative_rooms_query.limit(10).all()
            
            recommendations = []
            
            for room in alternative_rooms:
                # Check if this room is available at the requested time
                conflicts = self.db.query(MRBSEntry).filter(
                    MRBSEntry.room_id == room.id,
                    MRBSEntry.start_time < end_timestamp,
                    MRBSEntry.end_time > start_timestamp,
                    MRBSEntry.status == 0  # Assuming 0 is active status
                ).count()
                
                if conflicts == 0:
                    # Calculate score based on room similarity
                    score = 0.75
                    if original_room:
                        # Bonus for similar capacity
                        capacity_diff = abs(room.capacity - original_room.capacity)
                        if capacity_diff == 0:
                            score += 0.2
                        elif capacity_diff <= 2:
                            score += 0.1
                        
                        if hasattr(room, 'area_id') and hasattr(original_room, 'area_id'):
                            if room.area_id == original_room.area_id:
                                score += 0.1
                    
                    recommendations.append({
                        'type': 'alternative_room',
                        'score': min(score, 1.0),
                        'reason': f'Room {room.room_name} (capacity: {room.capacity}) available at requested time',
                        'suggestion': {
                            'room_id': room.room_name,
                            'room_name': room.room_name,
                            'capacity': room.capacity,
                            'description': room.description or '',
                            'start_time': start_time.isoformat(),
                            'end_time': end_time.isoformat(),
                            'confidence': min(score, 1.0)
                        },
                        'data_source': 'mysql_alternative_room'
                    })
                    
                    # Limit to top 5 alternative rooms
                    if len(recommendations) >= 5:
                        break
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in alternative room recommendations: {e}")
            return []
    
    def _get_proactive_recommendations_from_db(self, request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get proactive recommendations based on user's booking history"""
        if not self.db:
            return []
        
        try:
            user_id = str(request_data.get('user_id', 'unknown'))
            purpose = request_data.get('purpose', '')
            start_time_str = request_data.get('start_time', '')
            end_time_str = request_data.get('end_time', '')
            
            try:
                if 'T' in start_time_str:
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                else:
                    start_time = datetime.strptime(start_time_str, '%Y-%m-%d %H:%M:%S')
                    end_time = datetime.strptime(end_time_str, '%Y-%m-%d %H:%M:%S')
            except (ValueError, TypeError):
                logger.warning("Could not parse datetime strings, using current time")
                start_time = start_time_str
                end_time = start_time + timedelta(hours=1)
            
            # Convert to Unix timestamps
            start_timestamp = int(start_time.timestamp())
            end_timestamp = int(end_time.timestamp())
            
            # Get user's booking history (last 90 days)
            history_start = start_time_str - timedelta(days=90)
            history_start_ts = int(history_start.timestamp())
            
            # Find user's most frequently booked rooms
            user_bookings = self.db.query(
                MRBSEntry.room_id,
                MRBSRoom.room_name,
                MRBSRoom.capacity,
                MRBSRoom.description,
                func.count(MRBSEntry.id).label('booking_count')
            ).join(
                MRBSRoom, MRBSEntry.room_id == MRBSRoom.id
            ).filter(
                MRBSEntry.create_by == user_id,
                MRBSEntry.start_time >= history_start_ts,
                MRBSRoom.disabled == False
            ).group_by(
                MRBSEntry.room_id, MRBSRoom.room_name, MRBSRoom.capacity, MRBSRoom.description
            ).order_by(
                func.count(MRBSEntry.id).desc()
            ).limit(5).all()
            
            recommendations = []
            
            for booking in user_bookings:
                room_id, room_name, capacity, description, booking_count = booking
                
                # Check if this room is available at the requested time
                conflicts = self.db.query(MRBSEntry).filter(
                    MRBSEntry.room_id == room_id,
                    MRBSEntry.start_time < end_timestamp,
                    MRBSEntry.end_time > start_timestamp,
                    MRBSEntry.status == 0
                ).count()
                
                if conflicts == 0:
                    # Calculate score based on booking frequency
                    base_score = 0.7
                    frequency_bonus = min(booking_count * 0.05, 0.2)  # Max 0.2 bonus
                    score = base_score + frequency_bonus
                    
                    recommendations.append({
                        'type': 'proactive',
                        'score': min(score, 1.0),
                        'reason': f'You have booked {room_name} {booking_count} times recently',
                        'suggestion': {
                            'room_id': room_name,
                            'room_name': room_name,
                            'capacity': capacity,
                            'description': description or '',
                            'start_time': start_time.isoformat(),
                            'end_time': end_time.isoformat(),
                            'confidence': min(score, 1.0),
                            'booking_history': booking_count
                        },
                        'data_source': 'mysql_user_history'
                    })
            
            # Also check for rooms used by others for similar purposes
            if purpose:
                similar_bookings = self.db.query(
                    MRBSEntry.room_id,
                    MRBSRoom.room_name,
                    MRBSRoom.capacity,
                    MRBSRoom.description,
                    func.count(MRBSEntry.id).label('usage_count')
                ).join(
                    MRBSRoom, MRBSEntry.room_id == MRBSRoom.id
                ).filter(
                    MRBSEntry.name.like(f'%{purpose}%'),
                    MRBSEntry.start_time >= history_start_ts,
                    MRBSRoom.disabled == False
                ).group_by(
                    MRBSEntry.room_id, MRBSRoom.room_name, MRBSRoom.capacity, MRBSRoom.description
                ).order_by(
                    func.count(MRBSEntry.id).desc()
                ).limit(3).all()
                
                for booking in similar_bookings:
                    room_id, room_name, capacity, description, usage_count = booking
                    
                    # Skip if already recommended
                    if any(rec['suggestion']['room_name'] == room_name for rec in recommendations):
                        continue
                    
                    # Check availability
                    conflicts = self.db.query(MRBSEntry).filter(
                        MRBSEntry.room_id == room_id,
                        MRBSEntry.start_time < end_timestamp,
                        MRBSEntry.end_time > start_timestamp,
                        MRBSEntry.status == 0
                    ).count()
                    
                    if conflicts == 0:
                        score = 0.6 + min(usage_count * 0.02, 0.15)
                        
                        recommendations.append({
                            'type': 'proactive',
                            'score': min(score, 1.0),
                            'reason': f'Room {room_name} frequently used for {purpose} ({usage_count} times)',
                            'suggestion': {
                                'room_id': room_name,
                                'room_name': room_name,
                                'capacity': capacity,
                                'description': description or '',
                                'start_time': start_time.isoformat(),
                                'end_time': end_time.isoformat(),
                                'confidence': min(score, 1.0),
                                'purpose_usage': usage_count
                            },
                            'data_source': 'mysql_purpose_analysis'
                        })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in proactive recommendations: {e}")
            return []
    
    def _get_smart_scheduling_recommendations_from_db(self, request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get smart scheduling recommendations based on booking patterns"""
        if not self.db:
            return []
        
        try:
            start_time_str = request_data.get('start_time', '')
            end_time_str = request_data.get('end_time', '')
            
            try:
                if 'T' in start_time_str:
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                else:
                    start_time = datetime.strptime(start_time_str, '%Y-%m-%d %H:%M:%S')
                    end_time = datetime.strptime(end_time_str, '%Y-%m-%d %H:%M:%S')
            except (ValueError, TypeError):
                logger.warning("Could not parse datetime strings, using current time")
                start_time = start_time_str
                end_time = start_time + timedelta(hours=1)
            
            recommendations = []
            
            # Analyze booking patterns for the requested time slot
            requested_hour = start_time.hour
            requested_day_of_week = start_time.weekday()
            
            # Find rooms with low utilization at this time slot
            time_window_start = start_time.replace(minute=0, second=0, microsecond=0)
            time_window_end = time_window_start + timedelta(hours=1)
            
            # Look at historical data for the same time slot
            history_start = start_time_str - timedelta(days=30)
            history_start_ts = int(history_start.timestamp())
            
            # Calculate utilization rates for each room at this time slot
            room_utilization = self.db.query(
                MRBSRoom.id,
                MRBSRoom.room_name,
                MRBSRoom.capacity,
                MRBSRoom.description,
                func.count(MRBSEntry.id).label('bookings_count')
            ).outerjoin(
                MRBSEntry, 
                and_(
                    MRBSEntry.room_id == MRBSRoom.id,
                    MRBSEntry.start_time >= history_start_ts,
                    func.hour(func.from_unixtime(MRBSEntry.start_time)) == requested_hour,
                    func.dayofweek(func.from_unixtime(MRBSEntry.start_time)) == requested_day_of_week + 1
                )
            ).filter(
                MRBSRoom.disabled == False
            ).group_by(
                MRBSRoom.id, MRBSRoom.room_name, MRBSRoom.capacity, MRBSRoom.description
            ).order_by(
                func.count(MRBSEntry.id).asc()  # Rooms with lowest utilization first
            ).limit(10).all()
            
            for room_data in room_utilization:
                room_id, room_name, capacity, description, bookings_count = room_data
                
                # Check if room is available at requested time
                start_timestamp = int(start_time.timestamp())
                end_timestamp = int(end_time.timestamp())
                
                conflicts = self.db.query(MRBSEntry).filter(
                    MRBSEntry.room_id == room_id,
                    MRBSEntry.start_time < end_timestamp,
                    MRBSEntry.end_time > start_timestamp,
                    MRBSEntry.status == 0
                ).count()
                
                if conflicts == 0:
                    # Calculate score based on low utilization (more available = higher score)
                    utilization_rate = bookings_count / 30  # bookings per day over 30 days
                    availability_score = max(0.5, 1.0 - (utilization_rate * 0.1))
                    
                    # Bonus for larger capacity (more flexible)
                    capacity_bonus = min(capacity * 0.01, 0.2)
                    
                    final_score = availability_score + capacity_bonus
                    
                    recommendations.append({
                        'type': 'smart_scheduling',
                        'score': min(final_score, 1.0),
                        'reason': f'Room {room_name} has low utilization at this time ({bookings_count} bookings in 30 days)',
                        'suggestion': {
                            'room_id': room_name,
                            'room_name': room_name,
                            'capacity': capacity,
                            'description': description or '',
                            'start_time': start_time.isoformat(),
                            'end_time': end_time.isoformat(),
                            'confidence': min(final_score, 1.0),
                            'utilization_data': {
                                'historical_bookings': bookings_count,
                                'utilization_rate': round(utilization_rate, 2)
                            }
                        },
                        'data_source': 'mysql_utilization_analysis'
                    })
                    
                    # Limit to top 3 smart scheduling recommendations
                    if len(recommendations) >= 3:
                        break
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in smart scheduling recommendations: {e}")
            return []
    
    def _create_fallback_recommendations(self, request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create fallback recommendations when all strategies fail"""
        user_id = str(request_data.get('user_id', 'unknown'))
        room_id = request_data.get('room_id', '')
        start_time = request_data.get('start_time', '')
        end_time = request_data.get('end_time', '')
        purpose = request_data.get('purpose', '')
        
        logger.info("Creating fallback recommendations")
        
        return [
            {
                'type': 'alternative_time',
                'score': 0.75,
                'reason': f'Room {room_id} available 1 hour earlier (fallback)',
                'suggestion': {
                    'room_id': room_id,
                    'start_time': start_time,
                    'end_time': end_time,
                    'confidence': 0.75
                },
                'data_source': 'fallback_simulation'
            },
            {
                'type': 'alternative_room',
                'score': 0.70,
                'reason': 'Similar room with same capacity available (fallback)',
                'suggestion': {
                    'room_id': f'{room_id}_alt',
                    'start_time': start_time,
                    'end_time': end_time,
                    'confidence': 0.70
                },
                'data_source': 'fallback_simulation'
            },
            {
                'type': 'proactive',
                'score': 0.65,
                'reason': f'Based on typical {purpose} patterns (fallback)',
                'suggestion': {
                    'room_id': f'{room_id}_suggested',
                    'start_time': start_time,
                    'end_time': end_time,
                    'confidence': 0.65
                },
                'data_source': 'fallback_pattern_analysis'
            }
        ]
        
    def _verify_database_connection(self, request_data: Dict[str, Any]) -> None:
        """Verify MySQL database connection and required tables exist"""
        if not self.db:
            logger.warning("No database session available, skipping verification")
            return
            
        start_time = request_data.get('start_time', '')
        
        try:
            self.db.execute(text("SELECT 1")).fetchone()
            logger.info("✓ MySQL database connection successful")
            
            try:
                room_count = self.db.query(MRBSRoom).filter(MRBSRoom.disabled == False).count()
                logger.info(f"✓ Found {room_count} active rooms in mrbs_room table")
                
                entry_count = self.db.query(MRBSEntry).count()
                logger.info(f"✓ Found {entry_count} entries in mrbs_entry table")
                
                repeat_count = self.db.query(MRBSRepeat).count()
                logger.info(f"✓ Found {repeat_count} repeats in mrbs_repeat table")
                
                if room_count == 0:
                    logger.warning("No active rooms found - check if rooms are properly configured")
                
            except Exception as e:
                logger.warning(f"Could not query tables: {e}")
            
            try:
                recent_bookings = self.db.query(MRBSEntry).filter(
                    MRBSEntry.start_time >= int((start_time - timedelta(days=7)).timestamp())
                ).count()
                
                logger.info(f"✓ MySQL database accessible. Found {recent_bookings} recent bookings")
            except Exception as e:
                logger.warning(f"Could not query recent booking data: {e}")
            
        except Exception as e:
            logger.warning(f"Database verification failed: {e}")
    
    def get_room_data_from_db(self, room_name: str = None) -> List[Dict[str, Any]]:
        """
        Fetch room data from MySQL database using your models
        
        Args:
            room_name: Specific room name to fetch (optional)
        
        Returns:
            List of room data dictionaries
        """
        if not self.db:
            logger.warning("No database session available, returning empty list")
            return []
            
        try:
            query = self.db.query(MRBSRoom).filter(MRBSRoom.disabled == False)
            
            if room_name:
                query = query.filter(MRBSRoom.room_name == room_name)
            else:
                query = query.order_by(MRBSRoom.room_name)
            
            rooms = query.all()
            
            room_data = []
            for room in rooms:
                room_data.append({
                    'room_id': room.id,
                    'room_name': room.room_name,
                    'description': room.description or '',
                    'capacity': room.capacity or 1,
                    'admin_email': room.room_admin_email or '',
                    'area_id': room.area_id,
                    'sort_key': room.sort_key or '',
                    'custom_html': room.custom_html or ''
                })
            
            logger.debug(f"Fetched {len(room_data)} rooms from MySQL")
            return room_data
            
        except Exception as e:
            logger.error(f"Error fetching room data from MySQL: {e}")
            return []
    
    def check_room_availability_in_db(self, 
                                     room_name: str, 
                                     start_time: datetime, 
                                     end_time: datetime) -> bool:
        """
        Check if a room is available for the given time slot using your models
        
        Args:
            room_name: Name of the room
            start_time: Start time of the booking
            end_time: End time of the booking
        
        Returns:
            True if room is available, False otherwise
        """
        if not self.db:
            logger.warning("No database session available, assuming room is available")
            return True
            
        try:
            # Find the room
            room = self.db.query(MRBSRoom).filter(
                MRBSRoom.room_name == room_name,
                MRBSRoom.disabled == False
            ).first()
            
            if not room:
                logger.warning(f"Room {room_name} not found")
                return False
            
            # Convert to Unix timestamps
            start_timestamp = int(start_time.timestamp())
            end_timestamp = int(end_time.timestamp())
            
            # Check for conflicts
            conflicts = self.db.query(MRBSEntry).filter(
                MRBSEntry.room_id == room.id,
                MRBSEntry.start_time < end_timestamp,
                MRBSEntry.end_time > start_timestamp,
                MRBSEntry.status == 0  # Assuming 0 is active status
            ).count()
            
            is_available = conflicts == 0
            logger.debug(f"Room {room_name} availability check: {'Available' if is_available else 'Occupied'}")
            
            return is_available
            
        except Exception as e:
            logger.error(f"Error checking room availability: {e}")
            return False
    
    def get_user_booking_history(self, request_data: Dict[str, Any],user_id: str, days: int = 30,) -> List[Dict[str, Any]]:
        """
        Get user's booking history from the database
        
        Args:
            user_id: User identifier
            days: Number of days to look back
        
        Returns:
            List of booking data dictionaries
        """
        if not self.db:
            return []
        
        start_time_str = request_data.get('start_time', '')
        end_time_str = request_data.get('end_time', '')
        capacity_required = request_data.get('capacity', 1)
        
        try:
            start_date = start_time_str - timedelta(days=days)
            start_timestamp = int(start_date.timestamp())
            
            bookings = self.db.query(
                MRBSEntry,
                MRBSRoom.room_name,
                MRBSRoom.capacity,
                MRBSRoom.description
            ).join(
                MRBSRoom, MRBSEntry.room_id == MRBSRoom.id
            ).filter(
                MRBSEntry.create_by == user_id,
                MRBSEntry.start_time >= start_timestamp,
                MRBSRoom.disabled == False
            ).order_by(
                MRBSEntry.start_time.desc()
            ).all()
            
            booking_history = []
            for entry, room_name, capacity, description in bookings:
                booking_history.append({
                    'entry_id': entry.id,
                    'room_name': room_name,
                    'room_capacity': capacity,
                    'room_description': description,
                    'booking_name': entry.name,
                    'description': entry.description,
                    'start_time': datetime.fromtimestamp(entry.start_time),
                    'end_time': datetime.fromtimestamp(entry.end_time),
                    'created_by': entry.create_by,
                    'type': entry.type,
                    'status': entry.status
                })
            
            logger.debug(f"Retrieved {len(booking_history)} bookings for user {user_id}")
            return booking_history
            
        except Exception as e:
            logger.error(f"Error retrieving user booking history: {e}")
            return []
    
    def get_room_utilization_stats(self,request_data: Dict[str, Any], room_name: str = None, days: int = 30) -> Dict[str, Any]:
        """
        Get room utilization statistics from the database
        
        Args:
            room_name: Specific room name (optional)
            days: Number of days to analyze
        
        Returns:
            Dictionary with utilization statistics
        """
        if not self.db:
            return {}
        
        start_time_str = request_data.get('start_time', '')
        end_time_str = request_data.get('end_time', '')
        capacity_required = request_data.get('capacity', 1)
        
        try:
            start_date = start_time_str  - timedelta(days=days)
            start_timestamp = int(start_date.timestamp())
            
            query = self.db.query(
                MRBSRoom.room_name,
                MRBSRoom.capacity,
                func.count(MRBSEntry.id).label('total_bookings'),
                func.sum(MRBSEntry.end_time - MRBSEntry.start_time).label('total_hours_booked'),
                func.avg(MRBSEntry.end_time - MRBSEntry.start_time).label('avg_booking_duration')
            ).outerjoin(
                MRBSEntry,
                and_(
                    MRBSEntry.room_id == MRBSRoom.id,
                    MRBSEntry.start_time >= start_timestamp,
                    MRBSEntry.status == 0
                )
            ).filter(
                MRBSRoom.disabled == False
            ).group_by(
                MRBSRoom.room_name, MRBSRoom.capacity
            )
            
            if room_name:
                query = query.filter(MRBSRoom.room_name == room_name)
            
            results = query.all()
            
            utilization_stats = {}
            total_possible_hours = days * 24  
            
            for result in results:
                room_name_result = result.room_name
                capacity = result.capacity
                total_bookings = result.total_bookings or 0
                total_seconds_booked = result.total_hours_booked or 0
                avg_duration_seconds = result.avg_booking_duration or 0
                
                # Convert seconds to hours
                total_hours_booked = total_seconds_booked / 3600 if total_seconds_booked else 0
                avg_duration_hours = avg_duration_seconds / 3600 if avg_duration_seconds else 0
                
                # Calculate utilization rate
                utilization_rate = (total_hours_booked / total_possible_hours) * 100 if total_possible_hours > 0 else 0
                
                utilization_stats[room_name_result] = {
                    'capacity': capacity,
                    'total_bookings': total_bookings,
                    'total_hours_booked': round(total_hours_booked, 2),
                    'avg_booking_duration_hours': round(avg_duration_hours, 2),
                    'utilization_rate_percent': round(utilization_rate, 2),
                    'bookings_per_day': round(total_bookings / days, 2)
                }
            
            logger.debug(f"Retrieved utilization stats for {len(utilization_stats)} rooms")
            return utilization_stats
            
        except Exception as e:
            logger.error(f"Error retrieving room utilization stats: {e}")
            return {}
    
    def get_engine_status(self) -> Dict[str, Any]:
        """Get status information about the recommendation engine"""
        
        # Test MySQL connection
        mysql_status = "connected"
        room_count = "unknown"
        booking_count = "unknown"
        
        try:
            self.db.execute(text("SELECT 1")).fetchone()
            
            try:
                room_count = self.db.query(MRBSRoom).filter(MRBSRoom.disabled == False).count()
                recent_bookings = self.db.query(MRBSEntry).filter(
                    MRBSEntry.start_time >= int((datetime.now() - timedelta(days=30)).timestamp())
                ).count()
                booking_count = recent_bookings
            except Exception as e:
                logger.debug(f"Could not get database statistics: {e}")
                
        except Exception as e:
            mysql_status = f"error: {str(e)}"
        
        return {
            "status": "active",
            "mysql_connection": mysql_status,
            "database_stats": {
                "active_rooms": room_count,
                "recent_bookings": booking_count
            },
            "embeddings_loaded": self.embeddings is not None,
            "strategies_loaded": {
                "alternative_time": self.alternative_time is not None,
                "alternative_room": self.alternative_room is not None,
                "proactive": self.proactive is not None,
                "smart_scheduling": self.smart_scheduling is not None
            },
            "components_loaded": {
                "analytics": self.analytics is not None,
                "cache": self.cache is not None,
                "metrics": self.metrics is not None,
                "preference_learner": self.preference_learner is not None
            },
            "config": {
                "max_recommendations": getattr(self.config, 'max_recommendations', 5),
                "cache_ttl": getattr(self.config, 'cache_ttl_default', 1800),
                "database_url": self.config.database_url.split('@')[1] if hasattr(self.config, 'database_url') and '@' in self.config.database_url else "hidden"
            }
        }
    
    def __del__(self):
        """Cleanup method to properly close database connections"""
        try:
            if hasattr(self, 'db_manager') and self.db_manager:
                self.db_manager.close_all()
                logger.debug("Database connections closed successfully")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")


class RecommendationEngineFactory:
    """Factory class to easily create RecommendationEngine instances"""
    
    @staticmethod
    def create_engine(config: RecommendationConfig = None, 
                     environment: str = None) -> RecommendationEngine:
        """
        Create a RecommendationEngine instance
        
        Args:
            config: Configuration object (optional)
            environment: Environment name for config (optional)
        
        Returns:
            Configured RecommendationEngine instance
        """
        if config is None:
            try:
                from ...config.recommendation_config import ConfigFactory
                config = ConfigFactory.create_config(environment or 'development')
            except Exception as e:
                logger.warning(f"Could not create config from factory: {e}")
                config = RecommendationConfig()
        
        try:
            config.ensure_directories()
        except Exception as e:
            logger.warning(f"Could not ensure directories: {e}")
        
        # Validate MySQL connection
        try:
            if not config.validate_mysql_connection():
                logger.warning("MySQL connection validation failed, but continuing")
        except Exception as e:
            logger.warning(f"Could not validate MySQL connection: {e}")
        
        return RecommendationEngine(config=config)
    
    @staticmethod
    def create_development_engine() -> RecommendationEngine:
        """Create engine for development environment"""
        return RecommendationEngineFactory.create_engine(environment='development')
    
    @staticmethod
    def create_production_engine() -> RecommendationEngine:
        """Create engine for production environment"""
        return RecommendationEngineFactory.create_engine(environment='production')
    
    @staticmethod
    def create_testing_engine() -> RecommendationEngine:
        """Create engine for testing environment"""
        return RecommendationEngineFactory.create_engine(environment='testing')


def create_recommendation_engine_with_fallback(db: Session = None, 
                                             config: RecommendationConfig = None,
                                             fallback_to_mock: bool = True) -> RecommendationEngine:
    """
    Create recommendation engine with comprehensive error handling and fallback options
    
    Args:
        db: Database session
        config: Configuration object
        fallback_to_mock: Whether to fallback to mock mode on errors
    
    Returns:
        RecommendationEngine instance
    """
    try:
        return RecommendationEngine(db=db, config=config)
    except Exception as e:
        logger.error(f"Failed to create RecommendationEngine: {e}")
        
        if fallback_to_mock:
            logger.info("Attempting to create RecommendationEngine in fallback mode")
            try:
                # Create minimal config for fallback
                fallback_config = RecommendationConfig() if config is None else config
                
                return RecommendationEngine(db=None, config=fallback_config)
            except Exception as e2:
                logger.error(f"Fallback mode also failed: {e2}")
                raise e2
        else:
            raise e


def validate_recommendation_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate recommendation request data structure
    
    Args:
        request_data: Request data to validate
    
    Returns:
        Dictionary with validation results
    """
    validation_result = {
        "valid": True,
        "errors": [],
        "warnings": []
    }
    
    required_fields = ['user_id']
    for field in required_fields:
        if field not in request_data:
            validation_result["errors"].append(f"Missing required field: {field}")
            validation_result["valid"] = False
    
    recommended_fields = ['room_id', 'start_time', 'end_time', 'purpose']
    for field in recommended_fields:
        if field not in request_data:
            validation_result["warnings"].append(f"Missing recommended field: {field}")
    
    if 'user_id' in request_data and not isinstance(request_data['user_id'], (str, int)):
        validation_result["errors"].append("user_id must be string or integer")
        validation_result["valid"] = False
    
    time_fields = ['start_time', 'end_time']
    for field in time_fields:
        if field in request_data:
            time_value = request_data[field]
            if isinstance(time_value, str):
                try:
                    datetime.fromisoformat(time_value.replace('Z', '+00:00'))
                except ValueError:
                    validation_result["warnings"].append(f"{field} should be in ISO format")
    
    return validation_result