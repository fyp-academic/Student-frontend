import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { LearningCatalog } from "./pages/LearningCatalog";
import { MyCourses } from "./pages/MyCourses";
import { CourseFeed } from "./pages/CourseFeed";
import { CourseForum } from "./pages/CourseForum";
import { CourseProgress } from "./pages/CourseProgress";
import { Lessons } from "./pages/Lessons";
import { Activities } from "./pages/Activities";
import { Assessments } from "./pages/Assessments";
import { Assignments } from "./pages/Assignments";
import { Quizzes } from "./pages/Quizzes";
import { Practice } from "./pages/Practice";
import { InteractiveActivities } from "./pages/InteractiveActivities";
import { Notifications } from "./pages/Notifications";
import { Chat } from "./pages/Chat";
import { LearnerProfile } from "./pages/LearnerProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "catalog", Component: LearningCatalog },
      { path: "my-courses", Component: MyCourses },
      { path: "course-feed", Component: CourseFeed },
      { path: "course-forum", Component: CourseForum },
      { path: "course-progress", Component: CourseProgress },
      { path: "lessons", Component: Lessons },
      { path: "activities", Component: Activities },
      { path: "assessments", Component: Assessments },
      { path: "assignments", Component: Assignments },
      { path: "quizzes", Component: Quizzes },
      { path: "practice", Component: Practice },
      { path: "interactive", Component: InteractiveActivities },
      { path: "notifications", Component: Notifications },
      { path: "chat", Component: Chat },
      { path: "profile", Component: LearnerProfile },
    ],
  },
]);
