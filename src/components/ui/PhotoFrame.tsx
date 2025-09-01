import { useEffect, useRef } from 'react';

interface PhotoFrameProps {
  imageUrl: string;
  frameType: string;
  className?: string;
  onImageLoad?: (canvas: HTMLCanvasElement) => void;
  title?: string;
  filename?: string;
  onDownload?: () => void;
}

const frames = {
  none: { border: 0, shadow: 'none', borderRadius: 0, borderColor: '#ffffff' },
  celebration: { border: 60, shadow: '0 12px 40px rgba(255,20,147,0.4)', borderRadius: 20, borderColor: '#FF1493' },
  tropical: { border: 70, shadow: '0 15px 45px rgba(0,191,255,0.3)', borderRadius: 15, borderColor: '#00BFFF' },
  rainbow: { border: 65, shadow: '0 10px 35px rgba(255,165,0,0.4)', borderRadius: 25, borderColor: '#FF6B35' },
  party: { border: 75, shadow: '0 20px 50px rgba(138,43,226,0.5)', borderRadius: 10, borderColor: '#8A2BE2' },
  festive: { border: 55, shadow: '0 8px 30px rgba(255,69,0,0.4)', borderRadius: 30, borderColor: '#FF4500' },
};

export const PhotoFrame = ({ imageUrl, frameType, className = '', onImageLoad, title, filename, onDownload }: PhotoFrameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWavePattern = (ctx: CanvasRenderingContext2D, width: number, height: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 10) {
          const y = 15 + i * 10 + Math.sin(x / 20) * 8;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const drawStars = (ctx: CanvasRenderingContext2D, width: number, height: number, count: number) => {
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 3 + Math.random() * 4;
        
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const angle = (j * 2 * Math.PI) / 5;
          const radius = j % 2 === 0 ? size : size / 2;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    };

    const drawHearts = (ctx: CanvasRenderingContext2D, width: number, height: number, count: number) => {
      ctx.fillStyle = '#FF69B4';
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 4 + Math.random() * 6;
        
        ctx.beginPath();
        ctx.arc(x - size/2, y, size/2, Math.PI, 0, false);
        ctx.arc(x + size/2, y, size/2, Math.PI, 0, false);
        ctx.lineTo(x, y + size);
        ctx.closePath();
        ctx.fill();
      }
    };

    const drawConfetti = (ctx: CanvasRenderingContext2D, width: number, height: number, count: number) => {
      const colors = ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#118AB2', '#8A2BE2'];
      for (let i = 0; i < count; i++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 2 + Math.random() * 4;
        ctx.fillRect(x, y, size, size);
      }
    };

    const loadImage = () => {
      const frame = frames[frameType as keyof typeof frames] || frames.none;
      
      // Set canvas size based on image + frame
      const frameWidth = frame.border * 2;
      canvas.width = image.naturalWidth + frameWidth;
      canvas.height = image.naturalHeight + frameWidth + 40; // Extra space for text

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (frameType !== 'none') {
        // Draw frame background with gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, frame.borderColor);
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, frame.borderColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw decorative patterns based on frame type
        if (frameType === 'celebration') {
          drawStars(ctx, canvas.width, frame.border, 15);
          drawStars(ctx, canvas.width, frame.border, 15);
          drawHearts(ctx, canvas.width, canvas.height - frame.border, 10);
        } else if (frameType === 'tropical') {
          drawWavePattern(ctx, canvas.width, canvas.height, '#00CED1');
          drawStars(ctx, canvas.width, canvas.height, 20);
        } else if (frameType === 'rainbow') {
          // Rainbow border effect
          const rainbowGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          rainbowGradient.addColorStop(0, '#FF0000');
          rainbowGradient.addColorStop(0.17, '#FF8C00');
          rainbowGradient.addColorStop(0.33, '#FFD700');
          rainbowGradient.addColorStop(0.5, '#00FF00');
          rainbowGradient.addColorStop(0.67, '#0000FF');
          rainbowGradient.addColorStop(0.83, '#8A2BE2');
          rainbowGradient.addColorStop(1, '#FF1493');
          ctx.fillStyle = rainbowGradient;
          ctx.fillRect(0, 0, canvas.width, frame.border);
          ctx.fillRect(0, canvas.height - frame.border - 40, canvas.width, frame.border);
        } else if (frameType === 'party') {
          drawConfetti(ctx, canvas.width, canvas.height, 30);
          drawStars(ctx, canvas.width, canvas.height, 15);
        } else if (frameType === 'festive') {
          drawHearts(ctx, canvas.width, canvas.height, 20);
          drawConfetti(ctx, canvas.width, canvas.height, 25);
        }

        // Draw inner border
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(frame.border - 5, frame.border - 5, image.naturalWidth + 10, image.naturalHeight + 10);
      }

      // Draw image centered in frame
      ctx.drawImage(
        image,
        frame.border,
        frame.border,
        image.naturalWidth,
        image.naturalHeight
      );

      if (frameType !== 'none') {
        // Add download button integrated into frame
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonX = canvas.width - buttonWidth - 15;
        const buttonY = canvas.height - buttonHeight - 15;
        
        // Button background with gradient
        const buttonGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonWidth, buttonY + buttonHeight);
        buttonGradient.addColorStop(0, 'rgba(255,255,255,0.9)');
        buttonGradient.addColorStop(1, 'rgba(240,240,240,0.9)');
        ctx.fillStyle = buttonGradient;
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button border
        ctx.strokeStyle = frame.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Download icon and text
        ctx.fillStyle = frame.borderColor;
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📥 Download', buttonX + buttonWidth/2, buttonY + buttonHeight/2 + 5);
        
        // Add "I love NAGA" text at the bottom left
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = frame.borderColor;
        ctx.lineWidth = 2;
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'left';
        
        const text = 'I love NAGA ❤️';
        const textX = 15;
        const textY = canvas.height - 15;
        
        // Draw text with outline
        ctx.strokeText(text, textX, textY);
        ctx.fillText(text, textX, textY);
        
        // Add small decorative hearts around the text
        ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 3; i++) {
          const heartX = textX + (i * 30) + Math.random() * 10;
          const heartY = textY - 30 + Math.random() * 10;
          const size = 3 + Math.random() * 2;
          
          ctx.beginPath();
          ctx.arc(heartX - size/2, heartY, size/2, Math.PI, 0, false);
          ctx.arc(heartX + size/2, heartY, size/2, Math.PI, 0, false);
          ctx.lineTo(heartX, heartY + size);
          ctx.closePath();
          ctx.fill();
        }
      }

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
        className="w-full h-auto max-h-[80vh] object-contain rounded-lg cursor-pointer"
        style={{
          filter: frames[frameType as keyof typeof frames]?.shadow ? `drop-shadow(${frames[frameType as keyof typeof frames].shadow})` : 'none'
        }}
        onClick={(e) => {
          if (frameType !== 'none' && onDownload) {
            // Check if click is on download button area
            const rect = e.currentTarget.getBoundingClientRect();
            const scaleX = e.currentTarget.width / rect.width;
            const scaleY = e.currentTarget.height / rect.height;
            
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;
            
            const buttonWidth = 120;
            const buttonHeight = 40;
            const buttonX = e.currentTarget.width - buttonWidth - 15;
            const buttonY = e.currentTarget.height - buttonHeight - 15;
            
            if (clickX >= buttonX && clickX <= buttonX + buttonWidth && 
                clickY >= buttonY && clickY <= buttonY + buttonHeight) {
              onDownload();
            }
          }
        }}
      />
      
      {/* Title and filename overlay for framed images */}
      {frameType !== 'none' && (title || filename) && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm max-w-xs">
          {title && <div className="font-semibold truncate">{title}</div>}
          {filename && <div className="text-xs opacity-80 truncate">{filename}</div>}
        </div>
      )}
    </div>
  );
};

export const frameOptions = [
  { id: 'none', name: 'No Frame', preview: 'border-0' },
  { id: 'celebration', name: '🎉 Celebration', preview: 'border-4 border-pink-500 bg-gradient-to-r from-pink-500 to-purple-500' },
  { id: 'tropical', name: '🌊 Tropical Waves', preview: 'border-4 border-cyan-400 bg-gradient-to-r from-cyan-400 to-blue-500' },
  { id: 'rainbow', name: '🌈 Rainbow Magic', preview: 'border-4 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500' },
  { id: 'party', name: '🎊 Party Time', preview: 'border-4 border-purple-600 bg-gradient-to-r from-purple-600 to-pink-600' },
  { id: 'festive', name: '✨ Festive Fun', preview: 'border-4 border-orange-500 bg-gradient-to-r from-orange-500 to-red-500' },
];