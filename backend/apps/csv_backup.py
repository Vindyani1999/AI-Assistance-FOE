import csv
import os
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger("csv-backup")

# Directory for temporary CSV backups
BACKUP_DIR = Path(__file__).parent.parent / "temp_backups"


def ensure_backup_directory():
    """Ensure the backup directory exists."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def get_csv_filename(session_id: str) -> Path:
    """
    Generate CSV filename based on session_id.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        Path object for the CSV file
    """
    return BACKUP_DIR / f"session_{session_id}.csv"


def save_message_to_csv(session_id: str, user_id: str, role: str, content: str) -> bool:
    """
    Save a chat message to CSV backup file.
    
    Args:
        session_id: Session identifier
        user_id: User identifier
        role: Message role (user/assistant)
        content: Message content
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        ensure_backup_directory()
        csv_file = get_csv_filename(session_id)
        
        # Check if file exists to determine if we need to write headers
        file_exists = csv_file.exists()
        
        with open(csv_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write header if new file
            if not file_exists:
                writer.writerow(['session_id', 'user_id', 'role', 'content', 'timestamp'])
            
            # Write message data
            timestamp = datetime.utcnow().isoformat()
            writer.writerow([session_id, user_id, role, content, timestamp])
        
        logger.info(f"Saved {role} message to CSV backup for session {session_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to save message to CSV: {e}")
        return False


def delete_csv_backup(session_id: str) -> bool:
    """
    Delete CSV backup file after successful MongoDB save.
    
    Args:
        session_id: Session identifier
        
    Returns:
        bool: True if deleted successfully, False otherwise
    """
    try:
        csv_file = get_csv_filename(session_id)
        
        if csv_file.exists():
            csv_file.unlink()
            logger.info(f"Deleted CSV backup for session {session_id}")
            return True
        else:
            logger.warning(f"CSV backup file not found for session {session_id}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to delete CSV backup: {e}")
        return False


def cleanup_old_backups(days: int = 7):
    """
    Clean up CSV backup files older than specified days.
    This is a safety mechanism to prevent disk space issues.
    
    Args:
        days: Number of days to keep backups (default: 7)
    """
    try:
        ensure_backup_directory()
        current_time = datetime.now().timestamp()
        cutoff_time = current_time - (days * 24 * 60 * 60)
        
        deleted_count = 0
        for csv_file in BACKUP_DIR.glob("session_*.csv"):
            if csv_file.stat().st_mtime < cutoff_time:
                csv_file.unlink()
                deleted_count += 1
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} old CSV backup files")
            
    except Exception as e:
        logger.error(f"Failed to cleanup old backups: {e}")
