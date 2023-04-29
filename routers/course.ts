import express from 'express'
import { PrismaClient } from '@prisma/client'
import { CourseDto } from '../types/course';
import { init } from '../utils/firebase';
import { prisma } from '../utils/prisma';

const router = express.Router();

router.get('/', async (req, res) => {
    res.send('not implemented yet!') 
})

router.post('/', async (req, res) => {
    const data = req.body as CourseDto;

    const addCourseToUser = await prisma.user.update({
        where: {
            id: 1
        },
        data: {
            created_courses: {
                create: {
                    name: "Advanced Java",
                    code: "CSC323", 
                }
            }
        }
    })

    res.send(addCourseToUser)
})

export default router