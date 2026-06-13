import { useRef, useState } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhotoCaptureProps {
  onCapture: (base64: string) => void;
}

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB raw — after resize it will be much smaller

function resizeImageToBase64(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      let newWidth = width;
      let newHeight = height;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          newWidth = maxSize;
          newHeight = Math.round((height / width) * maxSize);
        } else {
          newHeight = maxSize;
          newWidth = Math.round((width / height) * maxSize);
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      resolve(base64);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export function PhotoCapture({ onCapture }: PhotoCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameraBlocked, setCameraBlocked] = useState(false);

  async function handleFile(file: File) {
    if (!file) return;
    setError('');

    // Format check
    if (!SUPPORTED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      setError('This image format is not supported. Please upload a JPEG or PNG.');
      return;
    }

    // Size check
    if (file.size > MAX_FILE_BYTES) {
      setError('Image is too large. Please use a smaller photo.');
      return;
    }

    setIsProcessing(true);
    try {
      const base64 = await resizeImageToBase64(file, 1024);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onCapture(base64);
    } catch (err) {
      console.error('Failed to process image:', err);
      setError('Could not process this image. Please try a different photo.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCameraClick() {
    // Feature-detect getUserMedia to proactively warn on desktop or blocked browsers,
    // but still fall through to file input (which triggers native camera on mobile).
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Permission granted — stop the preview stream and open the file input
          stream.getTracks().forEach((t) => t.stop());
          setCameraBlocked(false);
          cameraInputRef.current?.click();
        })
        .catch((err) => {
          console.warn('Camera access denied:', err);
          setCameraBlocked(true);
          setError('Camera access was denied. You can still upload a photo from your library.');
        });
    } else {
      // No getUserMedia API (many mobile browsers go directly through file input)
      cameraInputRef.current?.click();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 gap-6">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Snap to List</h1>
        <p className="text-gray-500 text-lg">Take a photo of any item to create an eBay listing instantly</p>
      </div>

      {preview ? (
        <div className="relative w-64 h-64 rounded-xl overflow-hidden shadow-lg border-2 border-[#0064D2]">
          <img
            src={preview}
            alt="Item preview"
            className="w-full h-full object-cover"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={cameraBlocked}
          className={cn(
            'flex flex-col items-center justify-center w-64 h-64 rounded-xl',
            'border-2 border-dashed border-[#0064D2] bg-blue-50',
            'transition-all duration-200 hover:bg-blue-100 active:scale-95',
            'cursor-pointer gap-4',
            cameraBlocked && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Camera className="w-16 h-16 text-[#0064D2]" strokeWidth={1.5} />
          <span className="text-[#0064D2] font-semibold text-lg">Take a Photo</span>
        </button>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 w-full max-w-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      <Button
        variant="outline"
        size="lg"
        className="gap-2 text-gray-600 border-gray-300 min-h-[48px] rounded-xl px-6"
        onClick={() => libraryInputRef.current?.click()}
      >
        <Upload className="w-5 h-5" />
        Upload from library
      </Button>

      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
