export type BodyFatEstimateStatus = 'ok' | 'unusable_photo' | 'error'

export interface BodyFatEstimateInput {
  imageUrl: string
  weightKg: number
}

export interface BodyFatEstimateSuccess {
  status: 'ok'
  bodyFatMin: number
  bodyFatMax: number
  note: string
}

export interface BodyFatEstimateUnusablePhoto {
  status: 'unusable_photo'
  message: string
}

export interface BodyFatEstimateFailure {
  status: 'error'
  message: string
}

export type BodyFatEstimateResponse =
  | BodyFatEstimateSuccess
  | BodyFatEstimateUnusablePhoto
  | BodyFatEstimateFailure
