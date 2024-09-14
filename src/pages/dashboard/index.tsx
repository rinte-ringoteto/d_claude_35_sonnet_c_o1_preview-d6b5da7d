tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import supabase from '@/supabase';
import Link from 'next/link';
import { FiPlus } from 'react-icons/fi';

interface Project {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('created_by', user.id);

        if (error) throw error;

        setProjects(data || []);
      } catch (error) {
        console.error('プロジェクトの取得に失敗しました:', error);
        // サンプルデータを設定
        setProjects([
          {
            id: 'sample-project-1',
            name: 'サンプルプロジェクト1',
            description: 'これはサンプルのプロジェクトです。',
            created_by: user?.id || '',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  const handleNewProject = () => {
    router.push('/projects/new');
  };

  return (
    <div className="min-h-screen h-full flex flex-col bg-gray-100">
      <Topbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <button
            onClick={handleNewProject}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            <FiPlus className="mr-2" />
            新規プロジェクト作成
          </button>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">プロジェクト一覧</h2>
          {loading ? (
            <p>読み込み中...</p>
          ) : projects.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <li key={project.id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{project.name}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <Link href={`/projects/${project.id}`}>
                    <div className="text-blue-500 hover:underline cursor-pointer">詳細を見る</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>プロジェクトがありません。</p>
          )}
        </div>
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">クイックアクセス</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/documents">
              <div className="flex items-center p-6 bg-white rounded-lg shadow hover:bg-gray-100 transition cursor-pointer">
                <img src="https://placehold.co/50x50" alt="ドキュメント" className="mr-4" />
                <span className="text-gray-800 font-medium">ドキュメント生成</span>
              </div>
            </Link>
            <Link href="/source_codes">
              <div className="flex items-center p-6 bg-white rounded-lg shadow hover:bg-gray-100 transition cursor-pointer">
                <img src="https://placehold.co/50x50" alt="ソースコード" className="mr-4" />
                <span className="text-gray-800 font-medium">ソースコード生成</span>
              </div>
            </Link>
            <Link href="/quality_checks">
              <div className="flex items-center p-6 bg-white rounded-lg shadow hover:bg-gray-100 transition cursor-pointer">
                <img src="https://placehold.co/50x50" alt="品質チェック" className="mr-4" />
                <span className="text-gray-800 font-medium">品質チェック</span>
              </div>
            </Link>
            {/* 他のクイックアクセスリンクを追加 */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;