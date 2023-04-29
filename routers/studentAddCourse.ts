import express from 'express'
import { PrismaClient } from '@prisma/client'
import { StudentCourseDto} from '../types/student_course';
import { prisma } from '../utils/prisma';
const studentCourseRouter = express.Router();



studentCourseRouter.post('/', async (req, res) => {
        const addCourseToUser = await prisma.user.update({
        where: {
            id: 1
        },
        data: { 
             
        }
    })

    res.send(addCourseToUser)
})

export default studentCourseRouter