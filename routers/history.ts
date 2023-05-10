import express from "express";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { checkRole } from "./course";
const historyRouter = express.Router();

historyRouter.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  const history = await prisma.history.findMany({
    where: {
      user_id: userId,
    },
    include: {
      round: true,
    },
  });
  return res.json(history);
});

historyRouter.get("/:id", async (req, res) => {
  const userId = (req as any).user.id;
  const feedbackId = +req.params.id;
  const feedback = await prisma.feedback.findFirst({
    where: {
      id: feedbackId,
      student_id: userId,
    },
  });
  return res.json(feedback);
});

export default historyRouter;
