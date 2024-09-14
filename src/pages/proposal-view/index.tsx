tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import supabase from '@/supabase';
import { FaEdit, FaFileExport } from 'react-icons/fa';

interface DocumentType {
  id: string;
  project_id: string;
  type: string;
  content: {
    title: string;
    sections: {
      heading: string;
      content: string;
    }[];
  };
  created_at: string;
  updated_at: string;
}

export default function ProposalView() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);

        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('type', '提案資料')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) {
          setDocument({
            id: 'sample-id',
            project_id: 'sample-project-id',
            type: '提案資料',
            content: {
              title: 'サンプル提案資料',
              sections: [
                {
                  heading: 'サンプルセクション',
                  content: 'これはサンプルの提案資料です。',
                },
              ],
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          setDocument(data as DocumentType);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleEdit = () => {
    router.push('/proposal-edit');
  };

  const handleExport = () => {
    alert('エクスポート機能は準備中です。');
  };

  if (loading) {
    return (
      <div className="min-h-screen h-full flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full flex flex-col">
      <Topbar />
      <div className="flex-1 bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white p-8 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              {document?.content.title || '提案資料'}
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                <FaEdit className="mr-2" />
                編集
              </button>
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
              >
                <FaFileExport className="mr-2" />
                エクスポート
              </button>
            </div>
          </div>
          <div className="space-y-8">
            {document?.content.sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                  {section.heading}
                </h2>
                <p className="text-gray-600 leading-relaxed">{section.content}</p>
              </div>
            ))}
            <div className="mt-8">
              <img
                src="https://placehold.co/800x400"
                alt="提案資料イメージ"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}