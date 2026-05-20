import { createBrowserRouter, Outlet, Navigate, useRouteError } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { LearningCatalog } from "./pages/LearningCatalog";
import { MyCourses } from "./pages/MyCourses";
import { CourseFeed } from "./pages/CourseFeed";
import { CourseForum } from "./pages/CourseForum";
import { Lessons } from "./pages/Lessons";
import { Activities } from "./pages/Activities";
import { Assessments } from "./pages/Assessments";
import { Assignments } from "./pages/Assignments";
import { Practice } from "./pages/Practice";
import { InteractiveActivities } from "./pages/InteractiveActivities";
import { Notifications } from "./pages/Notifications";
import { Chat } from "./pages/Chat";
import { LearnerProfile } from "./pages/LearnerProfile";
import Instructors from "./pages/Instructors";
import StudentSessions from "./pages/StudentSessions";
import CourseDetail from "./pages/CourseDetail";
import LearnerEngagement from "./pages/LearnerEngagement";
import AuthLayout from "./pages/auth/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

function PageWrapper() {
  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  );
}

const ErrorFallback = () => {
  const error = useRouteError() as { status?: number; statusText?: string; message?: string } | null;
  const is404 = error?.status === 404;
  return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: "#f0f5ff" }}>
      <div className="text-center px-6 max-w-md">
        <div className="text-6xl mb-4">{is404 ? "�" : "⚠️"}</div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
          {is404 ? "Page Not Found" : "Something went wrong"}
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
          {is404
            ? "The page you're looking for doesn't exist."
            : "An unexpected error occurred. Please try again."}
        </p>
        {!is404 && error?.message && (
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px", fontFamily: "monospace" }}>
            {error.message}
          </p>
        )}
        <a href="/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white" style={{ fontSize: "14px", fontWeight: 600, backgroundColor: "#2563eb" }}>
          Go to Dashboard
        </a>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login",           element: <Login />          },
      { path: "/register",        element: <Register />       },
      { path: "/forgot-password", element: <ForgotPassword /> },
    ],
  },
  { path: "/reset-password",   element: <ResetPassword />    },
  { path: "/verify-email", element: <VerifyEmail /> },
  {
    path: "/",
    element: <PageWrapper />,
    errorElement: <ErrorFallback />,
    children: [
      { index: true, Component: Dashboard },
      { path: "instructors", Component: Instructors },
      { path: "courses/:id", Component: CourseDetail },
      { path: "catalog", Component: LearningCatalog },
      { path: "my-courses", Component: MyCourses },
      { path: "course-feed", Component: CourseFeed },
      { path: "course-forum", Component: CourseForum },
      { path: "lessons", Component: Lessons },
      { path: "activities", Component: Activities },
      { path: "assessments", Component: Assessments },
      { path: "assignments", Component: Assignments },
      { path: "practice", Component: Practice },
      { path: "interactive", Component: InteractiveActivities },
      { path: "notifications", Component: Notifications },
      { path: "chat", Component: Chat },
      { path: "sessions", Component: StudentSessions },
      { path: "profile", Component: LearnerProfile },
      { path: "engagement", Component: LearnerEngagement },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
