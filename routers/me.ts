import express from "express";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { checkRole } from "./course";
import jwt from "jsonwebtoken";
const meRouter = express.Router();

//choose role
meRouter.post("/role", async (req, res) => {
  const choosingRole = req.body.role;
  const userId = (req as any).user.id;
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (user?.role != "unset") {
    return res.send("You can not set role.");
  }
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: choosingRole,
    },
  });
  return res.send(
    jwt.sign(
      { id: updatedUser.id, uid: updatedUser.uid, role: updatedUser.role },
      "MYSECRET!"
    )
  );
});

//get student/teacher's profile
meRouter.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const userProfile = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    return res.send({
      id: userProfile!.id,
      uid: userProfile!.uid,
      firstname: userProfile!.firstname,
      lastname: userProfile!.lastname,
      email: userProfile!.email,
      faculty: userProfile!.faculty,
      department: userProfile!.department,
      role: userProfile!.role,
      avatar_url: userProfile!.avatar_url,
      createdAt: new Date(userProfile!.createdAt).toISOString(),
      updatedAt: new Date(userProfile!.updatedAt).toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default meRouter;
