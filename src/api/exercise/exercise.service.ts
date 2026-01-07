import { ExerciseModel, IExercise } from './exercise.model'
import { logger } from '../../services/logger.service'
import { Exercise } from '@/types/Exercise/Exercise'

export class ExerciseService {
  /**
   * Calculate relevance score for an exercise based on query match
   * Higher score = better match
   */
  private static calculateRelevanceScore(
    exercise: IExercise,
    query: string
  ): number {
    const normalizedQuery = query.toLowerCase().trim()
    const normalizedName = exercise.name.toLowerCase().trim()
    const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0)
    const nameWords = normalizedName.split(/\s+/).filter((w) => w.length > 0)

    let score = 0

    // Exact match (highest priority) - 1000 points
    if (normalizedName === normalizedQuery) {
      score += 1000
    }
    // Query starts with name or name starts with query - 800 points
    else if (
      normalizedName.startsWith(normalizedQuery) ||
      normalizedQuery.startsWith(normalizedName)
    ) {
      score += 800
    }
    // Name contains query as whole phrase - 600 points
    else if (normalizedName.includes(normalizedQuery)) {
      score += 600
    }
    // All query words appear in name (in order) - 500 points
    else if (
      queryWords.every((word) => normalizedName.includes(word)) &&
      queryWords.length > 0
    ) {
      // Check if words appear in order
      let lastIndex = -1
      const wordsInOrder = queryWords.every((word) => {
        const index = normalizedName.indexOf(word, lastIndex + 1)
        if (index > lastIndex) {
          lastIndex = index
          return true
        }
        return false
      })

      if (wordsInOrder) {
        score += 500
      } else {
        // Words appear but not in order - 300 points
        score += 300
      }
    }
    // Some query words appear in name - 100 points per word
    else {
      const matchingWords = queryWords.filter((word) =>
        normalizedName.includes(word)
      )
      score += matchingWords.length * 100
    }

    // Bonus: Query matches at word boundary (e.g., "bench press" matches "bench press" in "barbell bench press")
    const nameWordBoundaries = nameWords.join(' ')
    if (nameWordBoundaries.includes(normalizedQuery)) {
      score += 200
    }

    // Bonus: Query words match at the beginning of name words
    queryWords.forEach((queryWord) => {
      nameWords.forEach((nameWord) => {
        if (nameWord.startsWith(queryWord) || queryWord.startsWith(nameWord)) {
          score += 50
        }
      })
    })

    return score
  }
  /**
   * Get exercise by ID
   */
  static async getById(exerciseId: string): Promise<IExercise | null> {
    try {
      const exercise = await ExerciseModel.findById(exerciseId)
      return exercise
    } catch (err) {
      logger.error(`Failed to get exercise ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Get exercise by exerciseId (from ExerciseDB)
   */
  static async getByExerciseId(exerciseId: string): Promise<IExercise | null> {
    try {
      const exercise = await ExerciseModel.findOne({ exerciseId })
      return exercise
    } catch (err) {
      logger.error(`Failed to get exercise by exerciseId ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Get exercises by exerciseIds (bulk)
   */
  static async getByExerciseIds(exerciseIds: string[]): Promise<IExercise[]> {
    try {
      const exercises = await ExerciseModel.find({
        exerciseId: { $in: exerciseIds },
      })
      return exercises
    } catch (err) {
      logger.error('Failed to get exercises by exerciseIds', err)
      throw err
    }
  }

  /**
   * Query exercises with filters
   */
  static async query(filterBy = {}): Promise<IExercise[]> {
    try {
      const exercises = await ExerciseModel.find(filterBy)
      return exercises
    } catch (err) {
      logger.error('Failed to query exercises', err)
      throw err
    }
  }

  /**
   * Search exercises by name (text search)
   */
  static async searchByName(params: {
    query: string
    muscleGroup?: string
    equipment?: string
  }): Promise<IExercise[]> {
    try {
      const { query, muscleGroup, equipment } = params

      const muscleGroupLower = muscleGroup?.toLocaleLowerCase()
      const equipmentLower = equipment?.toLocaleLowerCase()

      // Build filter query
      const filter: any = {
        $or: [
          { $text: { $search: query } },
          { name: { $regex: query, $options: 'i' } },
        ],
      }

      // Add optional filters
      if (muscleGroup && muscleGroup !== 'All') {
        filter.muscleGroups = { $in: [muscleGroupLower] }
      }
      if (equipment && equipment !== 'All') {
        filter.equipments = { $in: [equipmentLower] }
      }

      const exercises = await ExerciseModel.find(filter)
      // return exercises

      // Calculate relevance scores and sort
      const exercisesWithScores = exercises.map((exercise) => {
        const relevanceScore = this.calculateRelevanceScore(exercise, query)
        const popularityScore = exercise.popularityScore || 0

        // Combined score: relevance (weighted more) + popularity (weighted less)
        // Relevance is multiplied by 10 to give it more weight than popularity
        const combinedScore = relevanceScore * 10 + popularityScore

        return {
          exercise,
          relevanceScore,
          popularityScore,
          combinedScore,
        }
      })

      // Sort by combined score (descending)
      exercisesWithScores.sort((a, b) => b.combinedScore - a.combinedScore)

      // Return just the exercises
      return exercisesWithScores.map((item) => item.exercise).slice(0, 50)
    } catch (err) {
      logger.error(`Failed to search exercises by name ${params.query}`, err)
      throw err
    }
  }

  /**
   * Search exercises by muscle groups
   */
  static async searchByMuscleGroups(
    muscleGroups: string[]
  ): Promise<IExercise[]> {
    try {
      const exercises = await ExerciseModel.find({
        muscleGroups: { $in: muscleGroups },
      })
      return exercises
    } catch (err) {
      logger.error(
        `Failed to search exercises by muscle groups ${muscleGroups}`,
        err
      )
      throw err
    }
  }

  /**
   * Search exercises by equipment
   */
  static async searchByEquipment(equipment: string[]): Promise<IExercise[]> {
    try {
      const exercises = await ExerciseModel.find({
        $or: [
          { equipment: { $in: equipment } },
          { equipments: { $in: equipment } },
        ],
      })
      return exercises
    } catch (err) {
      logger.error(`Failed to search exercises by equipment ${equipment}`, err)
      throw err
    }
  }

  /**
   * Add a single exercise
   */
  static async add(exercise: Partial<Exercise>): Promise<IExercise> {
    try {
      // Check if exercise with same exerciseId already exists
      if (exercise.exerciseId) {
        const existing = await ExerciseModel.findOne({
          exerciseId: exercise.exerciseId,
        })
        if (existing) {
          throw new Error(
            `Exercise with exerciseId ${exercise.exerciseId} already exists`
          )
        }
      }

      const addedExercise = await ExerciseModel.create(exercise)
      return addedExercise
    } catch (err: any) {
      logger.error('Failed to add exercise', err)
      throw err
    }
  }

  /**
   * Add multiple exercises (bulk insert)
   */
  static async addMany(exercises: Partial<Exercise>[]): Promise<IExercise[]> {
    try {
      // Filter out exercises that already exist
      const exerciseIds = exercises
        .map((ex) => ex.exerciseId)
        .filter(Boolean) as string[]

      if (exerciseIds.length > 0) {
        const existing = await ExerciseModel.find({
          exerciseId: { $in: exerciseIds },
        })
        const existingIds = new Set(
          existing.map((ex) => ex.exerciseId).filter(Boolean)
        )

        const newExercises = exercises.filter(
          (ex) => !existingIds.has(ex.exerciseId!)
        )

        if (newExercises.length === 0) {
          return existing
        }

        const savedExercises = await ExerciseModel.insertMany(newExercises, {
          ordered: false,
        }).catch((err: any) => {
          // If there are duplicate key errors, fetch existing ones
          if (err.code === 11000 || err.name === 'MongoServerError') {
            logger.info(`Some exercises already exist, fetching existing ones`)
            return ExerciseModel.find({
              exerciseId: { $in: exerciseIds },
            })
          }
          throw err
        })

        return [
          ...existing,
          ...(Array.isArray(savedExercises) ? savedExercises : []),
        ]
      }

      const savedExercises = await ExerciseModel.insertMany(exercises, {
        ordered: false,
      })
      return savedExercises
    } catch (err: any) {
      logger.error('Failed to add exercises', err)
      throw err
    }
  }

  /**
   * Update an exercise
   */
  static async update(
    exerciseId: string,
    exerciseToUpdate: Partial<Exercise>
  ): Promise<IExercise | null> {
    try {
      const exercise = await ExerciseModel.findByIdAndUpdate(
        exerciseId,
        exerciseToUpdate,
        {
          new: true,
        }
      )
      return exercise
    } catch (err) {
      logger.error(`Failed to update exercise ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Update an exercise by exerciseId (from ExerciseDB)
   */
  static async updateByExerciseId(
    exerciseId: string,
    exerciseToUpdate: Partial<Exercise>
  ): Promise<IExercise | null> {
    try {
      const exercise = await ExerciseModel.findOneAndUpdate(
        { exerciseId },
        exerciseToUpdate,
        {
          new: true,
        }
      )
      return exercise
    } catch (err) {
      logger.error(`Failed to update exercise by exerciseId ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Remove an exercise
   */
  static async remove(exerciseId: string): Promise<void> {
    try {
      await ExerciseModel.findByIdAndDelete(exerciseId)
    } catch (err) {
      logger.error(`Failed to remove exercise ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Remove an exercise by exerciseId (from ExerciseDB)
   */
  static async removeByExerciseId(exerciseId: string): Promise<void> {
    try {
      await ExerciseModel.findOneAndDelete({ exerciseId })
    } catch (err) {
      logger.error(`Failed to remove exercise by exerciseId ${exerciseId}`, err)
      throw err
    }
  }
}
