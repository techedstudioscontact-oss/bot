import { useState, useRef, useEffect, useCallback } from 'react';

export const useVideo = () => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      setIsVideoEnabled(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsVideoEnabled(false);
    }
  }, []);

  const stopVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoEnabled(false);
  }, []);

  const toggleVideo = useCallback(() => {
    if (isVideoEnabled) {
      stopVideo();
    } else {
      startVideo();
    }
  }, [isVideoEnabled, startVideo, stopVideo]);

  const captureFrame = useCallback((): string | undefined => {
    if (!videoRef.current || !isVideoEnabled) return undefined;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return undefined;
    
    ctx.drawImage(videoRef.current, 0, 0);
    // Return base64 string without the prefix for the API usually, 
    // but the inlineData expectation usually wants just the base64 data.
    // canvas.toDataURL() returns "data:image/png;base64,..."
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl.split(',')[1]; 
  }, [isVideoEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo();
    };
  }, [stopVideo]);

  return {
    videoRef,
    isVideoEnabled,
    toggleVideo,
    captureFrame
  };
};