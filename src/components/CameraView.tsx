import React, { useRef, useEffect } from 'react';
import { CameraIcon, CloseIcon, PencilAltIcon } from './icons';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  onManualEntry: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel, onManualEntry }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const videoElement = videoRef.current;

    const initCamera = async () => {
      try {
        // Try for environment camera first
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
      } catch (err) {
        console.warn('Could not start environment camera, trying default:', err);
        try {
          // Fallback to any available camera
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        } catch (finalErr) {
          console.error('Error accessing camera:', finalErr);
          alert(
            'Could not access the camera. Please ensure you have granted permission and that no other application is using it.'
          );
          onCancel();
          return;
        }
      }

      if (videoElement) {
        videoElement.srcObject = activeStream;
      }
    };

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCancel]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-30 flex flex-col items-center justify-center">
      <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover"></video>
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Card outline guide */}
      <div className="relative z-10 w-[85vw] max-w-[380px] aspect-[59/86] flex items-center justify-center">
        <div className="w-full h-full relative rounded-2xl">
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-purple-400 rounded-tl-2xl"></div>
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-purple-400 rounded-tr-2xl"></div>
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-purple-400 rounded-bl-2xl"></div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-purple-400 rounded-br-2xl"></div>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <div className="absolute bottom-0 left-0 w-full p-4 flex justify-around items-center bg-gray-900 bg-opacity-70 z-20">
        <button
          onClick={onCancel}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          aria-label="Cancel scan"
        >
          <CloseIcon className="w-8 h-8 text-white" />
        </button>
        <button
          onClick={handleCapture}
          className="p-5 rounded-full bg-purple-600 hover:bg-purple-700 transition-transform transform hover:scale-110 border-4 border-purple-300"
          aria-label="Capture card"
        >
          <CameraIcon className="w-10 h-10 text-white" />
        </button>
        <button
          onClick={onManualEntry}
          className="p-4 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
          aria-label="Enter card manually"
        >
          <PencilAltIcon className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
};

export default CameraView;