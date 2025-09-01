"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("./user.model");
const logger_service_1 = require("../../services/logger.service");
class UserService {
    static async query(filterBy = {}) {
        try {
            const users = await user_model_1.User.find(filterBy).select('-password');
            return users;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to query users', err);
            throw err;
        }
    }
    static async getById(userId) {
        try {
            const [user] = await user_model_1.User.aggregate([
                // 1) Find the user
                { $match: { _id: new mongoose_1.default.Types.ObjectId(userId) } },
                // 2) Hide password
                { $project: { password: 0 } },
                // 3) Normalize `loggedToday` -> ObjectId | null (handles string/ObjectId/missing)
                {
                    $set: {
                        _loggedTodayOid: {
                            $switch: {
                                branches: [
                                    {
                                        case: {
                                            $and: [
                                                { $eq: [{ $type: '$loggedToday' }, 'string'] },
                                                {
                                                    $regexMatch: {
                                                        input: '$loggedToday',
                                                        regex: '^[0-9a-fA-F]{24}$',
                                                    },
                                                },
                                            ],
                                        },
                                        then: { $toObjectId: '$loggedToday' },
                                    },
                                    {
                                        case: { $eq: [{ $type: '$loggedToday' }, 'objectId'] },
                                        then: '$loggedToday',
                                    },
                                ],
                                default: null,
                            },
                        },
                    },
                },
                // 4) Lookup Day by normalized id; inside, keep date & calories and populate logs
                {
                    $lookup: {
                        from: 'days',
                        let: { dayId: '$_loggedTodayOid' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$dayId'] } } },
                            // Keep only what we need from Day and normalize its logs (string/ObjectId -> ObjectId[])
                            {
                                $project: {
                                    _id: 1,
                                    date: 1,
                                    calories: 1,
                                    logs: {
                                        $filter: {
                                            input: {
                                                $map: {
                                                    input: { $ifNull: ['$logs', []] },
                                                    as: 'id',
                                                    in: {
                                                        $switch: {
                                                            branches: [
                                                                {
                                                                    case: {
                                                                        $and: [
                                                                            { $eq: [{ $type: '$$id' }, 'string'] },
                                                                            {
                                                                                $regexMatch: {
                                                                                    input: '$$id',
                                                                                    regex: '^[0-9a-fA-F]{24}$',
                                                                                },
                                                                            },
                                                                        ],
                                                                    },
                                                                    then: { $toObjectId: '$$id' },
                                                                },
                                                                {
                                                                    case: {
                                                                        $eq: [{ $type: '$$id' }, 'objectId'],
                                                                    },
                                                                    then: '$$id',
                                                                },
                                                            ],
                                                            default: null,
                                                        },
                                                    },
                                                },
                                            },
                                            as: 'oid',
                                            cond: { $ne: ['$$oid', null] },
                                        },
                                    },
                                },
                            },
                            // Populate Day.logs -> full Log docs
                            {
                                $lookup: {
                                    from: 'logs',
                                    localField: 'logs',
                                    foreignField: '_id',
                                    as: 'logs',
                                },
                            },
                        ],
                        as: '_dayAgg',
                    },
                },
                // 5) Flatten: user.loggedToday = the Day doc (or null)
                {
                    $set: {
                        loggedToday: { $first: '$_dayAgg' },
                    },
                },
                // 6) Cleanup temp fields
                { $unset: ['_loggedTodayOid', '_dayAgg'] },
            ]);
            return user || null;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get user ${userId}`, err);
            throw err;
        }
    }
    static async getByEmail(email) {
        try {
            const user = await user_model_1.User.findOne({ email });
            const aggregatedUser = await UserService.getById(user?._id);
            return aggregatedUser;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get user by email ${email}`, err);
            throw err;
        }
    }
    static async remove(userId) {
        try {
            await user_model_1.User.findByIdAndDelete(userId);
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove user ${userId}`, err);
            throw err;
        }
    }
    static async update(userId, userToUpdate) {
        try {
            const user = await user_model_1.User.findByIdAndUpdate(userId, userToUpdate, {
                new: true,
            });
            const aggregatedUser = await UserService.getById(userId);
            return aggregatedUser;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to update user ${userId}`, err);
            throw err;
        }
    }
    static getDefaultGoal() {
        const id = new mongoose_1.default.Types.ObjectId().toString();
        return {
            _id: id,
            isMain: true,
            updatedAt: new Date(),
            title: 'My Goal',
            dailyCalories: 2400,
            macros: {
                calories: 2400,
                protein: 180,
                carbs: 300,
                fat: 53,
            },
        };
    }
}
exports.UserService = UserService;
