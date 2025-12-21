'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LicenseDeclarationLink from '@/components/whichwitch/license-declaration-link';
import { generateLicenseDeclaration, generateLicenseSummary, LicenseSelection } from '@/lib/services/license-declaration.service';

export default function TestLicenseDeclarationPage() {
  // 模拟许可证选择数据
  const [licenseSelection] = useState<LicenseSelection>({
    commercial: 'A2',
    derivative: 'B1',
    nft: 'C2',
    shareAlike: 'D1',
    licenseCode: 'CC BY-NC-SA',
    licenseName: 'CC BY-NC-SA - ShareAlike',
    description: 'Non-commercial derivatives allowed, must use same license'
  });
  
  const [generatedDeclaration, setGeneratedDeclaration] = useState<string>('');

  const handleGeneratePreview = () => {
    const declarationData = {
      workId: 'test-work-123',
      workTitle: '测试作品标题',
      workType: '数字插画',
      authorName: '测试作者',
      walletAddress: '0x1234567890123456789012345678901234567890',
      licenseSelection: licenseSelection,
      createdAt: new Date()
    };

    const declaration = generateLicenseDeclaration(declarationData);
    setGeneratedDeclaration(declaration);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">授权声明书功能测试</h1>
          <p className="text-gray-600">测试基于现有许可证选择的声明书生成功能</p>
        </div>

        {/* 许可证选择数据展示 */}
        <Card>
          <CardHeader>
            <CardTitle>1. 当前许可证选择数据</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>许可证代码:</strong> {licenseSelection.licenseCode}</p>
              <p><strong>许可证名称:</strong> {licenseSelection.licenseName}</p>
              <p><strong>描述:</strong> {licenseSelection.description}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <strong>商业使用:</strong> {licenseSelection.commercial === 'A1' ? '✅ 允许' : '❌ 禁止'}
                </div>
                <div>
                  <strong>衍生作品:</strong> {licenseSelection.derivative === 'B1' ? '✅ 允许' : '❌ 禁止'}
                </div>
                <div>
                  <strong>NFT铸造:</strong> {licenseSelection.nft === 'C1' ? '✅ 允许' : '❌ 禁止'}
                </div>
                <div>
                  <strong>相同授权:</strong> {licenseSelection.shareAlike === 'D1' ? '⚠️ 要求' : '✅ 不要求'}
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">摘要显示:</h4>
                <p>{generateLicenseSummary(licenseSelection)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 声明书预览生成 */}
        <Card>
          <CardHeader>
            <CardTitle>2. 声明书预览生成</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGeneratePreview} className="mb-4">
              生成声明书预览
            </Button>
            
            {generatedDeclaration && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                <h4 className="font-medium mb-2">生成的声明书:</h4>
                <pre className="text-sm whitespace-pre-wrap">{generatedDeclaration}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 授权声明链接组件测试 */}
        <Card>
          <CardHeader>
            <CardTitle>3. 授权声明链接组件</CardTitle>
          </CardHeader>
          <CardContent>
            <LicenseDeclarationLink
              workId="test-work-123"
              workTitle="测试作品标题"
              workType="数字插画"
              authorName="测试作者"
              walletAddress="0x1234567890123456789012345678901234567890"
              currentUserWallet="0x1234567890123456789012345678901234567890"
              licenseSelection={licenseSelection}
            />
          </CardContent>
        </Card>

        {/* API测试 */}
        <Card>
          <CardHeader>
            <CardTitle>4. API测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/license-declaration', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        workId: 'test-work-123',
                        workTitle: '测试作品标题',
                        workType: '数字插画',
                        authorName: '测试作者',
                        walletAddress: '0x1234567890123456789012345678901234567890',
                        licenseSelection: licenseSelection
                      }),
                    });
                    
                    const data = await response.json();
                    console.log('API Response:', data);
                    alert(data.success ? '声明书创建成功！' : `创建失败: ${data.error}`);
                  } catch (error) {
                    console.error('API Error:', error);
                    alert('API调用失败');
                  }
                }}
              >
                测试创建声明书API
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/license-declaration?workId=test-work-123');
                    const data = await response.json();
                    console.log('API Response:', data);
                    alert(data.success ? '声明书获取成功！' : `获取失败: ${data.error}`);
                  } catch (error) {
                    console.error('API Error:', error);
                    alert('API调用失败');
                  }
                }}
              >
                测试获取声明书API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}