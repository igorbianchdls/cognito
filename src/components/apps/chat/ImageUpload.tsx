'use client';

import { ImageIcon, XIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UseImageUploadReturn } from './useImageUpload';

interface ImageUploadProps {
  selectedImage: UseImageUploadReturn['selectedImage'];
  imageMimeType: UseImageUploadReturn['imageMimeType'];
  handleImageUpload: UseImageUploadReturn['handleImageUpload'];
  clearImage: UseImageUploadReturn['clearImage'];
  isUploading: UseImageUploadReturn['isUploading'];
  className?: string;
}

export const ImageUpload = ({
  selectedImage,
  imageMimeType,
  handleImageUpload,
  clearImage,
  isUploading,
  className
}: ImageUploadProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Upload Button */}
      {!selectedImage && (
        <div className="relative">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </Button>
        </div>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <img
            src={selectedImage}
            alt="Upload preview"
            className="w-8 h-8 object-cover rounded"
          />
          <span className="text-xs text-muted-foreground">
            {imageMimeType.split('/')[1]?.toUpperCase()}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearImage}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
};