import express from "express";
import { PrismaClient, User } from "@prisma/client";
import { CourseDto } from "../types/course";
import { init } from "../utils/firebase";
import { prisma } from "../utils/prisma";
import { TeacherCourseDto } from "../types/teacher_course";
import { nanoid } from "nanoid";

const courseRouter = express.Router();
type UserRole = "student" | "teacher";

function checkRole(role: string, target: UserRole) {
  return role === target;
}

courseRouter.get("/", async (req, res) => {
  const role: UserRole = "teacher";
  const userId = 1;
  const isStudent = checkRole(role, "student");
  const isTeacher = checkRole(role, "teacher");

  const courses = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      enrolled_courses: isStudent,
      created_courses: isTeacher,
    },
  });

  return res.send(courses);
});

courseRouter.post("/", async (req, res) => {
  const userId = 1;
  const role = "teacher";
  if (checkRole(role, "teacher")) {
    const data = req.body as TeacherCourseDto;

    const result = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        created_courses: {
          create: {
            code: data.course_code,
            name: data.course_name,
            join_code: nanoid(8),
          },
        },
      },
    });
    return res.send("Okay! Created course complete!");
  } else {
    const data = req.body as { join_code: string };

    const result = await prisma.course.findUnique({
      where: {
        join_code: data.join_code,
      },
    });

    if (result === null) {
      return res.send("A join code not found");
    }
    return res.send("Join course complete !");
  }
});

export default courseRouter;
