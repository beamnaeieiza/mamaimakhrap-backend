import express from "express";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { checkRole } from "./course";
const feedbackRouter = express.Router();

feedbackRouter.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  const feedbacks = await prisma.feedback.findMany({
    where: {
      student_id: userId,
    },
    include: {
      course: true,
      teacher: true,
      student: true,
    },
  });
  return res.json(feedbacks);
});

feedbackRouter.get("/:id", async (req, res) => {
  const userId = (req as any).user.id;
  const feedbackId = +req.params.id;
  const feedback = await prisma.feedback.findFirst({
    where: {
      id: feedbackId,
      student_id: userId,
    },
    include: {
      course: true,
      teacher: true,
    },
  });
  return res.json(feedback);
});

export default feedbackRouter;
