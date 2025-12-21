'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ExternalLink, Plus, FileText } from 'lucide-react';
import { generateLicenseSummary, LicenseSelection } from '@/lib/services/license-declaration.service';
import { toast } from 'sonner';

interface LicenseDeclarationLinkProps {
  workId: string;
  workTitle: string;
  workType: string;
  authorName: string;
  walletAddress: string;
  currentUserWallet?: string;
  // 从work_licenses表获取的许可证信息
  licenseCode?: string;
  licenseName?: string;
  commercialUse?: string;
  derivativeWorks?: string;
  nftMinting?: string;
  shareAlike?: string;
  className?: string;
}

export default function LicenseDeclarationLink({
  workId,
  workTitle,
  workType,
  authorName,
  walletAddress,
  currentUserWallet,
  licenseCode,
  licenseName,
  commercialUse,
  derivativeWorks,
  nftMinting,
  shareAlike,
  className = ''
}: LicenseDeclarationLinkProps) {
  const [hasDeclaration, setHasDeclaration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const isAuthor = currentUserWallet?.toLowerCase() === walletAddress.toLowerCase();

  useEffect(() => {
    checkDeclarationExists();
  }, [workId]);

  const checkDeclarationExists = async () => {
    try {
      const response = await fetch(`/api/license-declaration?workId=${workId}`);
      const data = await response.json();
      setHasDeclaration(data.success);
    } catch (error) {
      console.error('检查声明书失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDeclaration = async () => {
    // 构建licenseSelection对象从work_licenses数据
    if (!commercialUse || !derivativeWorks || !nftMinting || !shareAlike) {
      toast.error('许可证信息不完整，请先设置作品的授权类型');
      return;
    }

    const licenseSelection = {
      commercial: commercialUse,
      derivative: derivativeWorks,
      nft: nftMinting,
      shareAlike: shareAlike,
      licenseCode: licenseCode || 'CUSTOM',
      licenseName: licenseName || 'Custom License',
      description: licenseName || 'Custom License'
    };

    setGenerating(true);
    try {
      const response = await fetch('/api/license-declaration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workId,
          workTitle,
          workType,
          authorName,
          walletAddress,
          licenseSelection
        }),
      });

      const data = await response.json();

      if (data.success) {
        setHasDeclaration(true);
        toast.success('授权声明书生成成功！');
      } else {
        toast.error(data.error || '生成失败');
      }
    } catch (error) {
      console.error('生成声明书失败:', error);
      toast.error('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const hasLicenseInfo = licenseCode && licenseName && commercialUse && derivativeWorks && nftMinting && shareAlike;
  
  const licenseSummary = hasLicenseInfo 
    ? `${licenseCode} - ${licenseName}`
    : '未设置授权';

  // 如果没有许可证信息，不显示任何内容
  if (!hasLicenseInfo) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 授权类型显示 */}
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-blue-500" />
        <span className="text-sm text-gray-600">授权类型:</span>
        <Badge variant="secondary">
          {licenseSummary}
        </Badge>
      </div>

      {/* 声明书链接或生成按钮 */}
      {hasDeclaration ? (
        <Link href={`/license-declaration/${workId}`}>
          <Button variant="outline" size="sm" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            作品授权声明 (Author's License Declaration)
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        </Link>
      ) : (
        <>
          {isAuthor ? (
            <Button
              variant="outline"
              size="sm"
              onClick={generateDeclaration}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                  生成中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  生成授权声明书
                </>
              )}
            </Button>
          ) : (
            <div className="text-sm text-gray-500 italic">
              作者尚未生成授权声明书
            </div>
          )}
        </>
      )}

      {/* 授权说明 */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <strong>{licenseName}</strong>
        <br />
        <div className="flex gap-2 mt-1">
          <span className="text-xs px-1.5 py-0.5 bg-background rounded border">
            {commercialUse === 'A1' ? '✓ 商用' : 
             commercialUse === 'A2' ? '✗ 非商用' : 
             '⚠ 需授权'}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-background rounded border">
            {derivativeWorks === 'B1' ? '✓ 二创' : '✗ 禁止二创'}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-background rounded border">
            {nftMinting === 'C1' ? '✓ NFT' : '✗ 禁止NFT'}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-background rounded border">
            {shareAlike === 'D1' ? 'SA' : 'No SA'}
          </span>
        </div>
      </div>
    </div>
  );
}