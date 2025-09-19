
import React, { useCallback } from 'react';

interface FileUploadProps {
  onFilesUpload: (files: FileList) => void;
  children: React.ReactNode;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesUpload, children, multiple = false }) => {

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      onFilesUpload(files);
    }
  }, [onFilesUpload]);

  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileChange(event.dataTransfer.files);
    }
  }, [handleFileChange]);

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFileChange(event.target.files);
    }
  };

  return (
    <div>
      <label
        htmlFor="file-upload"
        className="relative"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {children}
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onInputChange} accept="image/png, image/jpeg" multiple={multiple} />
      </label>
    </div>
  );
};
