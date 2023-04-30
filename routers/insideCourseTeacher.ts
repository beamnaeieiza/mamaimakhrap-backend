import express from "express";
import { PrismaClient } from "@prisma/client";
import { ProfileDto } from "../types/profile";
import { prisma } from "../utils/prisma";
const insideCourseTeacherRouter = express.Router();

insideCourseTeacherRouter.get("/:course_id", async (req, res) => {
  const courseId = +req.params.course_id;
  const joinCode = 123;
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
    },
    include: {
        enrolled_users: true,
    },
  });

  return res.send(course);
});

export default insideCourseTeacherRouter;
