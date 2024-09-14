tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import { supabase } from '@/supabase';
import { Session } from '@supabase/supabase-js';
import { AiOutlineUpload } from 'react-icons/ai';
import axios from 'axios';

const FileUpload: React.FC = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
      } else {
        router.push('/login');
      }
    };

    getSession();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!['application/pdf', 'text/plain'].includes(selectedFile.type)) {
        setError('テキストまたはPDFファイルを選択してください。');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (!['application/pdf', 'text/plain'].includes(selectedFile.type)) {
        setError('テキストまたはPDFファイルを選択してください。');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('ファイルを選択してください。');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', session?.user.id || '');

      const response = await axios.post('/api/file-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      router.push('/document-generation');
    } catch (error) {
      setError('ファイルのアップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  if (!session) {
    return null; // セッションチェック中は何も表示しない
  }

  return (
    <div className="min-h-screen h-full flex flex-col">
      <Topbar />
      <div className="flex flex-col items-center justify-center flex-grow bg-gray-100 p-8">
        <h1 className="text-2xl font-bold mb-4">ファイルアップロード</h1>
        <div
          className="w-full max-w-md h-48 flex flex-col items-center justify-center border-4 border-dashed border-gray-400 bg-white cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          {file ? (
            <p>{file.name}</p>
          ) : (
            <>
              <AiOutlineUpload className="text-gray-400 text-6xl mb-2" />
              <p className="text-gray-500">ここにファイルをドラッグ＆ドロップ、またはクリックしてファイルを選択</p>
            </>
          )}
        </div>
        <input
          type="file"
          accept=".txt, .pdf"
          id="fileInput"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default FileUpload;