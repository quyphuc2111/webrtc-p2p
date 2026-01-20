import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { ArrowLeft, Monitor, Signal, WifiOff, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';

const DEFAULT_SERVER_URL = "http://localhost:3001";

const StudentViewSocketIO: React.FC = () => {
  const navigate = useNavigate();
  const [serverIp, setServerIp] = useState("localhost");
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Sẵn sàng kết nối...");
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      setStatusMessage(`Giáo viên đã kết nối: ${userId.substring(0, 8)}...`);
      // When teacher connects, they will initiate the call
    };

    const handleUserDisconnected = (userId: string) => {
      setStatusMessage(`Người dùng ngắt kết nối: ${userId.substring(0, 8)}...`);
      // Clean up peer connection
      const pc = peerConnections.current.get(userId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(userId);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setRemoteStream(null);
      setStatus('disconnected');
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
      setStatusMessage("Đã kết nối đến server");
      setStatus('connecting');
    });

    socket.on("user-connected", handleUserConnected);
    socket.on("user-disconnected", handleUserDisconnected);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("connect");
      socket.off("user-connected", handleUserConnected);
      socket.off("user-disconnected", handleUserDisconnected);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket]);

  const joinRoom = () => {
    if (socket && roomId) {
      socket.connect();
      socket.emit("join-room", roomId);
      setJoinedRoom(true);
      setStatus('connecting');
      setStatusMessage(`Đã tham gia phòng: ${roomId}. Chờ giáo viên chia sẻ...`);
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
      setStatusMessage(`Trạng thái kết nối: ${pc.iceConnectionState}`);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetUserId}: ${pc.connectionState}`);
    };

    pc.ontrack = (event) => {
      console.log(`Received track from ${targetUserId}:`, event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log(`Setting remote stream from ${targetUserId}`);
        const stream = event.streams[0];
        setRemoteStream(stream);
        setStatus('connected');
        setStatusMessage("Đang xem màn hình giáo viên");
        
        // Use setTimeout to ensure video element is ready
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            console.log('Attempting to play video...');
            
            // Force play the video
            videoRef.current.play().then(() => {
              console.log('✅ Video playing successfully!');
            }).catch(err => {
              console.error("❌ Error playing video:", err);
              // If autoplay is blocked, try muted
              if (videoRef.current) {
                videoRef.current.muted = true;
                setIsMuted(true);
                videoRef.current.play().then(() => {
                  console.log("✅ Video playing (muted due to autoplay policy)");
                }).catch(e => {
                  console.error("❌ Still cannot play:", e);
                });
              }
            });
          }
        }, 100);
      }
    };

    peerConnections.current.set(targetUserId, pc);
    return pc;
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

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const forcePlayVideo = () => {
    if (videoRef.current && remoteStream) {
      console.log('Force playing video...');
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().then(() => {
        console.log('✅ Video is now playing!');
      }).catch(err => {
        console.error('❌ Error playing video:', err);
        // Try muted
        videoRef.current!.muted = true;
        setIsMuted(true);
        videoRef.current!.play().then(() => {
          console.log('✅ Video playing (muted)');
        });
      });
    }
  };

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
            <span className="font-semibold text-white">Student View (Socket.IO)</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {!joinedRoom && (
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="Server IP (localhost)" 
                className="bg-dark-950 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-sm w-40 focus:ring-2 focus:ring-brand-500 outline-none"
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Nhập ID Phòng học" 
                className="bg-dark-950 border border-slate-700 text-white px-3 py-1.5 rounded-lg text-sm w-48 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <Button size="sm" onClick={joinRoom} disabled={!roomId}>
                Tham gia
              </Button>
            </div>
          )}
          
          <StatusBadge 
            status={status} 
            label={status === 'connected' ? 'Đang học trực tuyến' : status === 'connecting' ? 'Đang kết nối...' : 'Chưa kết nối'} 
          />
        </div>
      </div>

      {/* Status Bar */}
      {joinedRoom && (
        <div className="px-6 py-2 bg-dark-900 border-b border-slate-800">
          <p className="text-xs text-slate-400">{statusMessage}</p>
        </div>
      )}

      {/* Main Viewer Area */}
      <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {!joinedRoom && (
          <div className="text-center text-slate-500 max-w-md">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-10 h-10 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa kết nối</h3>
            <p>Vui lòng nhập Server IP và ID phòng học do giáo viên cung cấp ở thanh menu trên để bắt đầu xem màn hình.</p>
          </div>
        )}

        {joinedRoom && status === 'connecting' && !remoteStream && (
          <div className="flex flex-col items-center text-brand-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
            <p className="animate-pulse font-medium">Đang chờ giáo viên chia sẻ màn hình...</p>
          </div>
        )}

        {/* Video Element - Always render when connected, regardless of remoteStream state */}
        {status === 'connected' ? (
          <div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center"
          >
            <video 
              ref={videoRef}
              className="w-full h-full object-contain max-h-screen bg-black"
              autoPlay
              playsInline
              muted={isMuted}
              controls={false}
              style={{ display: 'block' }}
            />
            
            {/* Debug info */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded text-xs font-mono text-white border border-white/10 space-y-1">
              <div>Status: {status}</div>
              <div>Stream: {remoteStream ? 'Active' : 'None'}</div>
              <div>Tracks: {remoteStream?.getTracks().length || 0}</div>
              <div>Video: {remoteStream?.getVideoTracks().length || 0}</div>
              <div>Audio: {remoteStream?.getAudioTracks().length || 0}</div>
              <div>Paused: {videoRef.current?.paused ? 'Yes' : 'No'}</div>
              <div>Ready: {videoRef.current?.readyState || 0}</div>
              <div>Size: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}</div>
              <button 
                onClick={forcePlayVideo}
                className="mt-2 w-full px-2 py-1 bg-brand-600 hover:bg-brand-500 rounded text-white text-xs font-bold"
              >
                🔄 Force Play
              </button>
            </div>
            
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
        ) : null}
      </div>
    </div>
  );
};

export default StudentViewSocketIO;
