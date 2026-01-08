import mongoose from 'mongoose'
import { Exercise } from '@/types/Exercise/Exercise'

export interface IExercise extends mongoose.Document {
  name: string
  muscleGroups: string[]
  image: string
  equipment: string[]
  exerciseId: string
  mainMuscles?: string[]
  secondaryMuscles?: string[]
  equipments?: string[]
  popularityScore?: number
  instructions?: string[]
}

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    muscleGroups: {
      type: [String],
      required: true,
      default: [],
    },
    image: {
      type: String,
      required: true,
    },
    equipment: {
      type: [String],
      required: true,
      default: [],
    },
    exerciseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mainMuscles: {
      type: [String],
      required: false,
      default: [],
    },
    secondaryMuscles: {
      type: [String],
      required: false,
      default: [],
    },
    equipments: {
      type: [String],
      required: false,
      default: [],
    },
    instructions: {
      type: [String],
      required: false,
      default: [],
    },
    popularityScore: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// Indexes for efficient searching
exerciseSchema.index({ name: 'text' }) // Text index for name searches
exerciseSchema.index({ exerciseId: 1 }) // Index for exerciseId lookups
exerciseSchema.index({ muscleGroups: 1 }) // Index for muscle group filtering
exerciseSchema.index({ equipment: 1 }) // Index for equipment filtering

export const ExerciseModel = mongoose.model<IExercise>(
  'Exercise',
  exerciseSchema
)
