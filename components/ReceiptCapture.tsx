import React, { useRef, useState } from 'react';
import { CameraIcon, UploadCloudIcon } from './icons/Icons';

interface ReceiptCaptureProps {
  onReceiptCapture: (file: File) => void;
}

const ReceiptCapture: React.FC<ReceiptCaptureProps> = ({ onReceiptCapture }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const handleCameraClick = () => {
      cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
      galleryInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (file) {
      onReceiptCapture(file);
    }
  };

  const handleRetake = () => {
    setFile(null);
    setImagePreview(null);
    if(cameraInputRef.current) {
        cameraInputRef.current.value = "";
    }
    if(galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };


  return (
    <div className="flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
            <CameraIcon className="mx-auto h-12 w-12 text-cyan-400" />
            <h2 className="mt-4 text-3xl font-extrabold text-white">Capture Receipt</h2>
            <p className="mt-2 text-slate-400">Use your camera or upload an image of the bill.</p>
        </div>

        <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
        />

        <input
            type="file"
            accept="image/*"
            ref={galleryInputRef}
            onChange={handleFileChange}
            className="hidden"
        />

        <div className="w-full aspect-square bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-700">
            {imagePreview ? (
                <img src={imagePreview} alt="Receipt preview" className="object-contain h-full w-full" />
            ) : (
                <div className="text-center text-slate-500">
                    <p>Image preview will appear here.</p>
                </div>
            )}
        </div>

        {imagePreview && file ? (
             <div className="flex gap-4">
                 <button 
                     onClick={handleRetake}
                     className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-slate-600 rounded-lg hover:bg-slate-700 transition-transform transform hover:scale-105"
                 >
                     Retake
                 </button>
                 <button 
                     onClick={handleConfirm}
                     className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-transform transform hover:scale-105"
                 >
                     Confirm & Scan
                     <UploadCloudIcon className="w-5 h-5"/>
                 </button>
             </div>
        ) : (
            <div className="space-y-4">
                <button 
                    onClick={handleCameraClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-transform transform hover:scale-105"
                >
                    Take Photo
                    <CameraIcon className="w-5 h-5"/>
                </button>
                <button 
                    onClick={handleGalleryClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition-transform transform hover:scale-105"
                >
                    Choose from Gallery
                    <UploadCloudIcon className="w-5 h-5"/>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptCapture;