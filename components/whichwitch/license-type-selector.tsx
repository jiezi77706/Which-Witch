'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  DollarSign, 
  Users, 
  Share, 
  Lock, 
  Info,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { LICENSE_TYPES, LicenseTypeInfo } from '@/lib/services/license-declaration.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LicenseTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function LicenseTypeSelector({
  value,
  onChange,
  className = ''
}: LicenseTypeSelectorProps) {
  const [showChatbot, setShowChatbot] = useState(false);

  const getLicenseIcon = (licenseInfo: LicenseTypeInfo) => {
    if (licenseInfo.code === '保留全部权利') {
      return <Lock className="h-4 w-4 text-red-500" />;
    }
    if (licenseInfo.allowCommercial) {
      return <DollarSign className="h-4 w-4 text-green-500" />;
    }
    return <Share className="h-4 w-4 text-blue-500" />;
  };

  const getPermissionBadges = (licenseInfo: LicenseTypeInfo) => {
    const badges = [];
    
    if (licenseInfo.allowCommercial) {
      badges.push(
        <Badge key="commercial" variant="secondary" className="text-xs">
          <DollarSign className="h-3 w-3 mr-1" />
          商用
        </Badge>
      );
    }
    
    if (licenseInfo.allowDerivatives) {
      badges.push(
        <Badge key="derivatives" variant="secondary" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          二创
        </Badge>
      );
    }
    
    if (licenseInfo.requireShareAlike) {
      badges.push(
        <Badge key="sharealike" variant="secondary" className="text-xs">
          <Share className="h-3 w-3 mr-1" />
          相同授权
        </Badge>
      );
    }

    return badges;
  };

  const ChatbotDialog = () => (
    <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            授权类型选择助手
          </DialogTitle>
          <DialogDescription>
            回答几个简单问题，我们帮您选择最合适的授权类型
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">🤔 您希望他人如何使用您的作品？</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange('CC_BY');
                  setShowChatbot(false);
                }}
                className="w-full justify-start"
              >
                我希望作品被广泛使用，包括商业用途，只要注明我的姓名
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange('CC_BY_NC');
                  setShowChatbot(false);
                }}
                className="w-full justify-start"
              >
                我允许非商业使用和二次创作，但不允许商业用途
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange('CC_BY_NC_SA');
                  setShowChatbot(false);
                }}
                className="w-full justify-start"
              >
                我允许非商业使用，但衍生作品必须采用相同授权
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange('ALL_RIGHTS_RESERVED');
                  setShowChatbot(false);
                }}
                className="w-full justify-start"
              >
                我想保留全部权利，严格控制作品使用
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">💡 常见场景推荐</h4>
            <div className="text-sm space-y-2">
              <div><strong>个人作品集:</strong> 推荐 CC BY-NC（允许非商业使用）</div>
              <div><strong>开源项目:</strong> 推荐 CC BY（允许商业使用）</div>
              <div><strong>商业作品:</strong> 推荐 保留全部权利</div>
              <div><strong>教育资源:</strong> 推荐 CC BY-SA（要求相同授权）</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium">选择授权类型</h3>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>授权类型决定了他人如何使用您的作品</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChatbot(true)}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            选择助手
          </Button>
        </div>
      </div>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid gap-4">
          {Object.entries(LICENSE_TYPES).map(([key, licenseInfo]) => (
            <Card 
              key={key} 
              className={`cursor-pointer transition-all ${
                value === key ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => onChange(key)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                    {getLicenseIcon(licenseInfo)}
                    <span className="font-medium">{licenseInfo.code}</span>
                  </Label>
                  <div className="flex gap-1 ml-auto">
                    {getPermissionBadges(licenseInfo)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {licenseInfo.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {licenseInfo.description}
                  </p>
                  
                  {/* 权限说明 */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      licenseInfo.allowCommercial 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {licenseInfo.allowCommercial ? '✓ 允许商用' : '✗ 禁止商用'}
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      licenseInfo.allowDerivatives 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {licenseInfo.allowDerivatives ? '✓ 允许二创' : '✗ 禁止二创'}
                    </span>
                    {licenseInfo.requireShareAlike && (
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                        ⚠ 需相同授权
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      <div className="mt-4 p-4 bg-amber-50 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>重要提醒:</strong> 
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>授权类型一旦设置并生成声明书后不可更改</li>
              <li>所有授权类型都禁止用于AI训练和恶意使用</li>
              <li>声明书将记录在区块链上作为法律证据</li>
            </ul>
          </div>
        </div>
      </div>

      <ChatbotDialog />
    </div>
  );
}