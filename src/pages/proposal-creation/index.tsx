import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/supabase';
import Topbar from '@/components/Topbar';
import axios from 'axios';
import { FaPlay } from 'react-icons/fa';

const ProposalCreation: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [templates] = useState([
    { id: 'template1', name: 'ビジネス提案テンプレート' },
    { id: 'template2', name: '技術提案テンプレート' },
    { id: 'template3', name: 'マーケティング提案テンプレート' },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    };
    getUser();
  }, [router]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setProjects(data);
      } else {
        console.error(error);
      }
    };
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProject(e.target.value);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
  };

  const handleStartCreation = async () => {
    if (!selectedProject || !selectedTemplate) {
      setError('プロジェクトとテンプレートを選択してください。');
      return;
    }
    setError('');
    setIsCreating(true);
    setProgress(0);

    try {
      await axios.post('/api/proposal-creation', {
        projectId: selectedProject,
        templateId: selectedTemplate,
      });

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsCreating(false);
            router.push('/proposal-display');
          }
          return prev + 10;
        });
      }, 500);
    } catch (err) {
      setError('作成中にエラーが発生しました。');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen h-full bg-gray-100">
      <Topbar />
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">
            {error}
          </div>
        )}
        <div className="bg-white rounded shadow p-6">
          <h1 className="text-2xl font-bold mb-4">提案資料作成</h1>
          <img
            src="https://placehold.co/600x200?text=提案資料作成"
            alt="提案資料作成"
            className="w-full mb-6"
          />
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              プロジェクトを選択
            </label>
            <select
              className="w-full border border-gray-300 p-2 rounded"
              value={selectedProject}
              onChange={handleProjectChange}
            >
              <option value="">プロジェクトを選択してください</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              テンプレートを選択
            </label>
            <select
              className="w-full border border-gray-300 p-2 rounded"
              value={selectedTemplate}
              onChange={handleTemplateChange}
            >
              <option value="">テンプレートを選択してください</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            onClick={handleStartCreation}
            disabled={isCreating}
          >
            <FaPlay className="mr-2" />
            作成開始
          </button>
          {isCreating && (
            <div className="mt-6">
              <label className="block text-gray-700 font-medium mb-2">
                作成進捗
              </label>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalCreation;