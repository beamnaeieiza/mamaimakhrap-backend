import express from "express";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { checkRole } from "./course";
const meRouter = express.Router();

//choose role
meRouter.post("/me/role", async (req, res) => {
  const choosingRole = req.body.role;
  const userId = 3;
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (user?.role !== null) {
    return res.send("You can not set role.");
  }
  const role = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: choosingRole,
    },
  });
  return res.send(role);
});

//get student/teacher's profile
meRouter.get("/me", async (req, res) =>{
    const userId = 1;
    try {
       const userProfile = await prisma.user.findUnique({
           where: {
               id: userId,
           },
        
        });
        return res.send(userProfile);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
      }
});

export default meRouter;
