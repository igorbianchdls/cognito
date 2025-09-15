import { useState, ChangeEvent } from 'react';

export interface UseImageUploadReturn {
  selectedImage: string | null;
  imageMimeType: string;
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  isUploading: boolean;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      setImageMimeType(file.type);
      setIsUploading(false);
    };

    reader.onerror = () => {
      alert('Erro ao carregar a imagem');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageMimeType('');
    setIsUploading(false);
  };

  return {
    selectedImage,
    imageMimeType,
    handleImageUpload,
    clearImage,
    isUploading
  };
};