tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Topbar from '@/components/Topbar';
import { supabase } from '@/supabase';
import axios from 'axios';

function ProgressReport() {
  const [session, setSession] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (!session) {
        router.push('/login');
      } else {
        fetchProjects();
      }
    };

    getSession();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('created_by', session?.user?.id);

    if (error) {
      console.log('プロジェクトの取得エラー:', error);
    } else {
      setProjects(data || []);
    }
  };

  const startGeneration = async () => {
    if (!selectedProject || !startDate || !endDate) {
      alert('プロジェクトとレポート期間を選択してください。');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const response = await axios.post('/api/progress-report', {
        project_id: selectedProject,
        start_date: startDate,
        end_date: endDate,
      });

      const reportId = response.data.report_id;

      const interval = setInterval(async () => {
        const progressResponse = await axios.get(
          `/api/progress-report/${reportId}/progress`
        );

        setProgress(progressResponse.data.progress);

        if (progressResponse.data.progress >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          router.push(`/progress-report/${reportId}`);
        }
      }, 1000);
    } catch (error) {
      console.log('レポート生成のエラー:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Topbar />
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">進捗レポート生成</h1>
        <div className="bg-white p-6 rounded shadow">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              レポート対象プロジェクト
            </label>
            <select
              className="w-full border border-gray-300 p-2 rounded"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">プロジェクトを選択してください</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">レポート期間</label>
            <div className="flex space-x-4">
              <input
                type="date"
                className="border border-gray-300 p-2 rounded w-1/2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="border border-gray-300 p-2 rounded w-1/2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <button
              className={`w-full bg-blue-500 text-white p-2 rounded ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={startGeneration}
              disabled={isGenerating}
            >
              生成開始
            </button>
          </div>
          {isGenerating && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">生成進捗</label>
              <div className="w-full bg-gray-200 rounded h-4">
                <div
                  className="bg-blue-500 h-4 rounded"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-right text-gray-600 mt-2">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressReport;