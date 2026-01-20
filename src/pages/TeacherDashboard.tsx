import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Square, Copy, Users, Settings, 
  Mic, MicOff, MonitorUp, LayoutDashboard, 
  Info
} from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';

// Helper to copy text
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  // In a real app, toast notification here
};

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [peerId, setPeerId] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const peerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<any[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Initialize PeerJS
  useEffect(() => {
    // Generate a shorter, friendly ID for the classroom if possible, 
    // but standard PeerJS IDs are UUIDs. Let's just use random for now.
    const cleanId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // @ts-ignore - window.Peer is loaded from CDN
    const peer = new window.Peer(`CLASS-${cleanId}`);

    peer.on('open', (id: string) => {
      console.log('My peer ID is: ' + id);
      setPeerId(id);
    });

    // Handle incoming connections from students
    peer.on('connection', (conn: any) => {
      console.log('New student connected metadata channel');
      conn.on('open', () => {
         // Keep track of data connections if needed for chat
      });
    });

    // Handle incoming CALLS (Students asking for stream)
    peer.on('call', (call: any) => {
      console.log('Student requesting stream...');
      
      // If we are currently sharing, answer the call with the stream
      if (streamRef.current) {
        call.answer(streamRef.current);
        connectionsRef.current.push(call);
        setStudentCount(prev => prev + 1);

        call.on('close', () => {
          setStudentCount(prev => Math.max(0, prev - 1));
          connectionsRef.current = connectionsRef.current.filter(c => c !== call);
        });
      } else {
        // Not sharing, maybe reject or answer with nothing?
        call.close();
      }
    });

    peerRef.current = peer;

    return () => {
      stopSharing();
      if (peerRef.current) peerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSharing = async () => {
    try {
      // Get screen stream with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            // Suggest 1080p roughly
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
        },
        audio: true
      });

      streamRef.current = stream;
      setIsSharing(true);

      // Show preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      // Handle stream end (user clicked "Stop sharing" in browser UI)
      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      // Toggle audio track based on state
      stream.getAudioTracks().forEach(track => {
        track.enabled = audioEnabled;
      });

    } catch (err) {
      console.error("Error starting screen share:", err);
      alert("Không thể chia sẻ màn hình. Vui lòng cấp quyền.");
    }
  };

  const stopSharing = () => {
    setIsSharing(false);
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear preview
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }

    // Close all active calls with students
    connectionsRef.current.forEach(conn => conn.close());
    connectionsRef.current = [];
    setStudentCount(0);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
    }
  };

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Sidebar - Control Center */}
      <div className="w-80 bg-dark-900 border-r border-slate-800 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center">
              <MonitorUp className="text-white w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-white">Teacher Panel</h2>
          </div>
          <p className="text-xs text-slate-500">ClassView Pro v1.0</p>
        </div>

        {/* Session Info */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID Lớp Học</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xl font-mono text-brand-400 tracking-widest text-center">
                {peerId || 'Đang tạo...'}
              </div>
              <button 
                onClick={() => copyToClipboard(peerId)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                title="Sao chép ID"
              >
                <Copy className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            <p className="text-xs text-slate-500 flex items-center">
              <Info className="w-3 h-3 mr-1" />
              Gửi ID này cho học sinh để tham gia
            </p>
          </div>

          <div className="space-y-2">
             <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái</label>
             <div className="flex justify-between items-center bg-dark-950 p-3 rounded-lg border border-slate-800">
                <StatusBadge status={isSharing ? 'live' : 'disconnected'} label={isSharing ? 'Đang Phát' : 'Đã Dừng'} />
                <div className="flex items-center text-slate-400 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{studentCount} Học sinh</span>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
             <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Điều khiển nhanh</label>
             
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={toggleAudio}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${audioEnabled ? 'bg-slate-800 border-slate-700 text-white' : 'bg-red-900/20 border-red-900/50 text-red-400'}`}
                >
                  {audioEnabled ? <Mic className="w-5 h-5 mb-1" /> : <MicOff className="w-5 h-5 mb-1" />}
                  <span className="text-xs">{audioEnabled ? 'Đã bật Mic' : 'Đã tắt Mic'}</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                  <Settings className="w-5 h-5 mb-1" />
                  <span className="text-xs">Cấu hình</span>
                </button>
             </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-slate-800 bg-dark-900">
          {!isSharing ? (
            <Button 
              className="w-full py-4 text-lg shadow-brand-500/20 shadow-xl" 
              onClick={startSharing}
              disabled={!peerId}
              icon={<Play className="w-5 h-5 fill-current" />}
            >
              Bắt đầu giảng bài
            </Button>
          ) : (
             <div className="text-center">
               <p className="text-xs text-emerald-400 mb-2 animate-pulse">Hệ thống đang phát sóng</p>
               <Button 
                className="w-full py-3" 
                variant="danger"
                onClick={stopSharing}
                icon={<Square className="w-5 h-5 fill-current" />}
              >
                Dừng chia sẻ
              </Button>
             </div>
          )}
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full mt-4 text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>

      {/* Main Content - Preview Area */}
      <div className="flex-1 flex flex-col bg-dark-950 relative overflow-hidden">
        {/* Top Header for Preview */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-dark-950">
          <div className="flex items-center text-slate-300">
             <LayoutDashboard className="w-5 h-5 mr-2" />
             <span className="font-medium">Màn hình xem trước</span>
          </div>
          {isSharing && (
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-500 font-mono text-sm font-bold">LIVE 00:00:00</span>
            </div>
          )}
        </div>

        {/* Video Container */}
        <div className="flex-1 p-8 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
           <div className={`relative w-full max-w-5xl aspect-video bg-black rounded-xl border-2 overflow-hidden shadow-2xl transition-all duration-500 ${isSharing ? 'border-brand-500/50 shadow-brand-500/10' : 'border-slate-800'}`}>
              
              {!isSharing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                  <MonitorUp className="w-24 h-24 mb-4 opacity-20" />
                  <p className="text-lg">Chưa có tín hiệu chia sẻ</p>
                  <p className="text-sm opacity-60">Nhấn "Bắt đầu giảng bài" để phát màn hình</p>
                </div>
              )}

              <video 
                ref={videoPreviewRef} 
                className="w-full h-full object-contain bg-black"
                autoPlay 
                muted // Mute locally to prevent feedback loop
                playsInline
              />

              {/* Overlay Label */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs font-mono text-white border border-white/10">
                TEACHER VIEW (PREVIEW)
              </div>
           </div>
        </div>
      </div>

      {/* Floating Control Bar (The "UltraViewer" broadcast strip) 
          Only visible when sharing and conceptually "on top" of everything else 
          simulating a system overlay */}
      {isSharing && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-dark-800/90 backdrop-blur-md border border-slate-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-6 animate-fade-in-down">
           <div className="flex items-center space-x-3 border-r border-slate-600 pr-6">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="font-bold text-sm">Đang chia sẻ màn hình</span>
           </div>
           
           <div className="flex items-center space-x-4">
              <button onClick={toggleAudio} className={`p-2 rounded-full hover:bg-slate-700 transition ${!audioEnabled && 'text-red-400 bg-red-900/20'}`}>
                 {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              
              <button className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded shadow-lg transition-colors flex items-center" onClick={stopSharing}>
                <Square size={12} className="mr-2 fill-current" />
                Dừng
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
