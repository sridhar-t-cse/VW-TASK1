import config from '@payload-config'
import { getPayload } from 'payload'

const MAX_NOTE_LENGTH = 5000

type NoteInput = {
  content?: unknown
}

function validateContent(input: NoteInput) {
  if (typeof input.content !== 'string') {
    return { error: 'Note content must be text.' } as const
  }

  const content = input.content.trim()

  if (!content) {
    return { error: 'Please write something before saving your note.' } as const
  }

  if (content.length > MAX_NOTE_LENGTH) {
    return {
      error: `Your note must be ${MAX_NOTE_LENGTH.toLocaleString()} characters or fewer.`,
    } as const
  }

  return { content } as const
}

async function readJSON(request: Request): Promise<NoteInput | null> {
  try {
    return (await request.json()) as NoteInput
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    const result = await payload.find({
      collection: 'notes',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: '-updatedAt',
      user,
    })

    return Response.json({ notes: result.docs })
  } catch {
    return Response.json(
      { error: 'We could not load your notes. Please try again.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const input = await readJSON(request)
  if (!input) {
    return Response.json({ error: 'The request body must be valid JSON.' }, { status: 400 })
  }

  const validated = validateContent(input)
  if ('error' in validated) {
    return Response.json({ error: validated.error }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    const note = await payload.create({
      collection: 'notes',
      data: { content: validated.content },
      overrideAccess: false,
      user,
    })

    return Response.json({ message: 'Note saved.', note }, { status: 201 })
  } catch {
    return Response.json(
      { error: 'We could not save your note. Please try again.' },
      { status: 500 },
    )
  }
}
