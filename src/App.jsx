import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import AppLayout from '@/components/layout/AppLayout';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';

// Admin pages
import AdminDashboard from '@/pages/AdminDashboard';
import TopicManagement from '@/pages/admin/TopicManagement';
import QuestionManagement from '@/pages/admin/QuestionManagement';
import ImportExportPage from '@/pages/admin/ImportExportPage';
import TestCasesDoc from '@/pages/TestCasesDoc';
import PageVisibilityManager from '@/pages/admin/PageVisibilityManager';
import RoadmapManager from '@/pages/admin/RoadmapManager';

// Viewer pages
import ViewerDashboard from '@/pages/ViewerDashboard';
import ExplorePage from '@/pages/viewer/ExplorePage';
import StudyPage from '@/pages/viewer/StudyPage';
import AllQuestionsPage from '@/pages/viewer/AllQuestionsPage';
import QuestionDetailPage from '@/pages/viewer/QuestionDetailPage';
import QuizPage from '@/pages/viewer/QuizPage';
import BookmarksPage from '@/pages/viewer/BookmarksPage';
import RevisionPage from '@/pages/viewer/RevisionPage';
import QuizHistoryPage from '@/pages/viewer/QuizHistoryPage';
import AchievementsPage from '@/pages/viewer/AchievementsPage';
import ProfilePage from '@/pages/viewer/ProfilePage';
import AnalyticsPage from '@/pages/viewer/AnalyticsPage';
import MockInterviewPage from '@/pages/viewer/MockInterviewPage';
import CodeEditorPage from '@/pages/CodeEditorPage';
import RoadmapPage from '@/pages/viewer/RoadmapPage';
import ResumeAnalyzerPage from '@/pages/viewer/ResumeAnalyzerPage';

// ✅ RoleRouter now uses profile from AuthContext instead of base44.auth.me()
function RoleRouter() {
  const { profile, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  if (isAdmin) {
    return (
      <Routes>
        <Route element={<AppLayout user={profile} />}>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/topics" element={<TopicManagement />} />
          <Route path="/questions" element={<QuestionManagement />} />
          <Route path="/import-export" element={<ImportExportPage />} />
          <Route path="/page-visibility" element={<PageVisibilityManager />} />
          <Route path="/roadmap-manager" element={<RoadmapManager />} />
          <Route path="/test-cases" element={<TestCasesDoc />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout user={profile} />}>
        <Route path="/" element={<ViewerDashboard />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/study/:topicId" element={<StudyPage />} />
        <Route path="/all-questions" element={<AllQuestionsPage />} />
        <Route path="/question/:questionId" element={<QuestionDetailPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/revision" element={<RevisionPage />} />
        <Route path="/quiz-history" element={<QuizHistoryPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/mock-interview" element={<MockInterviewPage />} />
        <Route path="/code-editor" element={<CodeEditorPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
        <Route path="/test-cases" element={<TestCasesDoc />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/*" element={<RoleRouter />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;