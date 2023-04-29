import express from 'express'
import { PrismaClient } from '@prisma/client'
import { ProfileDto } from '../types/profile';
import { prisma } from '../utils/prisma';
const profileRouter = express.Router();



profileRouter.get('/', async (req, res) => {
    const userId = 1;
    const user = await prisma.user.findFirst ({
        where: {
            id: userId
        }
    })

    if(!user) {
        throw new Error("User not found!")
    }

    return res.send(user);
})

export default profileRouter