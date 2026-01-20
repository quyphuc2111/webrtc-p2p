import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentView from './pages/StudentView';
import { UserRole } from './types';
import { Layout } from 'lucide-react';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen w-full bg-dark-950 text-slate-100 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/student" element={<StudentView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;