import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import { supabase } from '@/supabase';
import { NextPage } from 'next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow as codeStyle } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { FiEdit, FiDownload } from 'react-icons/fi';
import 'tailwindcss/tailwind.css';

const CodeView: NextPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [codeContent, setCodeContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const { id } = router.query;

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('セッションの取得に失敗しました', error);
        router.push('/login');
      } else if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        if (id) {
          fetchSourceCode(id as string);
        }
      }
    };
    getSession();
  }, [id]);

  const fetchSourceCode = async (sourceCodeId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('source_codes')
      .select('*')
      .eq('id', sourceCodeId)
      .single();

    if (error) {
      console.error('ソースコードの取得に失敗しました', error);
      alert('ソースコードの取得に失敗しました');
    } else {
      setCodeContent(data.content);
      setFileName(data.file_name);
      setEditedContent(data.content);
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('source_codes')
      .update({ content: editedContent })
      .eq('id', id);

    if (error) {
      console.error('ソースコードの更新に失敗しました', error);
      alert('ソースコードの更新に失敗しました');
    } else {
      setCodeContent(editedContent);
      setIsEditing(false);
      alert('ソースコードを更新しました');
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([codeContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName || 'sourcecode.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Topbar />
      <div className="container mx-auto py-8">
        {loading ? (
          <div className="text-center">読み込み中...</div>
        ) : (
          <div className="bg-white p-6 rounded shadow">
            <img
              src="https://placehold.co/600x200?text=Code+View+Banner"
              alt="Banner"
              className="mb-4 w-full rounded"
            />
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{fileName}</h1>
              <div className="flex space-x-2">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center">
                    保存
                  </button>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center">
                    <FiEdit className="mr-2" />
                    編集
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center">
                  <FiDownload className="mr-2" />
                  ダウンロード
                </button>
              </div>
            </div>
            {isEditing ? (
              <textarea
                className="w-full h-96 p-2 border rounded"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            ) : (
              <SyntaxHighlighter language="typescript" style={codeStyle}>
                {codeContent}
              </SyntaxHighlighter>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeView;