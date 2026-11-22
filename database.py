"""
Database access layer for QuickNotes Application.
Uses SQLite for lightweight, serverless, reliable local data storage.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'notes.db')


def get_db_connection():
    """Create and return a database connection with dictionary-like row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the SQLite database schema and seed initial sample notes if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Check if table is empty, seed starter notes
    cursor.execute('SELECT COUNT(*) as count FROM notes')
    count = cursor.fetchone()['count']

    if count == 0:
        sample_notes = [
            (
                "Welcome to QuickNotes! 📝",
                "This is a Single Page Application (SPA) powered by a Python backend and SQLite database.\n\nYou can write, save, edit, search, and delete notes dynamically on this page without reloading.",
            ),
            (
                "Request-Response Flow 🚀",
                "Every note you save triggers an HTTP POST request to the Python Flask backend. The server processes the JSON payload, executes an SQL INSERT into SQLite, and returns the saved record to update this page in real time.",
            ),
        ]
        cursor.executemany(
            'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            sample_notes
        )

    conn.commit()
    conn.close()


def get_all_notes():
    """Retrieve all notes sorted by latest updated_at first."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC')
    rows = cursor.fetchall()
    notes = [dict(row) for row in rows]
    conn.close()
    return notes


def get_note_by_id(note_id):
    """Retrieve a single note by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?', (note_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def add_note(content, title=None):
    """
    Insert a new note into the SQLite database.
    If title is omitted, derive a clean preview title from the first line of content.
    """
    if not title:
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        if lines:
            first_line = lines[0]
            title = (first_line[:40] + '...') if len(first_line) > 40 else first_line
        else:
            title = "Untitled Note"

    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
        (title, content, now, now)
    )
    conn.commit()
    note_id = cursor.lastrowid
    conn.close()
    return get_note_by_id(note_id)


def update_note(note_id, content, title=None):
    """Update note content and title by ID."""
    existing = get_note_by_id(note_id)
    if not existing:
        return None

    if not title:
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        title = (lines[0][:40] + '...') if (lines and len(lines[0]) > 40) else (lines[0] if lines else "Untitled Note")

    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?',
        (title, content, now, note_id)
    )
    conn.commit()
    conn.close()
    return get_note_by_id(note_id)


def delete_note(note_id):
    """Delete a note by ID. Returns True if deleted, False if not found."""
    existing = get_note_by_id(note_id)
    if not existing:
        return False

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM notes WHERE id = ?', (note_id,))
    conn.commit()
    conn.close()
    return True
