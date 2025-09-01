import { useEffect, useRef } from 'react';

interface PhotoFrameProps {
  imageUrl: string;
  frameType: string;
  className?: string;
  onImageLoad?: (canvas: HTMLCanvasElement) => void;
}

const frames = {
  none: { border: 0, shadow: 'none', borderRadius: 0, borderColor: '#ffffff' },
  classic: { border: 20, shadow: '0 8px 32px rgba(0,0,0,0.3)', borderRadius: 8, borderColor: '#8B4513' },
  modern: { border: 15, shadow: '0 4px 20px rgba(0,0,0,0.2)', borderRadius: 12, borderColor: '#2C2C2C' },
  vintage: { border: 25, shadow: '0 10px 40px rgba(139,69,19,0.4)', borderRadius: 4, borderColor: '#D2691E' },
  elegant: { border: 18, shadow: '0 6px 24px rgba(0,0,0,0.25)', borderRadius: 16, borderColor: '#C0C0C0' },
  gold: { border: 22, shadow: '0 12px 36px rgba(255,215,0,0.3)', borderRadius: 6, borderColor: '#FFD700' },
};

export const PhotoFrame = ({ imageUrl, frameType, className = '', onImageLoad }: PhotoFrameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImage = () => {
      const frame = frames[frameType as keyof typeof frames] || frames.none;
      
      // Set canvas size based on image + frame
      const frameWidth = frame.border * 2;
      canvas.width = image.naturalWidth + frameWidth;
      canvas.height = image.naturalHeight + frameWidth;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (frameType !== 'none') {
        // Draw frame background
        ctx.fillStyle = frame.borderColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw inner shadow for depth
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
        gradient.addColorStop(0.1, 'rgba(0,0,0,0.1)');
        gradient.addColorStop(0.9, 'rgba(0,0,0,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw image centered in frame
      ctx.drawImage(
        image,
        frame.border,
        frame.border,
        image.naturalWidth,
        image.naturalHeight
      );

      if (onImageLoad) {
        onImageLoad(canvas);
      }
    };

    if (image.complete) {
      loadImage();
    } else {
      image.onload = loadImage;
    }
  }, [imageUrl, frameType, onImageLoad]);

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt=""
        className="hidden"
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
        style={{
          filter: frames[frameType as keyof typeof frames]?.shadow ? `drop-shadow(${frames[frameType as keyof typeof frames].shadow})` : 'none'
        }}
      />
    </div>
  );
};

export const frameOptions = [
  { id: 'none', name: 'No Frame', preview: 'border-0' },
  { id: 'classic', name: 'Classic Wood', preview: 'border-4 border-amber-800' },
  { id: 'modern', name: 'Modern Black', preview: 'border-4 border-gray-800' },
  { id: 'vintage', name: 'Vintage Brown', preview: 'border-4 border-orange-700' },
  { id: 'elegant', name: 'Elegant Silver', preview: 'border-4 border-gray-400' },
  { id: 'gold', name: 'Golden Frame', preview: 'border-4 border-yellow-500' },
];