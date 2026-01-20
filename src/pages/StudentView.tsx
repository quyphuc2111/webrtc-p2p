import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Signal, WifiOff, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';

const StudentView: React.FC = () => {
  const navigate = useNavigate();
  const [targetId, setTargetId] = useState('');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  
  const peerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Init peer (Student needs an ID too, but we don't need to share it)
    // @ts-ignore
    const peer = new window.Peer();
    
    peer.on('open', (id: string) => {
      console.log('Student Peer ID:', id);
    });

    peer.on('error', (err: any) => {
      console.error(err);
      setStatus('disconnected');
      alert('Lỗi kết nối: ' + err.type);
    });

    peerRef.current = peer;

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const handleConnect = () => {
    if (!targetId.trim() || !peerRef.current) return;

    setStatus('connecting');

    // In PeerJS logic for this app: Student CALLS Teacher to get stream
    // NOTE: Normally screen sharing is "pushed", but PeerJS basic 'call' is bidirectional.
    // However, logic in Teacher component expects a 'call' event to answer with a stream.
    // So Student initiates the call.
    
    // We send a dummy stream or no stream, just to establish the media connection
    // Since we don't want to share student cam, we might need a workaround.
    // PeerJS call requires a stream usually. 
    
    // Workaround: Create a dummy audio track or receive-only mode if supported.
    // Or just ask user for mic permission to "ask questions" later.
    // For simplicity, let's try calling with a silent audio track created programmatically.
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const dest = ctx.createMediaStreamDestination();
    osc.connect(dest); // Silent connection?
    // Actually, PeerJS docs say you can pass null for stream if receive only, 
    // but types often complain. Let's try passing a dummy empty stream.
    
    const dummyStream = dest.stream;

    const call = peerRef.current.call(targetId.trim(), dummyStream);

    if (!call) {
      setStatus('disconnected');
      alert("Không tìm thấy lớp học với ID này.");
      return;
    }

    call.on('stream', (remoteStream: MediaStream) => {
      console.log("Received teacher stream");
      setStatus('connected');
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        // Ensure playback
        videoRef.current.play().catch(e => console.error("Auto-play blocked", e));
      }
    });

    call.on('close', () => {
      setStatus('disconnected');
      if (videoRef.current) videoRef.current.srcObject = null;
      alert("Giáo viên đã dừng chia sẻ.");
    });
    
    call.on('error', () => {
        setStatus('disconnected');
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
  };

  const toggleMute = () => {
      if(videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted;
          setIsMuted(videoRef.current.muted);
      }
  }

  return (
    <div className="h-screen flex flex-col bg-dark-950">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-dark-900 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex items-center">
            <Monitor className="w-5 h-5 text-brand-500 mr-2" />
            <span className="font-semibold text-white">Student View</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
            {status === 'disconnected' && (
                <div className="flex items-center space-x-2">
                    <input 
                        type="text" 
                        placeholder="Nhập ID Lớp học (VD: CLASS-X7Z...)" 
                        className="bg-dark-950 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-sm w-64 focus:ring-2 focus:ring-brand-500 outline-none font-mono placeholder:font-sans"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                    />
                    <Button size="sm" onClick={handleConnect} disabled={!targetId}>
                        Kết nối
                    </Button>
                </div>
            )}
            
            <StatusBadge 
                status={status} 
                label={status === 'connected' ? 'Đang học trực tuyến' : status === 'connecting' ? 'Đang kết nối...' : 'Chưa kết nối'} 
            />
        </div>
      </div>

      {/* Main Viewer Area */}
      <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden">
         {status === 'disconnected' && (
             <div className="text-center text-slate-500 max-w-md">
                 <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <WifiOff className="w-10 h-10 opacity-50" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa kết nối</h3>
                 <p>Vui lòng nhập ID lớp học do giáo viên cung cấp ở thanh menu trên để bắt đầu xem màn hình.</p>
             </div>
         )}

         {status === 'connecting' && (
             <div className="flex flex-col items-center text-brand-500">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
                 <p className="animate-pulse font-medium">Đang thiết lập kết nối an toàn...</p>
             </div>
         )}

         {/* Video Element */}
         <div 
            ref={containerRef}
            className={`relative w-full h-full flex items-center justify-center transition-opacity duration-500 ${status === 'connected' ? 'opacity-100' : 'opacity-0 hidden'}`}
         >
            <video 
                ref={videoRef}
                className="w-full h-full object-contain max-h-screen"
                autoPlay
                playsInline
            />
            
            {/* Floating Controls for Student */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-dark-900/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full flex items-center space-x-4 opacity-0 hover:opacity-100 transition-opacity">
                <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full text-white">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="h-4 w-px bg-white/20"></div>
                <div className="flex items-center text-xs text-slate-300 font-mono">
                    <Signal className="w-3 h-3 text-emerald-500 mr-2" />
                    LIVE HD
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <button onClick={toggleFullScreen} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StudentView;
