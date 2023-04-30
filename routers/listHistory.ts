import express from "express";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { StudentDetailDto } from "../types/student_course_detail";

const listHistoryRouter = express.Router();
type UserRole = "student" | "teacher";

function checkRole(role: string, target: UserRole) {
  return role === target;
}

listHistoryRouter.get("/", async (req, res) => {
  const role: UserRole = "teacher";
  const userId = 1;
  const isStudent = checkRole(role, "student");
  const isTeacher = checkRole(role, "teacher");

  if (isStudent) {
    const history = await prisma.user.findMany({
      where: {
        id: userId,
      },
      select: {
        histories: true,
      },
    });

    return res.send(history);
  } else {
    const rounds = await prisma.user.findMany({
      where: {
        id: userId,
      },
      select: {
        created_rounds: true,
      },
    });

    return res.send(rounds);
  }
});

export default listHistoryRouter;
