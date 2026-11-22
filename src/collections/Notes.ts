import type { CollectionConfig } from 'payload'

const publicAccess = () => true

export const Notes: CollectionConfig = {
  slug: 'notes',
  access: {
    create: publicAccess,
    delete: publicAccess,
    read: publicAccess,
    update: publicAccess,
  },
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['content', 'updatedAt', 'createdAt'],
    description: 'Notes created from the QuickNotes application.',
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: 5000,
      admin: {
        rows: 8,
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Please enter a note.'
        }

        if (value.trim().length > 5000) {
          return 'Notes must be 5,000 characters or fewer.'
        }

        return true
      },
    },
  ],
  timestamps: true,
  versions: false,
}
