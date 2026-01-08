import { Request, Response } from 'express'
import { UserService } from './user.service'
import { logger } from '../../services/logger.service'
import { AuthService } from '../auth/auth.service'

export class UserController {
  static async getUsers(req: Request, res: Response) {
    try {
      const filter = req.query

      const users = await UserService.query(filter)
      res.json(users)
    } catch (err: any) {
      logger.error('Failed to get users', err)
      res.status(500).send({ err: 'Failed to get users' })
    }
  }

  static async rememberUser(req: Request, res: Response) {
    try {
      const user = await UserService.getById(req.params.id)
      const loginToken = AuthService.getLoginToken(user)
      res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })
      res.json(user)
    } catch (err: any) {
      logger.error('Failed to remember user', err)
      res.status(500).send({ err: 'Failed to remember user' })
    }
  }

  static async getUser(req: Request, res: Response) {
    try {
      const user = await UserService.getById(req.params.id)
      res.json(user)
    } catch (err: any) {
      logger.error('Failed to get user', err)
      res.status(500).send({ err: 'Failed to get user' })
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const user = await UserService.update(req.params.id, req.body)
      res.json(user)
    } catch (err: any) {
      logger.error('Failed to update user', err)
      res.status(500).send({ err: 'Failed to update user' })
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      await UserService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete user', err)
      res.status(500).send({ err: 'Failed to delete user' })
    }
  }
}
