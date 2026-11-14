import { Router } from 'express'
import { UserController } from './user.controller'
import {
  requireTrainerSearch,
  requireUserAccess,
} from '../../middleware/user-access.middleware'

const router = Router()

const ownOrTrainee = requireUserAccess([
  { from: 'params', name: 'id', required: true },
])
const selfOnly = requireUserAccess([
  { from: 'params', name: 'id', required: true, allowTrainer: false },
])
const addTrainee = requireUserAccess([
  { from: 'body', name: 'trainerId', required: true, allowTrainer: false },
])

router.get('/', requireTrainerSearch, UserController.getUsers)
router.get('/remember/:id', UserController.rememberUser)
router.get('/:id', ownOrTrainee, UserController.getUser)
router.post('/add-trainee', addTrainee, UserController.addTrainee)
router.put('/:id', ownOrTrainee, UserController.updateUser)
router.delete('/:id', selfOnly, UserController.deleteUser)

export const userRoutes = router
