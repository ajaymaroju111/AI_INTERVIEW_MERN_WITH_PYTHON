import express, { type Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { connectDB } from './src/config/db.ts';
import { Socket } from 'node:dgram';
import { errorHandler, notFound } from './src/middleware/errorMiddleware.ts';
import authRoutes from './src/routes/auth.routes.ts';
import sessionRoutes from './src/routes/session.routes.ts';

connectDB();

const app : Application = express();
const server = createServer(app);

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);

const allowOrigin = [
    "http://localhost:5173",
    "http://localhost:3000",
]
const io : Server = new Server(server, {
    cors: {
        origin: allowOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }
});

app.use(cors({
    origin:  (origin, callback) => {
        if(!origin || allowOrigin.includes(origin)) {
            callback(null, true);
        } else {
            if (process.env.NODE_ENV === "production") {
                callback(null, true);
            }else{
                callback(new Error("Not allowed by CORS"));
            }
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
}));


dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('io', io);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    const userId : string = socket.handshake.query.userId as string;
    if(!userId){
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);
    }
});

io.on('disconnect', (Socket) => {
    console.log('A user disconnected:', Socket.id);
})

app.use(notFound);
app.use(errorHandler);


const PORT : string | number = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});