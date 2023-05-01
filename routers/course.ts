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
  const joinCode = 123;
  const role: UserRole = "teacher";
  const userId = 1;
  const isStudent = checkRole(role, "student");
  const isTeacher = checkRole(role, "teacher");

  if (isStudent) {
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
          histories: true,
        },
      },
      enrolled_users: true,
    },
  });

  return res.send(historyAttendance);
});

//List course that teacher created & student enrolled
courseRouter.get("/", async (req, res) => {
  const role: UserRole = "teacher";
  const userId = 3;
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

//Teacher create course & Student enroll course
courseRouter.post("/", async (req, res) => {
  const userId = 1;
  const role = "student";
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
  const maxStudent = 1;
  const start_date = "27/02/2023";
  const end_date = "28/02/2023";
  const userId = 3;

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
                  startAt: new Date(data.start_date),
                  endAt: new Date(data.end_date),
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
      created_rounds: true,
    },
  });

  return res.send(generateQRround);
});

// delete student of class
courseRouter.delete("/:course_id/students/:student_id", async (req, res) => {
  const courseId = +req.params.course_id;
  const studentId = +req.params.student_id;

  const deleteStudent = await prisma.course.update({
    where: {
      id: courseId,
    },
    data: {
      enrolled_users: {
        delete: {
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

  const addFeedbackStudent = await prisma.course.update({
    where: {
      id: courseId,
    },
    data: {
      enrolled_users: {
        update: [
          {
            where: {
              id: studentId,
            },
            data: {
              feedbacks: {
                create: {
                  student: {
                    connect: {
                      id: studentId,
                    },
                  },
                  //   teacher: {
                  //     connect: {
                  //       id: userId,
                  //     },
                  //   },

                  feedbackText: data.feedback_text,
                  course: {
                    connect: {
                      id: courseId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  });

  res.send("Added feedback successfully!");
});

//Student scan qrcode
courseRouter.get("/:course_id/:round_id/check", async (req, res) => {
  const userId = 1;
  const roundId = +req.params.round_id;
  const course_id = +req.params.course_id;

  const scanQrcode = await prisma.course.update({
    where: {
      id: course_id,
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
                connect: {
                  id: roundId,
                },
                create: {
                  owner: {
                    connect: {
                      id: userId,
                    },
                  },
                  feedback: "",
                  status: false,
                },
              },
            },
          },
        ],
      },
    },
  });

  return res.send("Succesfully scan QR Code");
});

export default courseRouter;
