import { sonolus } from "../index.js";
import { Request,Response } from "express";
import { MESSAGE } from "../message.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.SECRET_KEY || 'your_jwt_secret';

export const setupAuth = () => {
    sonolus.router.post('/api/register', (async (req: Request, res: Response): Promise<void> => {
        const { username, password } = req.body;
        try {
            const existingUser = await UserModel.findOne({ username });
            if (existingUser) {
                res.status(400).json(MESSAGE.ERROR.USERNAMEEXISTS);
                return;
            }
            
            if (username.length < 3 || username.length > 20) {
                res.status(400).json(MESSAGE.ERROR.USERNAMELENGTH);
                return;
            }

            const user_number = Math.floor(Math.random() * 900000) + 100000;
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new UserModel({
                username,
                password: hashedPassword,
                userNumber: user_number,
            });

            await newUser.save();
            res.status(201).json(MESSAGE.SUCCESS.USERCREATED);
        } catch (e) {
            console.error(e);
            res.status(500).json(MESSAGE.ERROR.SERVERERROR);
        }
    }))

    sonolus.router.post('/api/login', (async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, password } = req.body;

            const user = await UserModel.findOne({ username });
            if (!user) {
                res.status(401).json(MESSAGE.ERROR.USERNOTFOUND);
                return;
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json(MESSAGE.ERROR.UNAUTHORIZED);
                return;
            }

            const token = jwt.sign(
                { 
                    id: user._id,
                    username: user.username,
                    user_number: user.userNumber,
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(200).json({
                message: MESSAGE.SUCCESS.OK,
                token,
                user: {
                    username: user.username,
                    user_number: user.userNumber,
                }
            })
        } catch (e) {
            console.error(e);
            res.status(500).json(MESSAGE.ERROR.SERVERERROR);
        }
    }))
}