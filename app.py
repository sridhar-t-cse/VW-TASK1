"""
QuickNotes - Python Backend
A lightweight REST API and Single-Page Application server powered by Flask and SQLite.
Demonstrates HTTP request-response flow and basic data persistence.
"""

from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import database

app = Flask(__name__, template_folder='templates', static_folder='static')

# Initialize database schema on startup
database.init_db()


@app.after_request
def add_cors_headers(response):
    """Enable Cross-Origin Resource Sharing (CORS) for all routes."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response


@app.route('/')
def index():
    """Serve the Single-Page Application (SPA)."""
    return render_template('index.html')


@app.route('/api/health', methods=['GET'])
def health():
    """API health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "QuickNotes Python Backend",
        "database": "SQLite"
    }), 200


@app.route('/api/notes', methods=['GET'])
@app.route('/api/quick-notes', methods=['GET'])
def get_notes():
    """
    Retrieve all notes from the SQLite database.
    [Request]: GET /api/notes
    [Response]: JSON list of note records
    """
    try:
        notes = database.get_all_notes()
        return jsonify({"notes": notes, "count": len(notes)}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch notes: {str(e)}"}), 500


@app.route('/api/notes', methods=['POST'])
@app.route('/api/quick-notes', methods=['POST'])
def create_note():
    """
    Create a new note in the SQLite database.
    [Request]: POST /api/notes with JSON body: { "content": "...", "title": "..." }
    [Response]: 201 Created with saved note details
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Request body must be a valid JSON object."}), 400

    content = data.get('content', '')
    if not isinstance(content, str) or not content.strip():
        return jsonify({"error": "Note content cannot be empty."}), 400

    if len(content.strip()) > 5000:
        return jsonify({"error": "Note content exceeds the 5,000 character limit."}), 400

    title = data.get('title')
    if title and isinstance(title, str):
        title = title.strip()
    else:
        title = None

    try:
        note = database.add_note(content=content.strip(), title=title)
        return jsonify({
            "message": "Note saved successfully.",
            "note": note
        }), 201
    except Exception as e:
        return jsonify({"error": f"Failed to save note: {str(e)}"}), 500


@app.route('/api/notes/<int:note_id>', methods=['PUT', 'PATCH'])
@app.route('/api/quick-notes/<int:note_id>', methods=['PUT', 'PATCH'])
def update_note(note_id):
    """
    Update an existing note in the SQLite database.
    [Request]: PUT /api/notes/<id> with JSON body: { "content": "...", "title": "..." }
    [Response]: 200 OK with updated note details
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Request body must be a valid JSON object."}), 400

    content = data.get('content', '')
    if not isinstance(content, str) or not content.strip():
        return jsonify({"error": "Note content cannot be empty."}), 400

    title = data.get('title')
    if title and isinstance(title, str):
        title = title.strip()
    else:
        title = None

    try:
        updated = database.update_note(note_id=note_id, content=content.strip(), title=title)
        if not updated:
            return jsonify({"error": "Note not found."}), 404

        return jsonify({
            "message": "Note updated successfully.",
            "note": updated
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update note: {str(e)}"}), 500


@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@app.route('/api/quick-notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """
    Delete a note from the SQLite database.
    [Request]: DELETE /api/notes/<id>
    [Response]: 200 OK with confirmation
    """
    try:
        success = database.delete_note(note_id)
        if not success:
            return jsonify({"error": "Note not found."}), 404

        return jsonify({"message": "Note deleted successfully.", "id": note_id}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete note: {str(e)}"}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print("  QuickNotes Application - Python Backend")
    print(f"  * Database: SQLite ({database.DB_PATH})")
    print(f"  * Running on http://127.0.0.1:{port}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=True)
