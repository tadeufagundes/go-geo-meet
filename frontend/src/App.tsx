import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then((module) => ({ default: module.TeacherDashboard })));
const TeacherRoom = lazy(() => import('./pages/TeacherRoom').then((module) => ({ default: module.TeacherRoom })));
const StudentRoom = lazy(() => import('./pages/StudentRoom').then((module) => ({ default: module.StudentRoom })));
const StudentMonitorPage = lazy(() => import('./pages/StudentMonitorPage').then((module) => ({ default: module.StudentMonitorPage })));

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense
                fallback={(
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
                        A carregar...
                    </div>
                )}
            >
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/teacher" element={<TeacherDashboard />} />
                    <Route path="/teacher/room/:sessionId" element={<TeacherRoom />} />
                    <Route path="/teacher/monitor/:sessionId" element={<StudentMonitorPage />} />
                    <Route path="/student/room/:sessionId" element={<StudentRoom />} />
                </Routes>
            </Suspense>
        </div>
    );
}

export default App;

