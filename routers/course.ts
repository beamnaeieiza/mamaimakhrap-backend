import express from "express";
import { PrismaClient, User } from "@prisma/client";
import { CourseDto } from "../types/course";
import { init } from "../utils/firebase";
import { prisma } from "../utils/prisma";
import { TeacherCourseDto } from "../types/teacher_course";
import { nanoid } from "nanoid";
import { QRCodeDetailDto } from "../types/qr_code_detail";
import { TeacherFeedbackDto } from "../types/teacher_feedback";

const courseRouter = express.Router();
type UserRole = "student" | "teacher";

export function checkRole(role: string, target: UserRole) {
  return role === target;
}

//Teacher list student that attendanced that (each) course - not sure
//Student list course that scan attendance in that (each) course
courseRouter.get("/:course_id", async (req, res) => {
  const courseId = +req.params.course_id;
  const userId = (req as any).user.id;
  const joinCode = 123;
  const role: UserRole = (req as any).user.role;
  //   const userId = 1;
  const isStudent = checkRole(role, "student");
  const isTeacher = checkRole(role, "teacher");

  if (isTeacher) {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
      },
      include: {
        enrolled_users: true,
      },
    });
    return res.send(course);
  }

  const historyAttendance = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      course_rounds: {
        include: {
          histories: {
            where: {
              user_id: userId,
            },
          },
        },
        where: {
          histories: {
            some: {
              user_id: userId,
            },
          },
        },
      },
      //   enrolled_users: true,
    },
  });

  return res.send(historyAttendance);
});

//List course that teacher created & student enrolled
courseRouter.get("/", async (req, res) => {
  const role: UserRole = (req as any).user.role;
  const userId = (req as any).user.id;
  const isStudent = checkRole(role, "student");
  const isTeacher = checkRole(role, "teacher");

  if (isStudent) {
    const courses = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        enrolled_courses: true,
        //   created_courses: isTeacher,
      },
    });

    return res.send(courses);
  }

  if (isTeacher) {
    const courses = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        //   enrolled_courses: isStudent,
        created_courses: true,
      },
    });

    return res.send(courses);
  }
});

//Teacher create course & Student enroll course
courseRouter.post("/", async (req, res) => {
  const userId = (req as any).user.id;
  const role = (req as any).user.role;
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
    return res.send("Created course complete!");
  } else {
    const data = req.body as { join_code: string };

    const result = await prisma.course.findFirst({
      where: {
        join_code: data.join_code,
      },
    });

    if (result === null) {
      return res.send("A join code not found");
    }

    const joinResult = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        enrolled_courses: {
          connect: {
            id: result.id,
          },
        },
      },
    });
    return res.send("Join course complete !");
  }
});

//post - generate QR code
courseRouter.post("/:course_id/generate_qrcode", async (req, res) => {
  const courseId = +req.params.course_id;
  const userId = (req as any).user.id;

  const data = req.body as QRCodeDetailDto;

  //   const user = await prisma.user.findUnique({
  //     where: {
  //       id: userId,
  //     },
  //     include: {
  //       created_courses: true,
  //     },
  //   });

  //   return res.json(user?.created_courses);

  const generateQRround = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      created_courses: {
        update: [
          {
            where: {
              id: courseId,
            },
            data: {
              course_rounds: {
                create: {
                  date: new Date(),
                  startAt: new Date(),
                  endAt: new Date(data.endAt),
                  maxStudent: +data.maxStudent,
                  user: {
                    connect: {
                      id: userId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
    select: {
      created_rounds: {
        where: {
          endAt: new Date(data.endAt),
        },
        orderBy: {
          id: "desc",
        },
        take: 1,
      },
    },
  });

  console.log(generateQRround);

  return res.send(generateQRround);
});

// delete student of class
courseRouter.delete("/:course_id/students/:student_id", async (req, res) => {
  const courseId = +req.params.course_id;
  const studentId = +req.params.student_id;
  const userId = req.body.uid;

  const deleteStudent = await prisma.course.update({
    where: {
      id: courseId,
    },
    data: {
      enrolled_users: {
        disconnect: {
          // uid: userId,
          // uid: userId,
          id: studentId,
        },
      },
    },
    select: {
      enrolled_users: true,
    },
  });

  return res.send(deleteStudent);
});

courseRouter.get("/:course_id/students/:student_id", async (req, res) => {
  const userId = (req as any).user.id;
  const courseId = +req.params.course_id;
  const studentId = +req.params.student_id;

  const user = await prisma.course.findFirst({
    where: {
      id: courseId,
    },
    include: {
      enrolled_users: {
        where: {
          id: studentId,
        },
      },
    },
  });

  return res.send(user);
});

//add feedback to student fix teacher ID
courseRouter.post("/:course_id/students/:student_id", async (req, res) => {
  const userId = (req as any).user.id;
  const courseId = +req.params.course_id;
  const studentId = +req.params.student_id;
  const data = req.body as TeacherFeedbackDto;

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (user?.role != "teacher") {
    return res.json("You don't have permission.");
  }

  const checkCourse = await prisma.course.findFirst({
    where: {
      id: courseId,
    },
  });

  if (checkCourse?.userId != userId) {
    return res.json("You didn't create this course.");
  }
  const createdFeedback = await prisma.feedback.create({
    data: {
      teacher: {
        connect: {
          id: userId,
        },
      },
      student: {
        connect: {
          id: studentId,
        },
      },

      feedbackText: data.feedback_text,
      course: {
        connect: {
          id: courseId,
        },
      },
    },
  });

  //   res.send("Added feedback successfully!");
  res.send(createdFeedback);
});

//Student scan qrcode FIX
courseRouter.post("/check", async (req, res) => {
  const userId = (req as any).user.id;
  const roundId = +req.body.round_id;

  const countRound = await prisma.round.findMany({
    where: {
      id: roundId,
    },
    select: {
      _count: {
        select: {
          histories: true,
        },
      },
    },
  });

  console.log(countRound);

  // Fetch round and course info
  const round = await prisma.round.findFirst({
    where: {
      id: roundId,
    },
    include: {
      course: true,
    },
  });
  console.log(round);
  console.log(round?.course.id);

  // Check if user is enrolled in the course
  if (countRound[0]._count.histories <= round!.maxStudent) {
    console.log("Lower");
    const scanQrcode = await prisma.course.update({
      where: {
        id: round?.course.id,
      },
      data: {
        course_rounds: {
          update: [
            {
              where: {
                id: roundId,
              },
              data: {
                histories: {
                  // connect: {
                  //   id: roundId,
                  // },
                  create: {
                    owner: {
                      connect: {
                        id: userId,
                      },
                    },
                    feedback: "",
                    status: true,
                  },
                },
              },
            },
          ],
        },
      },
    });

    return res.send("Succesfully scan QR Code");
  } else {
    return res.send("The amount of student exceeded");
  }
});

//get round of each course
courseRouter.get("/:course_id/rounds", async (req, res) => {
  const courseId = +req.params.course_id;
  try {
    const attendanceRecords = await prisma.round.findMany({
      where: {
        course_id: courseId,
      },
    });
    return res.send(attendanceRecords);
  } catch (error) {
    console.error(error);
    return [];
  }
});

//get round and course info and list USER attend
courseRouter.get("/:course_id/rounds/:rounds_id", async (req, res) => {
  const roundId = +req.params.rounds_id;
  const courseId = +req.params.course_id;

  try {
    const roundedCourse = await prisma.round.findMany({
      where: {
        id: roundId,
        course_id: courseId,
      },
      include: {
        course: true,
        histories: {
          select: {
            owner: true,
          },
        },
      },
    });
    return res.send(roundedCourse);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default courseRouter;
