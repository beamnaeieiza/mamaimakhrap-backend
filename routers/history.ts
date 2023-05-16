import express from "express";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { checkRole } from "./course";
const historyRouter = express.Router();
type UserRole = "student" | "teacher";

historyRouter.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  const role: UserRole = (req as any).user.role;
  const isTeacher = checkRole(role, "teacher");

  if (isTeacher) {
    const historyTeacher = await prisma.round.findMany({
      where: {
        user_id: userId,
      },
      include: {
        course: true,
      },
    });

    return res.json(historyTeacher);
  }

  const history = await prisma.history.findMany({
    where: {
      user_id: userId,
    },
    include: {
      round: {
        include: {
          course: true,
        },
      },
    },
  });
  return res.json(history);
});

historyRouter.get("/:id", async (req, res) => {
  const userId = (req as any).user.id;
  const feedbackId = +req.params.id;
  const feedback = await prisma.round.findFirst({
    where: {
      id: feedbackId,
      user_id: userId,
    },
    include: {
      course: true,
      histories: {
        include: {
          owner: true,
        },
      },
    },
  });
  return res.json(feedback);
});

export default historyRouter;
