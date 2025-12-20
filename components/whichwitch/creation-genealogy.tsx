'use client'

import { useState, useEffect } from 'react'
import { GitFork, Users, Crown, Sparkles } from 'lucide-react'
import { getWorkGenealogy } from '@/lib/supabase/services/work.service'

interface Work {
  work_id: number
  title: string
  creator_address: string
  created_at: string
  image_url?: string
  creation_type?: string
}

interface GenealogyData {
  root: Work | null
  continuations: Work[]
  derivatives: Work[]
  totalDerivatives: number
}

interface CreationGenealogyProps {
  workId: number
  workTitle: string
  className?: string
}

export function CreationGenealogy({ workId, workTitle, className = '' }: CreationGenealogyProps) {
  const [genealogy, setGenealogy] = useState<GenealogyData>({
    root: null,
    continuations: [],
    derivatives: [],
    totalDerivatives: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGenealogy = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getWorkGenealogy(workId)
      setGenealogy(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load genealogy')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workId) {
      loadGenealogy()
    }
  }, [workId])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GitFork className="w-5 h-5 text-primary" />
          Creation Chain
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
          <span className="text-muted-foreground">Loading creation chain...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <GitFork className="w-5 h-5 text-primary" />
          Creation Chain
        </h3>
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">Failed to load creation chain</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const hasDerivatives = genealogy.continuations.length > 0 || genealogy.derivatives.length > 0
  const allWorks = [
    { ...genealogy.root, type: 'root' },
    ...genealogy.continuations.map(w => ({ ...w, type: 'continuation' })),
    ...genealogy.derivatives.map(w => ({ ...w, type: 'derivative' }))
  ].filter(Boolean)

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <GitFork className="w-5 h-5 text-primary" />
        Creation Chain
      </h3>

      {/* Statistics */}
      {hasDerivatives && (
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Official:</span>
            <span className="font-medium text-foreground">{genealogy.continuations.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Community:</span>
            <span className="font-medium text-foreground">{genealogy.derivatives.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium text-foreground">{genealogy.totalDerivatives}</span>
          </div>
        </div>
      )}

      {/* Node Tree with Single Line */}
      <div className="relative">
        {allWorks.length > 0 && (
          <div className="relative">
            {/* Main vertical line */}
            {hasDerivatives && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-primary/60 to-primary/20"></div>
            )}
            
            <div className="space-y-6">
              {/* Root Work */}
              <div className="relative flex items-center">
                {/* Root node */}
                <div className="relative z-10 w-12 h-12 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                  <Crown className="w-6 h-6 text-primary-foreground" />
                </div>
                
                {/* Work info */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-3 p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center shrink-0">
                      {genealogy.root?.image_url ? (
                        <img 
                          src={genealogy.root.image_url} 
                          alt={genealogy.root.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Sparkles className="w-5 h-5 text-primary/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {genealogy.root?.title || workTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        by {genealogy.root?.creator_address ? formatAddress(genealogy.root.creator_address) : 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {genealogy.root?.created_at ? formatDate(genealogy.root.created_at) : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Continuations */}
              {genealogy.continuations.map((work, index) => (
                <div key={`cont-${work.work_id}`} className="relative flex items-center">
                  {/* Branch line */}
                  <div className="absolute left-6 top-6 w-6 h-0.5 bg-primary/40"></div>
                  
                  {/* Continuation node */}
                  <div className="relative z-10 w-12 h-12 bg-primary/80 rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                    <Crown className="w-5 h-5 text-primary-foreground" />
                  </div>
                  
                  {/* Work info */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-3 p-3 bg-background/30 backdrop-blur-sm rounded-lg border border-border/30">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center shrink-0">
                        {work.image_url ? (
                          <img 
                            src={work.image_url} 
                            alt={work.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GitFork className="w-5 h-5 text-primary/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{work.title}</p>
                        <p className="text-xs text-muted-foreground">
                          by {formatAddress(work.creator_address)} • {formatDate(work.created_at)}
                        </p>
                        <p className="text-xs text-primary/70">Official Continuation</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Community Derivatives */}
              {genealogy.derivatives.map((work, index) => (
                <div key={`deriv-${work.work_id}`} className="relative flex items-center">
                  {/* Branch line */}
                  <div className="absolute left-6 top-6 w-6 h-0.5 bg-primary/40"></div>
                  
                  {/* Derivative node */}
                  <div className="relative z-10 w-12 h-12 bg-primary/60 rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                    <Users className="w-5 h-5 text-primary-foreground" />
                  </div>
                  
                  {/* Work info */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-3 p-3 bg-background/30 backdrop-blur-sm rounded-lg border border-border/30">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center shrink-0">
                        {work.image_url ? (
                          <img 
                            src={work.image_url} 
                            alt={work.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GitFork className="w-5 h-5 text-primary/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{work.title}</p>
                        <p className="text-xs text-muted-foreground">
                          by {formatAddress(work.creator_address)} • {formatDate(work.created_at)}
                        </p>
                        <p className="text-xs text-primary/70">Community Derivative</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasDerivatives && (
          <div className="text-center py-8 text-muted-foreground">
            <GitFork className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">No derivatives yet</p>
            <p className="text-xs">This work hasn't been remixed by anyone yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}