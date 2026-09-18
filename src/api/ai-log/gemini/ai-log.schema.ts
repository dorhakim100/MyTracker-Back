import { SchemaType, type ResponseSchema } from '@google/generative-ai'

export const aiLogResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    mode: {
      type: SchemaType.STRING,
      format: 'enum',
      description: 'meal, custom, or cant_figure',
      enum: ['meal', 'custom', 'cant_figure'],
    },
    name: {
      type: SchemaType.STRING,
      description: 'Dish or item name in the user language when possible',
    },
    includeOil: {
      type: SchemaType.BOOLEAN,
      description:
        'True only if a food is typically cooked in oil AND the photo looks oily or the text implies oil/fried/sauteed',
    },
    items: {
      type: SchemaType.ARRAY,
      description:
        'Detected foods. One item for custom mode. Empty for cant_figure. Do not include oil here.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          gramsMin: { type: SchemaType.NUMBER },
          gramsMax: { type: SchemaType.NUMBER },
          proteinPer100g: { type: SchemaType.NUMBER },
          carbsPer100g: { type: SchemaType.NUMBER },
          fatPer100g: { type: SchemaType.NUMBER },
        },
        required: [
          'name',
          'gramsMin',
          'gramsMax',
          'proteinPer100g',
          'carbsPer100g',
          'fatPer100g',
        ],
      },
    },
  },
  required: ['mode', 'name', 'includeOil', 'items'],
}
