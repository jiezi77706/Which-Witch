"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { AIAdvisorModal } from "./ai-advisor-modal"

interface AIAdvisorButtonProps {
  workData?: {
    title?: string
    description?: string
    tags?: string[]
    material?: string[]
    allowRemix?: boolean
    licenseFee?: string
  }
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
}

export function AIAdvisorButton({ 
  workData, 
  className = "",
  variant = "outline",
  size = "default"
}: AIAdvisorButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={`${className} bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-blue-500/30 hover:border-blue-500/50 hover:from-blue-500/20 hover:to-purple-600/20 text-blue-600 transition-all duration-300`}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        AI Licensing Advisor
      </Button>

      <AIAdvisorModal
        open={showModal}
        onOpenChange={setShowModal}
        workData={workData}
      />
    </>
  )
}