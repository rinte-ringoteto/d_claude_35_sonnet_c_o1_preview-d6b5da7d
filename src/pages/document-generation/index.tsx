import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/supabase';
import Topbar from '@/components/Topbar';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';

const DocumentGeneration = () => {
  const [session, setSession] = useState(null);
  const router = useRouter();

  const [documentType, setDocumentType] = useState('');
  const documentTypes = ['要件定義', 'システム設計', '開発', 'テスト', '提案資料'];

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }
    };
    getSession();
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen h-full flex items-center justify-center">
        <FaSpinner className="animate-spin text-gray-500 text-4xl" />
      </div>
    );
  }

  const handleStartGeneration = async () => {
    if (!documentType) return;
    setIsGenerating(true);
    setProgress(0);

    try {
      // ドキュメント生成の開始
      const response = await axios.post('/api/document-generation', {
        documentType,
        projectId: 'sample-project-id',
      });
      const { generationId } = response.data;

      // 進捗状況のポーリング
      const interval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`/api/document-generation/status/${generationId}`);
          const { progress: currentProgress, completed, documentId } = statusResponse.data;
          setProgress(currentProgress);

          if (completed) {
            clearInterval(interval);
            setIsGenerating(false);
            // ドキュメント表示画面へ自動遷移
            router.push(`/document-display?documentId=${documentId}`);
          }
        } catch (error) {
          console.error('進捗の取得に失敗しました。', error);
          setIsGenerating(false);
          clearInterval(interval);
        }
      }, 2000); // 2秒ごとにポーリング
    } catch (error) {
      console.error('ドキュメントの生成に失敗しました。', error);
      setIsGenerating(false);

      // サンプルデータを表示（エラー処理）
      // ここでは生成完了として処理し、サンプルのdocumentIdを使用して遷移
      router.push(`/document-display?documentId=sample-document-id`);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-50">
      <Topbar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">ドキュメント生成</h1>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">生成するドキュメントの種類を選択してください</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option value="">選択してください</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <button
          className={`w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 ${(!documentType || isGenerating) && 'opacity-50 cursor-not-allowed'}`}
          onClick={handleStartGeneration}
          disabled={!documentType || isGenerating}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <FaSpinner className="animate-spin mr-2" />
              生成中...
            </div>
          ) : (
            '生成開始'
          )}
        </button>
        {isGenerating && (
          <div className="mt-6">
            <p className="text-gray-700 mb-2">生成進捗：</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-gray-700 mt-2">{progress}% 完了</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentGeneration;