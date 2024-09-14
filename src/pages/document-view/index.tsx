typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/supabase';
import Topbar from '@/components/Topbar';
import { FaEdit, FaDownload } from 'react-icons/fa';

function DocumentView() {
  const router = useRouter();
  const { documentId } = router.query;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [document, setDocument] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (documentId) {
      const fetchDocument = async () => {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();
        if (error) {
          console.error('ドキュメントの取得に失敗しました', error);
        } else {
          setDocument(data);
        }
      };
      fetchDocument();
    }
  }, [documentId]);

  const handleEdit = () => {
    router.push(`/document-edit?documentId=${documentId}`);
  };

  const handleDownload = () => {
    if (document) {
      const content = JSON.stringify(document.content, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.type}_${documentId}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return <div className="min-h-screen h-full flex items-center justify-center">ロード中...</div>;
  }

  return (
    <div className="min-h-screen h-full">
      <Topbar />
      <div className="container mx-auto px-4 py-8">
        {document ? (
          <div>
            <h1 className="text-2xl font-bold mb-4">{document.content.title}</h1>
            {document.content.sections.map((section: any, index: number) => (
              <div key={index} className="mb-6">
                <h2 className="text-xl font-semibold mb-2">{section.heading}</h2>
                <p className="text-base leading-relaxed">{section.content}</p>
              </div>
            ))}
            <div className="flex space-x-4 mt-8">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <FaEdit className="mr-2" />
                編集
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FaDownload className="mr-2" />
                ダウンロード
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">ドキュメントが見つかりませんでした。</div>
        )}
      </div>
    </div>
  );
}

export default DocumentView;