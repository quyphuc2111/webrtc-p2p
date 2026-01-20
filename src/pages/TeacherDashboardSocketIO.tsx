import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { 
  Play, Square, Copy, Users, Settings, 
  Mic, MicOff, MonitorUp, LayoutDashboard, 
  Info
} from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';

const DEFAULT_SERVER_URL = "http://localhost:3001";

// Helper to copy text
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const TeacherDashboardSocketIO: React.FC = () => {
  const navigate = useNavigate();
  const [serverIp, setServerIp] = useState("localhost");
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [status, setStatus] = useState("Sẵn sàng kết nối...");
  const [connectedUsers, setConnectedUsers] = useState<{id: string, ip: string}[]>([]);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStream = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const isSharingRef = useRef(false);
  const peersRef = useRef<string[]>([]);

  // Initialize socket when serverIp changes
  useEffect(() => {
    if (socket) {
      socket.disconnect();
    }
    
    const targetUrl = serverIp ? `http://${serverIp}:3001` : DEFAULT_SERVER_URL;
    const newSocket = io(targetUrl, {
      autoConnect: false,
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [serverIp]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleUserConnected = (userId: string) => {
      setStatus(`Học sinh kết nối: ${userId.substring(0, 8)}...`);
      if (!peersRef.current.includes(userId)) {
        peersRef.current.push(userId);
      }
      if (isSharingRef.current) {
        startCall(userId);
      }
    };

    const handleUserDisconnected = (userId: string) => {
      setStatus(`Học sinh ngắt kết nối: ${userId.substring(0, 8)}...`);
      peersRef.current = peersRef.current.filter(id => id !== userId);
    };

    const handleAllUsers = (users: string[]) => {
      peersRef.current = users;
      console.log("Existing users:", users);
    };

    const handleUpdateUserList = (users: {id: string, ip: string}[]) => {
      setConnectedUsers(users);
      if (socket) {
        const otherUserIds = users
          .filter(u => u.id !== socket.id)
          .map(u => u.id);
        peersRef.current = otherUserIds;
      }
    };

    const handleOffer = async (payload: any) => {
      await handleReceiveOffer(payload);
    };

    const handleAnswer = async (payload: any) => {
      await handleReceiveAnswer(payload);
    };

    const handleIceCandidate = async (payload: any) => {
      await handleNewICECandidateMsg(payload);
    };

    socket.on("connect", () => {
      setStatus("Đã kết nối đến server");
    });

    socket.on("user-connected", handleUserConnected);
    socket.on("user-disconnected", handleUserDisconnected);
    socket.on("all-users", handleAllUsers);
    socket.on("update-user-list", handleUpdateUserList);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("connect");
      socket.off("user-connected", handleUserConnected);
      socket.off("user-disconnected", handleUserDisconnected);
      socket.off("all-users", handleAllUsers);
      socket.off("update-user-list", handleUpdateUserList);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket]);

  const joinRoom = async () => {
    if (socket && roomId) {
      socket.connect();
      socket.emit("join-room", roomId);
      setJoinedRoom(true);
      setStatus(`Đã tham gia phòng: ${roomId}`);
    }
  };

  const createPeerConnection = (targetUserId: string) => {
    const existingPc = peerConnections.current.get(targetUserId);
    if (existingPc) {
      console.log(`Reusing existing peer connection for ${targetUserId}`);
      return existingPc;
    }

    console.log(`Creating new peer connection for ${targetUserId}`);
    const pc = new RTCPeerConnection({
      iceServers: [],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log(`Sending ICE candidate to ${targetUserId}`);
        socket.emit("ice-candidate", {
          target: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${targetUserId}: ${pc.iceConnectionState}`);
      setStatus(`ICE: ${pc.iceConnectionState}`);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetUserId}: ${pc.connectionState}`);
    };

    peerConnections.current.set(targetUserId, pc);
    return pc;
  };

  const startScreenShare = async () => {
    try {
      if (isSharingRef.current) return;

      console.log("Requesting display media...");
      setStatus("Đang yêu cầu quyền chia sẻ màn hình...");
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true,
      });
      console.log("Display media acquired:", stream.id);
      
      localStream.current = stream;
      isSharingRef.current = true;
      setIsSharing(true);

      // Show preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      // Toggle audio track based on state
      stream.getAudioTracks().forEach(track => {
        track.enabled = audioEnabled;
      });
      
      const peersToCall = peersRef.current;
      setStatus(peersToCall.length > 0 
        ? `Đang chia sẻ cho ${peersToCall.length} học sinh...` 
        : `Đang chia sẻ màn hình. Chờ học sinh tham gia...`);
      
      // Initiate calls to all existing peers
      peersToCall.forEach(userId => {
        startCall(userId);
      });
      
    } catch (err: any) {
      console.error("Error starting screen share:", err);
      setStatus(`Lỗi chia sẻ màn hình: ${err.name} - ${err.message}`);
      alert(`Không thể chia sẻ màn hình: ${err.name} - ${err.message}`);
    }
  };

  const startCall = async (targetUserId: string) => {
    if (!localStream.current) {
      console.log("No local stream to share");
      return;
    }

    console.log(`Starting call to ${targetUserId}`);
    const pc = createPeerConnection(targetUserId);

    // Add tracks to connection
    localStream.current.getTracks().forEach((track) => {
      console.log(`Adding track ${track.kind} to peer connection`);
      pc.addTrack(track, localStream.current!);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log(`Sending offer to ${targetUserId}`);

    socket?.emit("offer", {
      target: targetUserId,
      callerId: socket.id,
      sdp: pc.localDescription,
    });
  };

  const handleReceiveOffer = async (payload: any) => {
    console.log(`Received offer from ${payload.callerId}`);
    const pc = createPeerConnection(payload.callerId);
    
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    console.log(`Set remote description from ${payload.callerId}`);
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log(`Sending answer to ${payload.callerId}`);

    socket?.emit("answer", {
      target: payload.callerId, 
      sdp: pc.localDescription,
    });
  };

  const handleReceiveAnswer = async (payload: any) => {
    console.log(`Received answer from ${payload.callerId || 'unknown'}`);
    const pc = peerConnections.current.get(payload.callerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      console.log(`Set remote description for answer`);
    }
  };

  const handleNewICECandidateMsg = async (payload: any) => {
    console.log(`Received ICE candidate from ${payload.callerId || 'unknown'}`);
    const pc = peerConnections.current.get(payload.callerId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        console.error("Error adding ICE candidate:", e);
      }
    }
  };

  const stopSharing = () => {
    setIsSharing(false);
    isSharingRef.current = false;
    
    // Stop all tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    // Clear preview
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }

    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    setStatus("Đã dừng chia sẻ");
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
    }
  };

  const studentCount = connectedUsers.filter(u => u.id !== socket?.id).length;

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
          <p className="text-xs text-slate-500">ClassView Pro v1.0 (Socket.IO)</p>
        </div>

        {/* Session Info */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {!joinedRoom ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Server IP</label>
                <input 
                  type="text"
                  value={serverIp} 
                  onChange={(e) => setServerIp(e.target.value)} 
                  placeholder="localhost hoặc 192.168.x.x" 
                  className="w-full bg-dark-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID Phòng Học</label>
                <input 
                  type="text"
                  value={roomId} 
                  onChange={(e) => setRoomId(e.target.value)} 
                  placeholder="Nhập ID phòng (VD: room-123)" 
                  className="w-full bg-dark-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                />
              </div>

              <Button 
                onClick={joinRoom} 
                disabled={!roomId}
                className="w-full"
              >
                Tạo Phòng Học
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ID Lớp Học</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xl font-mono text-brand-400 tracking-widest text-center">
                    {roomId}
                  </div>
                  <button 
                    onClick={() => copyToClipboard(roomId)}
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

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Học sinh đã kết nối</label>
                <div className="bg-dark-950 border border-slate-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {connectedUsers.filter(u => u.id !== socket?.id).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">Chưa có học sinh nào</p>
                  ) : (
                    <ul className="space-y-2">
                      {connectedUsers.filter(u => u.id !== socket?.id).map((user) => (
                        <li key={user.id} className="text-xs text-slate-300 flex items-center justify-between">
                          <span className="font-mono">{user.id.substring(0, 8)}...</span>
                          <span className="text-slate-500">{user.ip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
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
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-slate-800 bg-dark-900">
          {joinedRoom && (
            <>
              {!isSharing ? (
                <Button 
                  className="w-full py-4 text-lg shadow-brand-500/20 shadow-xl" 
                  onClick={startScreenShare}
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
            </>
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
              <span className="text-red-500 font-mono text-sm font-bold">LIVE</span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="px-6 py-2 bg-dark-900 border-b border-slate-800">
          <p className="text-xs text-slate-400">{status}</p>
        </div>

        {/* Video Container */}
        <div className="flex-1 p-8 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          <div className={`relative w-full max-w-5xl aspect-video bg-black rounded-xl border-2 overflow-hidden shadow-2xl transition-all duration-500 ${isSharing ? 'border-brand-500/50 shadow-brand-500/10' : 'border-slate-800'}`}>
            
            {!isSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                <MonitorUp className="w-24 h-24 mb-4 opacity-20" />
                <p className="text-lg">Chưa có tín hiệu chia sẻ</p>
                <p className="text-sm opacity-60">
                  {joinedRoom ? 'Nhấn "Bắt đầu giảng bài" để phát màn hình' : 'Tạo phòng học để bắt đầu'}
                </p>
              </div>
            )}

            <video 
              ref={videoPreviewRef} 
              className="w-full h-full object-contain bg-black"
              autoPlay 
              muted
              playsInline
            />

            {/* Overlay Label */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs font-mono text-white border border-white/10">
              TEACHER VIEW (PREVIEW)
            </div>
          </div>
        </div>
      </div>

      {/* Floating Control Bar */}
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

export default TeacherDashboardSocketIO;
