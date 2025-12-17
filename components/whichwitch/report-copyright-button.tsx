"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Flag } from "lucide-react"
import { CopyrightDisputeModal } from "./copyright-dispute-modal"
import { useAccount } from "wagmi"
import { useToast } from "@/lib/hooks/use-toast"

interface ReportCopyrightButtonProps {
  accusedWorkId: number
  accusedWorkTitle: string
  accusedWorkImage: string
  accusedAddress: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}

export function ReportCopyrightButton({
  accusedWorkId,
  accusedWorkTitle,
  accusedWorkImage,
  accusedAddress,
  size = "default",
  variant = "outline"
}: ReportCopyrightButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSelectingWork, setIsSelectingWork] = useState(false)
  const [userWorks, setUserWorks] = useState<any[]>([])
  const [selectedOriginalWork, setSelectedOriginalWork] = useState<any>(null)
  const { address } = useAccount()
  const { toast } = useToast()

  const handleOpenModal = async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to report copyright infringement",
        variant: "destructive"
      })
      return
    }

    // Fetch user's works
    setIsSelectingWork(true)
    try {
      const response = await fetch(`/api/works?creator=${address}`)
      const data = await response.json()
      
      if (data.works && data.works.length > 0) {
        setUserWorks(data.works)
        setIsModalOpen(true)
      } else {
        toast({
          title: "No Works Found",
          description: "You need to have uploaded works to report copyright infringement",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch works:', error)
      toast({
        title: "Error",
        description: "Failed to load your works",
        variant: "destructive"
      })
    } finally {
      setIsSelectingWork(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        size={size}
        variant={variant}
        className="gap-2"
        disabled={isSelectingWork}
      >
        <Flag className="w-4 h-4" />
        Report Copyright
      </Button>

      {selectedOriginalWork && (
        <CopyrightDisputeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedOriginalWork(null)
          }}
          originalWorkId={selectedOriginalWork.work_id}
          originalWorkTitle={selectedOriginalWork.title}
          originalWorkImage={selectedOriginalWork.image_url}
          accusedWorkId={accusedWorkId}
          accusedWorkTitle={accusedWorkTitle}
          accusedWorkImage={accusedWorkImage}
          accusedAddress={accusedAddress}
          reporterAddress={address!}
        />
      )}

      {/* Work Selection Modal */}
      {isModalOpen && !selectedOriginalWork && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Select Your Original Work</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which of your works is being infringed upon
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                {userWorks.map((work) => (
                  <div
                    key={work.work_id}
                    onClick={() => setSelectedOriginalWork(work)}
                    className="cursor-pointer group border-2 border-transparent hover:border-primary rounded-lg overflow-hidden transition-all"
                  >
                    <div className="aspect-square bg-muted">
                      <img 
                        src={work.image_url} 
                        alt={work.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 bg-muted/50 group-hover:bg-primary/10 transition-colors">
                      <p className="font-medium text-sm truncate">{work.title}</p>
                      <p className="text-xs text-muted-foreground">ID: {work.work_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
