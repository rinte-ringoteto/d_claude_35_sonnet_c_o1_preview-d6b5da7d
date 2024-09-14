tsx
import React, { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import supabase from '@/supabase';
import { useRouter } from 'next/router';
import axios from 'axios';
import { FiPlay } from 'react-icons/fi';

interface Project {
  id: string;
  name: string;
}

export default function WorkEstimation() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser(session.user);
      } else {
        router.push('/login');
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', user.id);
      if (error) {
        console.error(error);
        // サンプルデータを表示
        setProjects([
          { id: '1', name: 'サンプルプロジェクト1' },
          { id: '2', name: 'サンプルプロジェクト2' },
        ]);
      } else {
        setProjects(data);
      }
    };
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const startEstimation = async () => {
    if (!selectedProjectId) {
      alert('プロジェクトを選択してください。');
      return;
    }
    setIsEstimating(true);
    setProgress(0);

    try {
      await axios.post('/api/work-estimation', {
        project_id: selectedProjectId,
      });

      // 進捗のシミュレーション
      const estimationInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(estimationInterval);
            // 見積完了後、結果画面へ遷移
            router.push('/estimation-result');
            return 100;
          } else {
            return prevProgress + 10;
          }
        });
      }, 500);
    } catch (error) {
      console.error(error);
      alert('見積の開始に失敗しました。');
      setIsEstimating(false);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Topbar />
      <div className="max-w-3xl mx-auto py-8">
        <img
          src="https://placehold.co/600x200?text=工数見積"
          alt="工数見積イメージ"
          className="w-full mb-6 rounded"
        />
        <h1 className="text-3xl font-bold mb-6">工数見積画面</h1>
        <div className="mb-4">
          <label className="block mb-2">見積対象プロジェクトを選択してください:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">-- プロジェクトを選択 --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={startEstimation}
          disabled={isEstimating}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
        >
          <FiPlay className="mr-2" />
          見積開始
        </button>
        {isEstimating && (
          <div className="mt-8">
            <p>見積進捗: {progress}%</p>
            <div className="w-full bg-gray-300 h-4 rounded">
              <div
                className="bg-blue-500 h-4 rounded"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}