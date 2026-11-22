# QuickNotes — Single-Page Note Application (SPA)

> **Internship Task 1**: Build a single-page application where users can write and save notes. The note should be sent to a Python backend, stored in a database, and displayed on the same page. This task introduces request-response flow and basic data storage.

---

## 📌 Project Overview

**QuickNotes** is a modern Single-Page Application (SPA) designed to demonstrate fundamental web development concepts:
1. **Client-Side SPA Architecture**: A responsive, dynamic interface where users can write, view, search, edit, and delete notes without refreshing or leaving the page.
2. **Python Backend**: A lightweight REST API built with **Python (Flask)** handling incoming HTTP requests.
3. **Database Persistence**: Notes are permanently stored in an **SQLite** database (`notes.db`).
4. **Request-Response Flow**: Seamless asynchronous communication (`fetch` / AJAX) between client and server.

---

## 🎯 Task Requirements Checklist

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Single-Page Application (SPA)** | Dynamic UI (`templates/index.html`) updates in real time via DOM manipulation without page reloads | ✅ Completed |
| **Write and Save Notes** | Note composer with character count, title support, and validation | ✅ Completed |
| **Sent to Python Backend** | Client sends asynchronous HTTP `POST` requests to Flask REST API (`/api/notes`) | ✅ Completed |
| **Stored in a Database** | SQLite database (`notes.db`) with `notes` table handling CRUD operations | ✅ Completed |
| **Displayed on the Same Page** | Newly created notes are dynamically rendered into the notes grid immediately | ✅ Completed |
| **Request-Response Flow** | Demonstrated via structured JSON payloads, status codes (`200`, `201`, `400`, `404`, `500`), and real-time state updates | ✅ Completed |

---

## 🔄 Request-Response Flow Architecture

```
+-------------------------------------------------------------+
|                     Client (Browser SPA)                    |
|  - User inputs note & clicks "Save Note"                    |
|  - JavaScript calls fetch('/api/notes', { method: 'POST' }) |
+------------------------------+------------------------------+
                               |
                   1. HTTP POST Request
                   (JSON: { title, content })
                               v
+-------------------------------------------------------------+
|                 Python Backend (Flask REST API)             |
|  - Validates request payload & data format                  |
|  - Prepares SQL Query                                       |
+------------------------------+------------------------------+
                               |
                   2. SQL INSERT INTO notes
                               v
+-------------------------------------------------------------+
|                     SQLite Database                         |
|  - Stores record in 'notes' table                           |
|  - Generates auto-increment ID & timestamps                 |
+------------------------------+------------------------------+
                               |
                   3. Confirmation & Record
                               v
+-------------------------------------------------------------+
|                 Python Backend (Flask REST API)             |
|  - Formats JSON response: { message, note: { id, ... } }    |
|  - Returns HTTP 201 Created status                          |
+------------------------------+------------------------------+
                               |
                   4. HTTP 201 Response
                               v
+-------------------------------------------------------------+
|                     Client (Browser SPA)                    |
|  - Parses response JSON                                     |
|  - Prepends new note card to DOM (no page reload!)          |
|  - Shows toast notification: "Note saved successfully!"     |
+-------------------------------------------------------------+
```

---

## 🗄️ Database Schema

The SQLite database (`notes.db`) consists of a `notes` table:

```sql
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/` | Serves the Single-Page Application | *None* | `200 OK` |
| `GET` | `/api/notes` | Retrieves all saved notes | *None* | `200 OK` |
| `POST` | `/api/notes` | Creates and saves a new note | `{ "title": "...", "content": "..." }` | `201 Created` |
| `PUT` | `/api/notes/<id>` | Updates an existing note | `{ "title": "...", "content": "..." }` | `200 OK` |
| `DELETE` | `/api/notes/<id>` | Deletes a note by ID | *None* | `200 OK` |
| `GET` | `/api/health` | Health check endpoint | *None* | `200 OK` |

---

## 🚀 How to Run the Application

### 1. Prerequisites
- Python 3.8 or higher installed on your computer.

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the Application
Run the Python application:
```bash
python app.py
```
*(On Windows, you can also double-click `run_python_app.bat`)*

### 4. Open in Browser
Visit:
```
http://127.0.0.1:5000
```

---

## 📁 Project Structure

```
QuickNotes/
├── app.py                  # Python Flask server & REST API route handlers
├── database.py             # SQLite database layer (table creation, CRUD operations)
├── notes.db                # SQLite database file (created automatically)
├── templates/
│   └── index.html          # Single-Page Application (HTML, CSS & Vanilla JS fetch)
├── requirements.txt        # Python dependencies (Flask)
├── run_python_app.bat      # Windows 1-click startup script
└── README.md               # Complete documentation & architecture guide
```

---

## 💡 Key Features
- **Instant Note Creation**: Write and save notes in real time.
- **Dynamic DOM Rendering**: Notes appear immediately without refreshing the page.
- **Search Filtering**: Real-time client-side search across titles and note contents.
- **Inline Editing**: Edit existing notes directly from the note card.
- **Note Deletion**: Remove notes with instant state update.
- **Persistent Storage**: Data survives server and browser restarts via SQLite.
- **Responsive Design**: Works cleanly on desktops, tablets, and mobile devices.
