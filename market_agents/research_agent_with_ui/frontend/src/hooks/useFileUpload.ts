import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { parseFile } from '../utils/fileParser';

export const useFileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      toast.success(`Successfully parsed ${file.name}`);
      // TODO: Handle the parsed data as needed
      console.log('Parsed data:', data);
    } catch (error) {
      toast.error('Error parsing file. Please check the format and try again.');
    }
  };

  const dragProps = {
    onDragOver: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    }, []),
    onDragLeave: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    }, []),
    onDrop: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, []),
  };

  return {
    handleFileChange,
    isDragging,
    dragProps,
  };
};