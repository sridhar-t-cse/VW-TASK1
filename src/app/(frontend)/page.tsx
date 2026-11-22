import type { Metadata } from 'next'
import QuickNotesApp from './quick-notes-app'

export const metadata: Metadata = {
  title: 'QuickNotes — Capture your thoughts',
  description: 'A simple, beautiful place to capture and organize your notes.',
}

export default function HomePage() {
  return <QuickNotesApp />
}
