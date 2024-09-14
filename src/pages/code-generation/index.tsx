tsx
import { useState, useEffect } from 'react';
import Topbar from '@/components/Topbar';
import supabase from '@/supabase';
import { useRouter } from 'next/router';
import axios from 'axios';
import { FaPlay, FaHome, FaFileAlt, FaCode } from 'react-icons/fa';

const Sidebar: React.FC = () => {
    return (
        <div className="w-64 bg-white border-r min-h-screen">
            <nav className="mt-10">
                <a href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                    <FaHome className="mr-2" />
                    ダッシュボード
                </a>
                <a href="/code-generation" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                    <FaCode className="mr-2" />
                    ソースコード生成
                </a>
                <a href="/document-generation" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                    <FaFileAlt className="mr-2" />
                    ドキュメント生成
                </a>
            </nav>
        </div>
    );
};

const CodeGeneration: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
    const [languages] = useState<string[]>(['Python', 'JavaScript', 'TypeScript', 'Java']);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            }
        };

        const fetchDocuments = async () => {
            let { data, error } = await supabase.from('documents').select('*');
            if (error || !data) {
                console.error('ドキュメントの取得に失敗しました', error);
                setDocuments([
                    { id: '1', content: { title: '要件定義書' } },
                    { id: '2', content: { title: 'システム設計書' } },
                ]);
            } else {
                setDocuments(data);
            }
        };

        checkAuth();
        fetchDocuments();
    }, [router]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setProgress(0);

        try {
            const response = await axios.post('/api/code-generation', {
                documentId: selectedDocumentId,
                language: selectedLanguage,
            });

            const { generationId } = response.data;

            const interval = setInterval(async () => {
                try {
                    const progressResponse = await axios.get(`/api/code-generation/${generationId}/progress`);
                    const { progress } = progressResponse.data;
                    setProgress(progress);

                    if (progress >= 100) {
                        clearInterval(interval);
                        router.push('/source-code-display');
                    }
                } catch (error) {
                    console.error('進捗の取得に失敗しました', error);
                    clearInterval(interval);
                    setIsGenerating(false);
                }
            }, 2000);
        } catch (error) {
            console.error('生成の開始に失敗しました', error);
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen h-full">
            <Topbar />
            <div className="flex">
                <Sidebar />
                <div className="flex-1 container mx-auto py-8">
                    <img src="https://placehold.co/600x200?text=ソースコード生成" alt="ソースコード生成" className="w-full mb-4" />
                    <h1 className="text-2xl font-bold mb-4">ソースコード生成</h1>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">生成対象のドキュメントを選択</label>
                        <div className="relative">
                            <select
                                value={selectedDocumentId}
                                onChange={(e) => setSelectedDocumentId(e.target.value)}
                                className="appearance-none w-full bg-white border-b-2 border-gray-400 text-gray-700 py-2 px-4 leading-tight focus:outline-none focus:border-blue-500"
                            >
                                <option value="">ドキュメントを選択してください</option>
                                {documents.map((doc) => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.content.title || 'ドキュメント'}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                ▼
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">生成するプログラミング言語を選択</label>
                        <div className="relative">
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="appearance-none w-full bg-white border-b-2 border-gray-400 text-gray-700 py-2 px-4 leading-tight focus:outline-none focus:border-blue-500"
                            >
                                <option value="">プログラミング言語を選択してください</option>
                                {languages.map((lang, index) => (
                                    <option key={index} value={lang}>
                                        {lang}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                ▼
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !selectedDocumentId || !selectedLanguage}
                            className={`bg-blue-500 text-white font-medium py-2 px-4 rounded focus:outline-none inline-flex items-center ${isGenerating || !selectedDocumentId || !selectedLanguage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                        >
                            <FaPlay className="mr-2" />
                            生成開始
                        </button>
                    </div>

                    {isGenerating && (
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">生成進捗</label>
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

export default CodeGeneration;