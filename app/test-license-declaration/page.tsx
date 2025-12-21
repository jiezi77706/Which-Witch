'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LicenseTypeSelector from '@/components/whichwitch/license-type-selector';
import LicenseDeclarationLink from '@/components/whichwitch/license-declaration-link';
import { generateLicenseDeclaration, generateLicenseSummary } from '@/lib/services/license-declaration.service';

export default function TestLicenseDeclarationPage() {
  const [licenseType, setLicenseType] = useState('ALL_RIGHTS_RESERVED');
  const [generatedDeclaration, setGeneratedDeclaration] = useState<string>('');

  const handleGeneratePreview = () => {
    const declarationData = {
      workId: 'test-work-123',
      workTitle: '测试作品标题',
      workType: '数字插画',
      authorName: '测试作者',
      walletAddress: '0x1234567890123456789012345678901234567890',
      licenseType: licenseType,
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
          <p className="text-gray-600">测试授权类型选择器和声明书生成功能</p>
        </div>

        {/* 授权类型选择器测试 */}
        <Card>
          <CardHeader>
            <CardTitle>1. 授权类型选择器</CardTitle>
          </CardHeader>
          <CardContent>
            <LicenseTypeSelector
              value={licenseType}
              onChange={setLicenseType}
            />
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">当前选择:</h4>
              <p><strong>类型:</strong> {licenseType}</p>
              <p><strong>摘要:</strong> {generateLicenseSummary(licenseType)}</p>
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
              licenseType={licenseType}
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
                        licenseType: licenseType
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