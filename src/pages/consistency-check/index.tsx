typescript
import { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import { useRouter } from 'next/router';
import supabase from '@/supabase';
import { AiOutlineFileText } from 'react-icons/ai';

interface Document {
  id: string;
  project_id: string;
  type: string;
  content: any;
  created_at: string;
  updated_at: string;
}

const ConsistencyCheck = () => {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      } else {
        router.push('/login');
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (userId) {
        const { data: docs, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });
        if (docs) {
          setDocuments(docs);
        } else {
          console.error(error);
        }
      }
    };
    fetchDocuments();
  }, [userId]);

  const handleDocumentSelect = (id: string) => {
    if (selectedDocuments.includes(id)) {
      setSelectedDocuments(selectedDocuments.filter((docId) => docId !== id));
    } else {
      setSelectedDocuments([...selectedDocuments, id]);
    }
  };

  const handleStartCheck = async () => {
    setIsChecking(true);
    setProgress(0);
    // チェック進捗をシミュレート
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsChecking(false);
          router.push('/consistency-check-result');
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // バックエンドにチェック開始リクエストを送信
    try {
      const { error } = await supabase
        .rpc('start_consistency_check', { document_ids: selectedDocuments });
      if (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Topbar />
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">整合性確認画面</h1>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">チェック対象ドキュメント選択</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                  selectedDocuments.includes(doc.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onClick={() => handleDocumentSelect(doc.id)}
              >
                <AiOutlineFileText className="text-2xl text-gray-600 mr-3" />
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{doc.type}</p>
                  <p className="text-gray-500 text-sm">{new Date(doc.created_at).toLocaleString('ja-JP')}</p>
                </div>
                {selectedDocuments.includes(doc.id) && (
                  <span className="text-blue-500 font-semibold">選択済み</span>
                )}
              </div>
            ))}
          </div>

          <button
            className="mt-6 w-full md:w-auto bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300 disabled:opacity-50"
            onClick={handleStartCheck}
            disabled={isChecking || selectedDocuments.length === 0}
          >
            チェック開始
          </button>

          {isChecking && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-700 mb-2">チェック進捗</h2>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-gray-600 mt-2">{progress}% 完了</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsistencyCheck;