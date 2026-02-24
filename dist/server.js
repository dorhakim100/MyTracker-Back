"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
// Translate
const translate_routes_1 = require("./api/translate/translate.routes");
const auth_routes_1 = require("./api/auth/auth.routes");
const user_routes_1 = require("./api/user/user.routes");
const log_routes_1 = require("./api/log/log.routes");
const menu_routes_1 = require("./api/menu/menu.routes");
const day_routes_1 = require("./api/day/day.routes");
const meal_routes_1 = require("./api/meal/meal.routes");
const weight_routes_1 = require("./api/weight/weight.routes");
const goal_routes_1 = require("./api/goal/goal.routes");
const workout_routes_1 = require("./api/workout/workout.routes");
const session_routes_1 = require("./api/session/session.routes");
const instructions_routes_1 = require("./api/instructions/instructions.routes");
const trainer_request_routes_1 = require("./api/trainer-request/trainer-request.routes");
const set_routes_1 = require("./api/set/set.routes");
const item_routes_1 = require("./api/item/item.routes");
const exercise_routes_1 = require("./api/exercise/exercise.routes");
const gpt_routes_1 = require("./api/chatGPT/gpt.routes");
const socket_service_1 = require("./services/socket/socket.service");
const setupAls_middleware_1 = require("./middleware/setupAls.middleware");
const logger_service_1 = require("./services/logger.service");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
}
// Express App Config
app.set('trust proxy', 1);
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../public')))
//   // app.use(express.static(path.resolve('public')))
// } else {
//   const corsOptions = {
//     origin: [
//       'http://127.0.0.1:3000',
//       'http://localhost:3000',
//       'http://127.0.0.1:5173',
//       'http://localhost:5173',
//       // Capacitor
//       'https://localhost',
//       'http://localhost',
//       'capacitor://localhost',
//       'ionic://localhost',
//       'https://localhost/',
//       'http://localhost/',
//       'capacitor://localhost/',
//       'ionic://localhost/',
//     ],
//     credentials: true,
//   }
//   app.use(cors(corsOptions))
// }
const allowedOrigins = new Set([
    // Web dev
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Capacitor / Ionic
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
    // Production domains
    'https://mytracker-j6fc.onrender.com',
]);
// Serve static ONLY in production
const corsOptions = {
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true); // Postman/curl
        if (allowedOrigins.has(origin))
            return cb(null, true);
        return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions)); // preflight
app.all('*', setupAls_middleware_1.setupAsyncLocalStorage);
// Routes
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/user', user_routes_1.userRoutes);
app.use('/api/log', log_routes_1.logRoutes);
app.use('/api/menu', menu_routes_1.menuRoutes);
app.use('/api/day', day_routes_1.dayRoutes);
app.use('/api/meal', meal_routes_1.mealRoutes);
app.use('/api/weight', weight_routes_1.weightRoutes);
app.use('/api/goal', goal_routes_1.goalRoutes);
app.use('/api/workout', workout_routes_1.workoutRoutes);
app.use('/api/session', session_routes_1.sessionRoutes);
app.use('/api/instructions', instructions_routes_1.instructionsRoutes);
app.use('/api/trainer-request', trainer_request_routes_1.trainerRequestRoutes);
app.use('/api/set', set_routes_1.setRoutes);
app.use('/api/item', item_routes_1.itemRoutes);
app.use('/api/exercise', exercise_routes_1.exerciseRoutes);
app.use('/api/chatgpt', gpt_routes_1.chatGPTRoutes);
app.use('/api/translate', translate_routes_1.translateRoutes);
// Setup Socket.IO
(0, socket_service_1.setupSocketAPI)(server);
// Serve frontend in production
app.get('/**', (req, res) => {
    // res.sendFile(path.resolve('public/index.html'))
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Database connection
const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URL;
        const dbName = process.env.DB_NAME;
        const conn = await mongoose_1.default.connect(uri, { dbName });
        logger_service_1.logger.info(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        logger_service_1.logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
// Start server
const port = process.env.PORT || 3030;
connectDB().then(() => {
    server.listen(port, () => {
        logger_service_1.logger.info('Server is running on port: ' + port);
    });
});
