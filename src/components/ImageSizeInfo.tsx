import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ImageType = 'logo' | 'cover' | 'banner' | 'product' | 'document' | 'profile' | 'gamification';

interface ImageSizeInfoProps {
  type: ImageType;
}

export const ImageSizeInfo: React.FC<ImageSizeInfoProps> = ({ type }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getInfo = () => {
    switch (type) {
      case 'gamification':
        return {
          title: 'Imagen de Gamificación',
          desc: 'Se recomienda una imagen en formato apaisado. La vista mostrará un recorte con la proporción exacta de 672x256 píxeles (aspect ratio 21:8) para acoplarse al diseño del banner. Formatos: JPG, PNG.',
        };
      case 'logo':
        return {
          title: 'Logo del Restaurante',
          desc: 'Se recomienda una imagen cuadrada. Dimensiones sugeridas: 400x400 píxeles. Formatos: JPG, PNG.',
        };
      case 'cover':
        return {
          title: 'Imagen de Portada',
          desc: 'Se recomienda una imagen rectangular (paisaje) para la cabecera. Dimensiones sugeridas: 1200x400 píxeles a 1920x1080. Formatos: JPG, PNG.',
        };
      case 'banner':
        return {
          title: 'Banner Publicitario',
          desc: 'Ideal para promociones en la página de inicio. Dimensiones sugeridas: 1200x400 píxeles (formato apaisado 3:1). Formatos: JPG, PNG o GIF.',
        };
      case 'product':
        return {
          title: 'Imagen de Producto',
          desc: 'Se recomienda que todas las imágenes de productos sean cuadradas para mantener la uniformidad. Dimensiones sugeridas: 600x600 px u 800x800 px. Formatos: JPG, PNG.',
        };
      case 'document':
        return {
          title: 'Subida de Documentos',
          desc: 'Asegúrate de que el documento sea totalmente legible, sin reflejos ni zonas borrosas. Evita recortar los bordes del documento.',
        };
      case 'profile':
        return {
          title: 'Foto de Perfil',
          desc: 'Se recomienda una foto de frente, bien iluminada y en formato cuadrado. Dimensiones sugeridas: 400x400 píxeles.',
        };
      default:
        return {
          title: 'Información de Imagen',
          desc: 'Asegúrate de subir una imagen nítida y de buena calidad.',
        };
    }
  };

  const info = getInfo();

  return (
    <div className="relative inline-block ml-2 align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-orange-500 hover:text-orange-600 transition-colors p-1.5 bg-orange-50 rounded-full active:scale-95 touch-manipulation"
        title="Medidas recomendadas"
      >
        <Info className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998] md:hidden"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed inset-x-4 bottom-20 md:absolute md:bottom-full md:left-1/2 md:-translate-x-1/2 md:mb-3 w-auto md:w-72 bg-white rounded-[2rem] shadow-2xl border border-neutral-200 z-[9999] p-6 text-left"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Info className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="text-[10px] font-black text-neutral-800 uppercase tracking-[0.2em]">{info.title}</h4>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-2 bg-neutral-100 rounded-xl text-on-surface-muted hover:text-neutral-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-bold bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                {info.desc}
              </p>
              
              {/* Tooltip arrow for desktop */}
              <div className="hidden md:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-neutral-200 rotate-45"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
