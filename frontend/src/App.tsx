import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherRoom } from './pages/TeacherRoom';
import { StudentRoom } from './pages/StudentRoom';

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/room/:sessionId" element={<TeacherRoom />} />
                <Route path="/student/room/:sessionId" element={<StudentRoom />} />
            </Routes>
        </div>
    );
}

export default App;
