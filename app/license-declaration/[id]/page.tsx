'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, ExternalLink, Shield, Clock, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface LicenseDeclaration {
  id: string;
  workId: string;
  workTitle: string;
  workType: string;
  authorName: string;
  walletAddress: string;
  licenseType: string;
  content: string;
  contentHash?: string;
  createdAt: string;
}

export default function LicenseDeclarationPage() {
  const params = useParams();
  const [declaration, setDeclaration] = useState<LicenseDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeclaration();
  }, [params.id]);

  const fetchDeclaration = async () => {
    try {
      const response = await fetch(`/api/license-declaration?workId=${params.id}`);
      const data = await response.json();

      if (data.success) {
        setDeclaration(data.declaration);
      } else {
        setError(data.error || '获取声明书失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!declaration) return;
    
    try {
      await navigator.clipboard.writeText(declaration.content);
      toast.success('声明书内容已复制到剪贴板');
    } catch (err) {
      toast.error('复制失败');
    }
  };

  const downloadDeclaration = () => {
    if (!declaration) return;

    const blob = new Blob([declaration.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${declaration.workTitle}-授权声明.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('声明书已下载');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !declaration) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">声明书不存在</h1>
            <p className="text-gray-600">{error || '未找到相关的授权声明书'}</p>
          </div>
          <Button onClick={() => window.history.back()}>
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部信息 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                作品授权声明书
              </h1>
              <p className="text-gray-600">
                《{declaration.workTitle}》的官方授权声明
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                复制
              </Button>
              <Button variant="outline" size="sm" onClick={downloadDeclaration}>
                <Download className="h-4 w-4 mr-2" />
                下载
              </Button>
            </div>
          </div>

          {/* 元信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">授权类型</span>
                </div>
                <Badge variant="secondary">{declaration.licenseType}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">生成时间</span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(declaration.createdAt).toLocaleString('zh-CN')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">作者地址</span>
                </div>
                <p className="text-sm text-gray-600 font-mono">
                  {formatAddress(declaration.walletAddress)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 声明书内容 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              授权声明内容
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-gray-700 mt-6 mb-3">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-gray-600">
                      {children}
                    </ul>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-800">
                      {children}
                    </strong>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  )
                }}
              >
                {declaration.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* 底部操作 */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            返回作品
          </Button>
          <Button asChild>
            <a href={`/app/work/${declaration.workId}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              查看作品
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}