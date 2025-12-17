"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Scale } from "lucide-react"
import { LicenseSelectorModal, type LicenseSelection } from "./license-selector-modal"

interface LicenseSelectorButtonProps {
  onLicenseSelect: (license: LicenseSelection) => void
  initialSelection?: LicenseSelection
  size?: "sm" | "default" | "lg"
}

export function LicenseSelectorButton({ 
  onLicenseSelect, 
  initialSelection,
  size = "default" 
}: LicenseSelectorButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSave = (license: LicenseSelection) => {
    onLicenseSelect(license)
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsModalOpen(true)}
        size={size}
        variant="outline"
        className="gap-2"
      >
        <Scale className="w-4 h-4" />
        License Options
      </Button>

      <LicenseSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialSelection={initialSelection}
      />
    </>
  )
}
