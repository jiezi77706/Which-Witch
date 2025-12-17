"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Info } from "lucide-react"

interface LicenseSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (license: LicenseSelection) => void
  initialSelection?: LicenseSelection
}

export interface LicenseSelection {
  commercial: string // A1, A2, A3
  derivative: string // B1, B2
  nft: string // C1, C2
  shareAlike: string // D1, D2
  licenseCode: string
  licenseName: string
  description: string
}

const LICENSE_MAPPING: Record<string, LicenseSelection> = {
  "A1-B1-C1-D2": {
    commercial: "A1",
    derivative: "B1",
    nft: "C1",
    shareAlike: "D2",
    licenseCode: "CC BY",
    licenseName: "CC BY - Attribution",
    description: "Commercial use, derivatives, and NFT minting allowed"
  },
  "A2-B1-C2-D2": {
    commercial: "A2",
    derivative: "B1",
    nft: "C2",
    shareAlike: "D2",
    licenseCode: "CC BY-NC",
    licenseName: "CC BY-NC - Non-Commercial",
    description: "Non-commercial derivatives allowed, no secondary NFT"
  },
  "A2-B1-C2-D1": {
    commercial: "A2",
    derivative: "B1",
    nft: "C2",
    shareAlike: "D1",
    licenseCode: "CC BY-NC-SA",
    licenseName: "CC BY-NC-SA - ShareAlike",
    description: "Non-commercial derivatives with same license required"
  },
  "A1-B1-C2-D2": {
    commercial: "A1",
    derivative: "B1",
    nft: "C2",
    shareAlike: "D2",
    licenseCode: "CC BY-NoNFT",
    licenseName: "CC BY + No Secondary NFT",
    description: "Commercial and derivatives allowed, no blockchain minting"
  },
  "A3-B1-C2-D2": {
    commercial: "A3",
    derivative: "B1",
    nft: "C2",
    shareAlike: "D2",
    licenseCode: "CC BY-NC-CR",
    licenseName: "CC BY-NC + Commercial Reserved",
    description: "Free derivatives, commercial use requires permission"
  },
  "A2-B2-C2-D2": {
    commercial: "A2",
    derivative: "B2",
    nft: "C2",
    shareAlike: "D2",
    licenseCode: "ARR",
    licenseName: "All Rights Reserved",
    description: "Display only - no derivatives or commercial use"
  },
  "A1-B2-C2-D2": {
    commercial: "A1",
    derivative: "B2",
    nft: "C2",
    shareAlike: "D2",
    licenseCode: "CCD",
    licenseName: "Custom Commercial Display",
    description: "Commercial use allowed but no derivatives"
  },
  "A1-B1-C1-D1": {
    commercial: "A1",
    derivative: "B1",
    nft: "C1",
    shareAlike: "D1",
    licenseCode: "CC BY-SA",
    licenseName: "CC BY-SA - ShareAlike",
    description: "Commercial derivatives allowed, must use same license"
  },
  "A1-B1-C1-D2-CC0": {
    commercial: "A1",
    derivative: "B1",
    nft: "C1",
    shareAlike: "D2",
    licenseCode: "CC0",
    licenseName: "CC0 - Public Domain",
    description: "Copyright waived - free for any use"
  }
}

export function LicenseSelectorModal({ isOpen, onClose, onSave, initialSelection }: LicenseSelectorModalProps) {
  const [commercial, setCommercial] = useState(initialSelection?.commercial || "A1")
  const [derivative, setDerivative] = useState(initialSelection?.derivative || "B1")
  const [nft, setNft] = useState(initialSelection?.nft || "C1")
  const [shareAlike, setShareAlike] = useState(initialSelection?.shareAlike || "D2")

  useEffect(() => {
    if (initialSelection) {
      setCommercial(initialSelection.commercial)
      setDerivative(initialSelection.derivative)
      setNft(initialSelection.nft)
      setShareAlike(initialSelection.shareAlike)
    }
  }, [initialSelection])

  const getLicenseInfo = (): LicenseSelection => {
    const key = `${commercial}-${derivative}-${nft}-${shareAlike}`
    const specialCC0Key = `${commercial}-${derivative}-${nft}-${shareAlike}-CC0`
    
    return LICENSE_MAPPING[specialCC0Key] || LICENSE_MAPPING[key] || {
      commercial,
      derivative,
      nft,
      shareAlike,
      licenseCode: "CUSTOM",
      licenseName: "Custom License",
      description: "Custom license configuration"
    }
  }

  const handleSave = () => {
    const licenseInfo = getLicenseInfo()
    onSave(licenseInfo)
    onClose()
  }

  const currentLicense = getLicenseInfo()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">License Options</DialogTitle>
          <DialogDescription>
            Select your licensing preferences for this work
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Commercial Use */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">A. Commercial Use</Label>
            <RadioGroup value={commercial} onValueChange={setCommercial}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="A1" id="A1" />
                <Label htmlFor="A1" className="flex-1 cursor-pointer">
                  <span className="font-medium">A1 - Commercial Use Allowed</span>
                  <p className="text-xs text-muted-foreground">Others can use your work for commercial purposes</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="A2" id="A2" />
                <Label htmlFor="A2" className="flex-1 cursor-pointer">
                  <span className="font-medium">A2 - Non-Commercial Only</span>
                  <p className="text-xs text-muted-foreground">Work can only be used for non-commercial purposes</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="A3" id="A3" />
                <Label htmlFor="A3" className="flex-1 cursor-pointer">
                  <span className="font-medium">A3 - Authorization Required</span>
                  <p className="text-xs text-muted-foreground">Commercial use requires separate permission</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Derivative Works */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">B. Derivative Works</Label>
            <RadioGroup value={derivative} onValueChange={setDerivative}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="B1" id="B1" />
                <Label htmlFor="B1" className="flex-1 cursor-pointer">
                  <span className="font-medium">B1 - Derivatives Allowed</span>
                  <p className="text-xs text-muted-foreground">Others can create derivative works</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="B2" id="B2" />
                <Label htmlFor="B2" className="flex-1 cursor-pointer">
                  <span className="font-medium">B2 - No Derivatives</span>
                  <p className="text-xs text-muted-foreground">No modifications or derivative works allowed</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* NFT Minting */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">C. NFT Minting</Label>
            <RadioGroup value={nft} onValueChange={setNft}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="C1" id="C1" />
                <Label htmlFor="C1" className="flex-1 cursor-pointer">
                  <span className="font-medium">C1 - NFT Minting Allowed</span>
                  <p className="text-xs text-muted-foreground">Derivative works can be minted as NFTs</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="C2" id="C2" />
                <Label htmlFor="C2" className="flex-1 cursor-pointer">
                  <span className="font-medium">C2 - No Secondary NFT</span>
                  <p className="text-xs text-muted-foreground">Prohibit any form of secondary NFT minting</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* ShareAlike */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">D. ShareAlike Requirement</Label>
            <RadioGroup value={shareAlike} onValueChange={setShareAlike}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="D1" id="D1" />
                <Label htmlFor="D1" className="flex-1 cursor-pointer">
                  <span className="font-medium">D1 - ShareAlike Required (SA)</span>
                  <p className="text-xs text-muted-foreground">Derivative works must use the same license</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="D2" id="D2" />
                <Label htmlFor="D2" className="flex-1 cursor-pointer">
                  <span className="font-medium">D2 - No ShareAlike</span>
                  <p className="text-xs text-muted-foreground">Derivative works can use different licenses</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-primary mb-1">Selected License:</p>
                <p className="font-bold text-lg">{currentLicense.licenseName}</p>
                <p className="text-sm text-muted-foreground mt-1">{currentLicense.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{commercial}</Badge>
                  <Badge variant="outline">{derivative}</Badge>
                  <Badge variant="outline">{nft}</Badge>
                  <Badge variant="outline">{shareAlike}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your license choice will be stored on-chain and cannot be changed after minting. 
                Choose carefully based on how you want others to use your work.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save License
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
