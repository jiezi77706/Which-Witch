'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import LicenseTypeSelector from './license-type-selector';
import { LICENSE_TYPES } from '@/lib/services/license-declaration.service';

interface LicenseSettingsModalProps {
  workId: string | number;
  currentLicenseCode?: string;
  onSaved?: () => void;
}

export default function LicenseSettingsModal({
  workId,
  currentLicenseCode,
  onSaved
}: LicenseSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(currentLicenseCode || 'CC_BY_NC');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const licenseInfo = LICENSE_TYPES[selectedLicense];
      if (!licenseInfo) {
        toast.error('无效的许可证类型');
        return;
      }

      // 将许可证类型转换为数据库格式
      const licenseData = {
        workId: Number(workId),
        commercial: licenseInfo.allowCommercial ? 'A1' : 'A2',
        derivative: licenseInfo.allowDerivatives ? 'B1' : 'B2',
        nft: licenseInfo.allowNFT ? 'C1' : 'C2',
        shareAlike: licenseInfo.requireShareAlike ? 'D1' : 'D2',
      };

      const response = await fetch('/api/license/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(licenseData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('许可证设置成功！');
        setOpen(false);
        onSaved?.();
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存许可证失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          {currentLicenseCode ? '修改授权类型' : '设置授权类型'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>设置作品授权类型</DialogTitle>
          <DialogDescription>
            选择适合您作品的授权类型。授权类型决定了他人如何使用您的作品。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <LicenseTypeSelector
            value={selectedLicense}
            onChange={setSelectedLicense}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
