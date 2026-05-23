"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bodyFatResponseSchema = void 0;
const generative_ai_1 = require("@google/generative-ai");
exports.bodyFatResponseSchema = {
    type: generative_ai_1.SchemaType.OBJECT,
    properties: {
        minPercent: {
            type: generative_ai_1.SchemaType.NUMBER,
            description: 'Lower bound of estimated body fat percentage',
        },
        maxPercent: {
            type: generative_ai_1.SchemaType.NUMBER,
            description: 'Upper bound of estimated body fat percentage',
        },
        note: {
            type: generative_ai_1.SchemaType.STRING,
            description: 'Short note describing the physique',
        },
    },
    required: ['minPercent', 'maxPercent', 'note'],
};
