import './App.css'
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'


import { BrowserRouter as Router, Routes, Route } from "react-router";
import UserProfilePage from './pages/UserProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import VerificationEmailPage from './pages/VerificationEmailPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './pages/ProtectedRoute';
import WorkspacePage from './pages/WorkspacePage';
import AcceptingInvitationPage from './pages/AcceptingInvitationPage';
import ProjectPage from './pages/ProjectPage';
import BoardPage from './pages/BoardPage';
import VerifyEmail from './pages/VerifyEmail';
import WorkspaceLayout from './pages/WorkspaceLayout';
import TokenChecker from './components/TokenChecker';


function App() {
  return (
    <>

      <Router>
        <TokenChecker />

        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verificationEmail" element={<VerificationEmailPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/invitations/:token" element={<AcceptingInvitationPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<UserProfilePage />} />

            <Route element={<WorkspaceLayout />}>
              <Route path="/workspaces/:slug" element={<WorkspacePage />} />
              <Route path="/workspaces/:slug/project/:projectname" element={<ProjectPage />} />
              <Route path="/workspaces/:slug/projects/:projectId/boards/:boardId/lists" element={<BoardPage />} />
            </Route>

          </Route>



          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
      {/* <KanbanBoard /> */}

    </>
  )
}

export default App
