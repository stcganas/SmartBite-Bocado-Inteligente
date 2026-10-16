import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
  cropWidth?: number;
  cropHeight?: number;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio,
  cropWidth,
  cropHeight,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFreeCrop, setIsFreeCrop] = useState(!aspectRatio && !cropWidth);
  const [targetWidth, setTargetWidth] = useState<number | undefined>(cropWidth);
  const [targetHeight, setTargetHeight] = useState<number | undefined>(cropHeight);

  // Sync with props
  React.useEffect(() => {
    if (isOpen) {
      setTargetWidth(cropWidth);
      setTargetHeight(cropHeight);
      setIsFreeCrop(!aspectRatio && !cropWidth);
    }
  }, [isOpen, cropWidth, cropHeight, aspectRatio]);

  const activeAspect = isFreeCrop 
    ? undefined 
    : (targetWidth && targetHeight ? targetWidth / targetHeight : (aspectRatio || (cropWidth && cropHeight ? cropWidth / cropHeight : undefined)));

  const onCropCompleteEvent = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      if (!url.startsWith('data:')) {
        image.setAttribute('crossOrigin', 'anonymous'); 
      }
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Implement Super-Sampling / High-DPI Scaling (3x density) to preserve pixel perfection on Retina displays
    const hdpiFactor = 3; 

    // Use target dimensions scaled up by high-DPI factor, or default to original pixel-crop dimensions to keep 100% native quality
    const finalWidth = targetWidth ? (targetWidth * hdpiFactor) : pixelCrop.width;
    const finalHeight = targetHeight ? (targetHeight * hdpiFactor) : pixelCrop.height;

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Enable high quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      finalWidth,
      finalHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/png', 1.0); // Export in PNG with maximum lossless quality
    });
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface w-full max-w-2xl rounded-[24px] overflow-hidden flex flex-col shadow-2xl h-[85vh] max-h-[900px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10 bg-surface">
            <div>
              <h2 className="text-xl font-black text-on-surface">Redimensionar y Recortar</h2>
              <p className="text-sm text-on-surface-variant font-medium mt-1">Ajusta el área y las dimensiones finales de salida</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cropper Area */}
          <div className="flex-1 relative bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={activeAspect}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteEvent}
              onZoomChange={setZoom}
            />
          </div>

          {/* Controls & Footer */}
          <div className="p-6 border-t border-white/5 bg-surface relative z-10 flex flex-col gap-5">
            {/* Dimensions Control */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Ancho Final (px)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={targetWidth || ''}
                    onChange={(e) => setTargetWidth(Number(e.target.value) || undefined)}
                    placeholder="Auto"
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  {croppedAreaPixels && !targetWidth && (
                    <span className="text-[10px] font-bold text-neutral-400 italic">Actual: {Math.round(croppedAreaPixels.width)}px</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Alto Final (px)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={targetHeight || ''}
                    onChange={(e) => setTargetHeight(Number(e.target.value) || undefined)}
                    placeholder="Auto"
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  {croppedAreaPixels && !targetHeight && (
                    <span className="text-[10px] font-bold text-neutral-400 italic">Actual: {Math.round(croppedAreaPixels.height)}px</span>
                  )}
                </div>
              </div>
            </div>

            {/* High-DPI/Optimization indicator banner */}
            <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3.5 flex items-start gap-3">
              <span className="text-lg leading-none">✨</span>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-orange-800">Tecnología de Súper-Muestreo (High-DPI 3x)</p>
                <p className="text-[11px] font-semibold text-orange-700/90 leading-relaxed">
                  Exportaremos tu imagen a {targetWidth ? targetWidth * 3 : '3x de'} x {targetHeight ? targetHeight * 3 : '3x de'} px en formato PNG sin pérdida. Se mantendrá impecablemente nítida y cristalina en pantallas de alta densidad (Retina, iPhone, iPad, Mac y OLED).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-on-surface-variant whitespace-nowrap">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => {
                  setZoom(Number(e.target.value));
                }}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => setIsFreeCrop(!isFreeCrop)}
                className="text-xs text-orange-500 font-bold px-4 py-2 hover:bg-orange-50 rounded-lg transition-colors"
              >
                {isFreeCrop ? 'Bloquear Relación de Aspecto' : 'Desbloquear (Recorte Libre)'}
              </button>
              
              <div className="flex justify-end gap-3 flex-1">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-full font-bold text-on-surface-variant hover:bg-neutral-100 transition-colors"
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="px-8 py-3 rounded-full font-black text-on-surface bg-orange-500 hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-[0_8px_20px_rgba(255,138,0,0.3)] disabled:opacity-50"
                >
                  {isProcessing ? 'Procesando...' : (
                    <>
                      <Check className="w-5 h-5" />
                      Aplicar y Subir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
