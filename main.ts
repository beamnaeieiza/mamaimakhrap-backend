import express from "express";
let app = express();
import authRouter from "./routers/auth";
import { init } from "./utils/firebase";
import { getAuth } from "firebase-admin/auth";
import { User } from "@prisma/client";
import { prisma } from "./utils/prisma";
import jwt from "jsonwebtoken";
import courseRouter from "./routers/course";
import feedbackRouter from "./routers/feedback";
import { authMiddleware } from "./middleware/auth";
import meRouter from "./routers/me";
import { auth } from "firebase-admin";
import historyRouter from "./routers/history";

const firebase = init();

app.use(express.json()); // make use of json body.

app.use("/auth", authRouter);
app.use("/history", authMiddleware, historyRouter);
app.use("/course", authMiddleware, courseRouter);
app.use("/feedbacks", authMiddleware, feedbackRouter);
app.use("/course", authMiddleware, courseRouter);
app.use("/me", authMiddleware, meRouter);

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/callback", (req, res) => {
  const idToken = req.query.idToken as string;

  getAuth()
    .verifyIdToken(idToken)
    .then(async (decodedToken) => {
      const uid = decodedToken.uid;
      const names = String(decodedToken.name).split(" ");
      const first_name = names[0];
      const last_name = names[1];

      console.log(decodedToken);

      // find user with this uid
      const foundUser = await prisma.user.findUnique({
        where: {
          uid,
        },
      });

      // found means login
      if (foundUser) {
        return res.send({
          token: jwt.sign(
            { id: foundUser.id, uid, role: foundUser.role },
            "MYSECRET!"
          ),
        });
        // otherwise means register
      } else {
        const newUser = await prisma.user.create({
          data: {
            uid,
            avatar_url: decodedToken.picture,
            firstname: first_name,
            lastname: last_name,
            email: String(decodedToken.email),
          },
        });
        return res.send({
          token: jwt.sign(
            { id: newUser.id, uid, role: newUser.role },
            "MYSECRET!"
          ),
        });
      }
    })
    .catch((error) => {
      res.status(500).send(error);
      console.log(error);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.listen(8080, () => {
  console.log("Application is running.");
});
