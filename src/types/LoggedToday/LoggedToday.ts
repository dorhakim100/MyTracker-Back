import { Log } from '../Log/Log'

export interface LoggedToday {
  _id: string
  date: string
  logs: Log[] | string[]
  calories: number
}
