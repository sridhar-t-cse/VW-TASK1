import { updateLocalNote, deleteLocalNote } from '@/lib/local-notes'

const MAX_NOTE_LENGTH = 5000

async function getContent(request: Request) {
  try {
    const body = (await request.json()) as { content?: unknown }
    if (typeof body.content !== 'string') {
      return { error: 'Note content must be text.' } as const
    }

    const content = body.content.trim()
    if (!content) {
      return { error: 'A note cannot be empty.' } as const
    }

    if (content.length > MAX_NOTE_LENGTH) {
      return {
        error: `Your note must be ${MAX_NOTE_LENGTH.toLocaleString()} characters or fewer.`,
      } as const
    }

    return { content } as const
  } catch {
    return { error: 'The request body must be valid JSON.' } as const
  }
}

function operationError(error: unknown, fallback: string) {
  const status =
    typeof error === 'object' && error !== null && 'status' in error && error.status === 404
      ? 404
      : 500

  return Response.json(
    { error: status === 404 ? 'That note no longer exists.' : fallback },
    { status },
  )
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const validated = await getContent(request)

  if ('error' in validated) {
    return Response.json({ error: validated.error }, { status: 400 })
  }

  try {
    if (process.env.FIGMA_EID && process.env.FIGMA_CONTENT_API_CONTENT_SYSTEM_ID) {
      try {
        const { getPayload } = await import('payload')
        const config = (await import('@payload-config')).default
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: request.headers })
        const note = await payload.update({
          collection: 'notes',
          id,
          data: { content: validated.content },
          overrideAccess: false,
          user,
        })

        return Response.json({ message: 'Note updated.', note })
      } catch (payloadError) {
        console.warn('Payload unavailable, falling back to local storage:', payloadError)
      }
    }

    const note = await updateLocalNote(id, validated.content)
    if (!note) {
      return Response.json({ error: 'That note no longer exists.' }, { status: 404 })
    }

    return Response.json({ message: 'Note updated.', note })
  } catch (error) {
    return operationError(error, 'We could not update your note. Please try again.')
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    if (process.env.FIGMA_EID && process.env.FIGMA_CONTENT_API_CONTENT_SYSTEM_ID) {
      try {
        const { getPayload } = await import('payload')
        const config = (await import('@payload-config')).default
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: request.headers })
        await payload.delete({
          collection: 'notes',
          id,
          overrideAccess: false,
          user,
        })

        return Response.json({ message: 'Note deleted.' })
      } catch (payloadError) {
        console.warn('Payload unavailable, falling back to local storage:', payloadError)
      }
    }

    const deleted = await deleteLocalNote(id)
    if (!deleted) {
      return Response.json({ error: 'That note no longer exists.' }, { status: 404 })
    }

    return Response.json({ message: 'Note deleted.' })
  } catch (error) {
    return operationError(error, 'We could not delete your note. Please try again.')
  }
}
