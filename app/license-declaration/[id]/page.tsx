'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Download, Share2, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LicenseDeclaration {
  id: string;
  workId: string;
  workTitle: string;
  workType: string;
  authorName: string;
  walletAddress: string;
  licenseSelection: {
    commercial: string;
    derivative: string;
    nft: string;
    shareAlike: string;
    licenseCode: string;
    licenseName: string;
    description: string;
  };
  content: string;
  contentHash?: string;
  createdAt: string;
}

export default function LicenseDeclarationPage() {
  const params = useParams();
  const workId = params.id as string;
  
  const [declaration, setDeclaration] = useState<LicenseDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeclaration();
  }, [workId]);

  const fetchDeclaration = async () => {
    try {
      const response = await fetch(`/api/license-declaration?workId=${workId}`);
      const data = await response.json();

      if (data.success) {
        setDeclaration(data.declaration);
      } else {
        setError(data.error || '未找到授权声明');
      }
    } catch (err) {
      console.error('获取授权声明失败:', err);
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!declaration) return;

    const blob = new Blob([declaration.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-declaration-${workId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('声明书已下载');
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${declaration?.workTitle} - 授权声明`,
          text: '查看作品授权声明',
          url: url
        });
      } catch (err) {
        // 用户取消分享
      }
    } else {
      // 复制链接
      navigator.clipboard.writeText(url);
      toast.success('链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !declaration) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-500 text-lg">
                {error || '未找到授权声明'}
              </div>
              <Button onClick={() => window.history.back()}>
                返回
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const license = declaration.licenseSelection;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 头部信息 */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold">作品授权声明</h1>
              <p className="text-sm text-gray-500">Author's License Declaration</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              下载
            </Button>
          </div>
        </div>

        {/* 作品信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">作品信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">作品名称：</span>
                <span className="font-medium">{declaration.workTitle}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">作品类型：</span>
                <span className="font-medium">{declaration.workType}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">作者：</span>
                <span className="font-medium">{declaration.authorName}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">作品ID：</span>
                <span className="font-mono text-sm">{declaration.workId}</span>
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500">授权类型：</span>
                <Badge variant="secondary" className="text-sm">
                  {license.licenseCode}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{license.licenseName}</p>
              <p className="text-xs text-gray-500 mt-1">{license.description}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Badge variant={license.commercial === 'A1' ? 'default' : 'outline'}>
                {license.commercial === 'A1' ? '✓ 商用' : '✗ 非商用'}
              </Badge>
              <Badge variant={license.derivative === 'B1' ? 'default' : 'outline'}>
                {license.derivative === 'B1' ? '✓ 二创' : '✗ 禁止二创'}
              </Badge>
              <Badge variant={license.nft === 'C1' ? 'default' : 'outline'}>
                {license.nft === 'C1' ? '✓ NFT' : '✗ 禁止NFT'}
              </Badge>
              <Badge variant={license.shareAlike === 'D1' ? 'default' : 'outline'}>
                {license.shareAlike === 'D1' ? 'SA' : 'No SA'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 区块链验证状态 */}
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          <span>此声明已记录在区块链上，具有法律效力</span>
          {declaration.contentHash && (
            <a 
              href={`https://ipfs.io/ipfs/${declaration.contentHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-blue-600 hover:underline"
            >
              查看链上证明
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* 声明书内容 */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {declaration.content}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 页脚信息 */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>声明生成时间：{new Date(declaration.createdAt).toLocaleString('zh-CN')}</p>
        <p className="mt-1">本声明由 WhichWitch 平台自动生成，具有法律效力</p>
      </div>
    </div>
  );
}
