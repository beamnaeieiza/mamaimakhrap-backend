import express from "express";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { checkRole } from "./course";
const meRouter = express.Router();

//user log-out
meRouter.delete;
