"use client"

import { useState } from "react"
import { AuthView } from "./auth-view"
import { UploadView } from "./upload-view"
import { SquareView } from "./square-view"
import { CommunityView } from "./community-view"
import { MarketplaceView } from "./marketplace-view"
import { CollectionsView } from "./collections-view"
import { ProfileView } from "./profile-view"
import { UploadResultPage } from "./upload-result-page"
import { BlockchainUploadProgress } from "./blockchain-upload-progress"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Upload, Grid, Bookmark, User, ShoppingCart, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { works as initialWorks } from "@/lib/mock-data"

export type UserProfile = {
  did: string
  name: string
  bio: string
  skills: string[]
}

export function WhichwitchApp() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("square")
  const [folders, setFolders] = useState(["Inspiration", "To Remix", "Favorites", "Research"])
  const [preselectedParentWork, setPreselectedParentWork] = useState<number | null>(null)
  
  // 上传结果页面状态
  const [showUploadResult, setShowUploadResult] = useState(false)
  const [uploadWorkData, setUploadWorkData] = useState<any>(null)
  
  // 区块链上传进度页面状态
  const [showBlockchainUpload, setShowBlockchainUpload] = useState(false)
  const [blockchainUploadData, setBlockchainUploadData] = useState<any>(null)

  // 处理上传工作流
  const handleAddWork = (uploadData: any) => {
    // 检查是否是上传数据（需要进入进度页面）还是完成结果（显示结果页面）
    if (uploadData.files && uploadData.workData) {
      // 这是上传数据，显示区块链上传进度页面
      setBlockchainUploadData(uploadData)
      setShowBlockchainUpload(true)
    } else {
      // 这是完成结果，显示上传结果页面
      setUploadWorkData({
        id: uploadData.work?.workId,
        title: uploadData.work?.title || 'Untitled',
        image: uploadData.work?.imageUrl || '/placeholder.svg',
        creator: user?.did || 'Unknown'
      })
      setShowUploadResult(true)
    }
    console.log('Add work:', uploadData)
  }

  // 处理区块链上传完成
  const handleBlockchainUploadComplete = (result: any) => {
    setShowBlockchainUpload(false)
    setBlockchainUploadData(null)
    
    // 直接跳转到广场，不显示结果页面
    setActiveTab("square")
  }

  // 处理区块链上传取消
  const handleBlockchainUploadCancel = () => {
    setShowBlockchainUpload(false)
    setBlockchainUploadData(null)
    setActiveTab("upload")
  }

  const handleCollect = async (workId: number, folderName: string) => {
    // 这个函数现在不需要了，因为 square-view 和 collections-view 都使用 useCollections hook
    console.log('Collect work:', workId, folderName)
  }

  const handleUnsave = async (workId: number) => {
    // 这个函数现在不需要了，因为 collections-view 使用 useCollections hook
    console.log('Unsave work:', workId)
  }

  const handleCreateFolder = (name: string) => {
    if (!folders.includes(name)) {
      setFolders((prev) => [...prev, name])
    }
  }

  if (!user) {
    return <AuthView onLogin={setUser} />
  }

  // 显示区块链上传进度页面
  if (showBlockchainUpload && blockchainUploadData) {
    return (
      <BlockchainUploadProgress
        uploadData={blockchainUploadData}
        onComplete={handleBlockchainUploadComplete}
        onCancel={handleBlockchainUploadCancel}
      />
    )
  }

  // 显示上传结果页面
  if (showUploadResult && uploadWorkData) {
    console.log('🎯 Rendering UploadResultPage with:', { showUploadResult, uploadWorkData });
    return (
      <UploadResultPage
        workData={uploadWorkData}
        onBackToSquare={() => {
          setShowUploadResult(false)
          setActiveTab("square")
        }}
        onRetry={() => {
          setShowUploadResult(false)
          setActiveTab("upload")
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-4 sticky top-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-md flex items-center justify-center">
            <Image
              src="/logos/whichwitch-logo.jpg"
              alt="Whichwitch Logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-bold text-xl tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 hidden sm:block">
            Whichwitch
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          <DesktopNavButton
            active={activeTab === "square"}
            onClick={() => setActiveTab("square")}
            icon={Grid}
            label="Square"
          />
          <DesktopNavButton
            active={activeTab === "community"}
            onClick={() => setActiveTab("community")}
            icon={Users}
            label="Community"
          />
          <DesktopNavButton
            active={activeTab === "marketplace"}
            onClick={() => setActiveTab("marketplace")}
            icon={ShoppingCart}
            label="Marketplace"
          />
          <DesktopNavButton
            active={activeTab === "collections"}
            onClick={() => setActiveTab("collections")}
            icon={Bookmark}
            label="Saved"
          />
          <DesktopNavButton
            active={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
            icon={Upload}
            label="Create"
          />
          <DesktopNavButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            icon={User}
            label="Profile"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20">
            {user.did.slice(0, 6)}...{user.did.slice(-4)}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-600 border border-white/20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 pb-24 md:pb-6 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <TabsContent value="upload" className="mt-0 max-w-2xl mx-auto">
                <UploadView 
                  user={user} 
                  onAddWork={handleAddWork}
                  preselectedParentWorkId={preselectedParentWork}
                  onClearPreselection={() => setPreselectedParentWork(null)}
                />
              </TabsContent>
              <TabsContent value="square" className="mt-0">
                <SquareView
                  onCollect={handleCollect}
                  folders={folders}
                  onCreateFolder={handleCreateFolder}
                />
              </TabsContent>
              <TabsContent value="community" className="mt-0">
                <CommunityView />
              </TabsContent>
              <TabsContent value="marketplace" className="mt-0">
                <MarketplaceView />
              </TabsContent>
              <TabsContent value="collections" className="mt-0">
                <CollectionsView
                  onUnsave={handleUnsave}
                  folders={folders}
                  onCreateFolder={handleCreateFolder}
                  onUploadRemix={(workId) => {
                    setPreselectedParentWork(workId)
                    setActiveTab("upload")
                  }}
                  onUploadWork={(workData) => {
                    console.log('🎯 onUploadWork called with workData:', workData);
                    // 触发上传结果页面
                    const uploadData = {
                      id: workData.id,
                      title: workData.title || 'Remix Work',
                      image: workData.image || '/placeholder.svg',
                      creator: user?.did || 'Unknown'
                    };
                    console.log('🎯 Setting uploadWorkData:', uploadData);
                    setUploadWorkData(uploadData);
                    console.log('🎯 Setting showUploadResult to true');
                    setShowUploadResult(true);
                  }}
                />
              </TabsContent>
              <TabsContent value="profile" className="mt-0">
                <ProfileView 
                  user={user} 
                  onContinueCreating={(workId) => {
                    setPreselectedParentWork(workId)
                    setActiveTab("upload")
                  }}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/90 backdrop-blur-xl z-50 pb-safe">
        <div className="flex justify-around p-2">
          <NavButton
            active={activeTab === "square"}
            onClick={() => setActiveTab("square")}
            icon={Grid}
            label="Square"
          />
          <NavButton
            active={activeTab === "community"}
            onClick={() => setActiveTab("community")}
            icon={Users}
            label="Community"
          />
          <NavButton
            active={activeTab === "marketplace"}
            onClick={() => setActiveTab("marketplace")}
            icon={ShoppingCart}
            label="Market"
          />
          <NavButton
            active={activeTab === "collections"}
            onClick={() => setActiveTab("collections")}
            icon={Bookmark}
            label="Saved"
          />
          <NavButton
            active={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
            icon={Upload}
            label="Create"
          />
          <NavButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            icon={User}
            label="Profile"
          />
        </div>
      </div>
    </div>
  )
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: any
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 w-16 rounded-lg transition-all duration-300 ${
        active ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon
        className={`w-6 h-6 mb-1 transition-all ${active ? "fill-current drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : ""}`}
      />
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
  )
}

function DesktopNavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: any
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
        active
          ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? "fill-current" : ""}`} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
