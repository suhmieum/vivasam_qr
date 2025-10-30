import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './lib/store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import NewQuestionPage from './pages/NewQuestionPage';
import StudentResponsePage from './pages/StudentResponsePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const teacher = useAppStore((state) => state.teacher);

  if (!teacher) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/student/q/:id" element={<StudentResponsePage />} />

        <Route path="/teacher/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/teacher/question/new" element={
          <ProtectedRoute>
            <NewQuestionPage />
          </ProtectedRoute>
        } />

        <Route path="/teacher/question/:id" element={
          <ProtectedRoute>
            <QuestionDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
