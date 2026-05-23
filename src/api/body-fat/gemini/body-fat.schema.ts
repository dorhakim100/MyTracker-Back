import { SchemaType, type ResponseSchema } from '@google/generative-ai'

export const bodyFatResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    minPercent: {
      type: SchemaType.NUMBER,
      description: 'Lower bound of estimated body fat percentage',
    },
    maxPercent: {
      type: SchemaType.NUMBER,
      description: 'Upper bound of estimated body fat percentage',
    },
    note: {
      type: SchemaType.STRING,
      description:
        'Short note describing the physique',
    },
  },
  required: ['minPercent', 'maxPercent', 'note'],
}
