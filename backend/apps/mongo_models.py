from datetime import datetime

# MongoDB document structure for sessions and messages
# (No ODM, just dicts for motor)

def session_doc(session_id, user_id, topic):
    return {
        "_id": session_id,
        "user_id": user_id,
        "topic": topic,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

def message_doc(session_id, user_id, role, content):
    return {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow()
    }
