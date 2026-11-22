import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

export type Note = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const NOTES_FILE = path.join(DATA_DIR, 'notes.json')

const DEFAULT_NOTES: Note[] = [
  {
    id: 'note-welcome',
    content: 'Welcome to QuickNotes! 📝\n\nUse this space to quickly capture your thoughts, meeting notes, tasks, or creative ideas. Click the edit or delete icons on any note to manage your thoughts.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'note-shortcuts',
    content: '💡 Tip: You can search across all your saved notes instantly using the search bar above.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    try {
      await fs.access(NOTES_FILE)
    } catch {
      await fs.writeFile(NOTES_FILE, JSON.stringify(DEFAULT_NOTES, null, 2), 'utf-8')
    }
  } catch (error) {
    console.error('Failed to initialize notes storage:', error)
  }
}

export async function getLocalNotes(): Promise<Note[]> {
  await ensureDataFile()
  try {
    const raw = await fs.readFile(NOTES_FILE, 'utf-8')
    const notes: Note[] = JSON.parse(raw)
    return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (error) {
    console.error('Failed to read notes:', error)
    return []
  }
}

export async function createLocalNote(content: string): Promise<Note> {
  await ensureDataFile()
  const notes = await getLocalNotes()
  const now = new Date().toISOString()
  const newNote: Note = {
    id: crypto.randomUUID(),
    content,
    createdAt: now,
    updatedAt: now,
  }
  const updated = [newNote, ...notes]
  await fs.writeFile(NOTES_FILE, JSON.stringify(updated, null, 2), 'utf-8')
  return newNote
}

export async function updateLocalNote(id: string, content: string): Promise<Note | null> {
  await ensureDataFile()
  const notes = await getLocalNotes()
  const index = notes.findIndex((n) => n.id === id)
  if (index === -1) return null

  const now = new Date().toISOString()
  const updatedNote: Note = {
    ...notes[index],
    content,
    updatedAt: now,
  }
  notes[index] = updatedNote
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8')
  return updatedNote
}

export async function deleteLocalNote(id: string): Promise<boolean> {
  await ensureDataFile()
  const notes = await getLocalNotes()
  const exists = notes.some((n) => n.id === id)
  if (!exists) return false

  const filtered = notes.filter((n) => n.id !== id)
  await fs.writeFile(NOTES_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
  return true
}
