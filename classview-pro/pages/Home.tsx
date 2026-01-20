import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Users, ScreenShare, GraduationCap } from 'lucide-react';
import { Button } from '../components/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-dark-950 via-dark-900 to-slate-900">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-4">
            <ScreenShare className="w-12 h-12 text-brand-500" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            ClassView <span className="text-brand-500">Pro</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Nền tảng chia sẻ màn hình chất lượng cao cho lớp học. Kết nối giáo viên và học sinh trong thời gian thực với độ trễ thấp.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Teacher Card */}
          <div className="group relative bg-dark-800/50 hover:bg-dark-800 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-8 transition-all duration-300 cursor-pointer text-left"
               onClick={() => navigate('/teacher')}>
            <div className="absolute inset-0 bg-brand-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Giáo Viên</h3>
              <p className="text-slate-400 mb-6">
                Tạo phòng học, phát trực tiếp màn hình giảng bài và quản lý lớp học.
              </p>
              <Button className="w-full justify-between group-hover:bg-brand-600">
                Bắt đầu giảng dạy
                <span className="text-lg">→</span>
              </Button>
            </div>
          </div>

          {/* Student Card */}
          <div className="group relative bg-dark-800/50 hover:bg-dark-800 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 transition-all duration-300 cursor-pointer text-left"
               onClick={() => navigate('/student')}>
            <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Học Sinh</h3>
              <p className="text-slate-400 mb-6">
                Tham gia lớp học bằng ID, xem màn hình giáo viên sắc nét.
              </p>
              <Button variant="secondary" className="w-full justify-between hover:bg-emerald-600 hover:text-white hover:border-emerald-500">
                Tham gia lớp học
                <span className="text-lg">→</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 text-slate-500 text-sm">
        © 2024 ClassView Pro. Powered by WebRTC.
      </footer>
    </div>
  );
};

export default Home;