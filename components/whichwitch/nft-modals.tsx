"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Coins, ShoppingCart, Tag, Loader2, CheckCircle, AlertCircle } from "lucide-react"

// NFT铸造模态框
export function MintNFTModal({ 
  open, 
  onOpenChange, 
  work, 
  onMint 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  work: any
  onMint: (tokenURI: string) => Promise<void>
}) {
  const [tokenURI, setTokenURI] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleMint = async () => {
    if (!tokenURI.trim()) {
      setErrorMessage("Please enter a token URI")
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrorMessage("")

    try {
      await onMint(tokenURI.trim())
      setStatus("success")
      setTimeout(() => {
        onOpenChange(false)
        setStatus("idle")
        setTokenURI("")
      }, 2000)
    } catch (error) {
      console.error("Mint failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to mint NFT")
      setStatus("error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-500" />
            Mint NFT
          </DialogTitle>
          <DialogDescription>
            Create an NFT representing ownership of "{work?.title}"
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">NFT Minted Successfully!</h3>
            <p className="text-muted-foreground text-sm">
              Your work is now tokenized and ready for trading.
            </p>
          </div>
        ) : status === "error" ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50 flex items-center gap-3">
              <div className="w-12 h-12 bg-background rounded-md overflow-hidden border border-border">
                <img 
                  src={work?.image || "/placeholder.svg"} 
                  className="w-full h-full object-cover" 
                  alt={work?.title}
                />
              </div>
              <div>
                <p className="font-bold text-sm">{work?.title}</p>
                <p className="text-xs text-muted-foreground">by {work?.author}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Token Metadata URI</Label>
              <Input
                placeholder="https://ipfs.io/ipfs/..."
                value={tokenURI}
                onChange={(e) => setTokenURI(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                IPFS or HTTP URL pointing to the NFT metadata JSON
              </p>
            </div>

            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <h4 className="text-sm font-bold text-purple-700 mb-2">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Your work becomes a tradeable NFT</li>
                <li>• You can list it for sale on the marketplace</li>
                <li>• Royalties from future sales go to creator chain</li>
              </ul>
            </div>
          </div>
        )}

        {status === "error" ? (
          <DialogFooter>
            <Button onClick={() => setStatus("idle")} variant="outline">
              Try Again
            </Button>
          </DialogFooter>
        ) : (
          status !== "success" && (
            <DialogFooter>
              <Button 
                onClick={handleMint} 
                disabled={status === "loading" || !tokenURI.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Mint NFT
                  </>
                )}
              </Button>
            </DialogFooter>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

// NFT购买模态框
export function BuyNFTModal({ 
  open, 
  onOpenChange, 
  work, 
  price,
  onBuy 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  work: any
  price: string
  onBuy: () => Promise<void>
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleBuy = async () => {
    setStatus("loading")
    setErrorMessage("")

    try {
      await onBuy()
      setStatus("success")
      setTimeout(() => {
        onOpenChange(false)
        setStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Purchase failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to purchase NFT")
      setStatus("error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-500" />
            Purchase NFT
          </DialogTitle>
          <DialogDescription>
            Buy ownership of "{work?.title}" NFT
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Purchase Successful!</h3>
            <p className="text-muted-foreground text-sm">
              You now own this NFT. Royalties were distributed to creators.
            </p>
          </div>
        ) : status === "error" ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50 flex items-center gap-3">
              <div className="w-12 h-12 bg-background rounded-md overflow-hidden border border-border">
                <img 
                  src={work?.image || "/placeholder.svg"} 
                  className="w-full h-full object-cover" 
                  alt={work?.title}
                />
              </div>
              <div>
                <p className="font-bold text-sm">{work?.title}</p>
                <p className="text-xs text-muted-foreground">by {work?.author}</p>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Purchase Price</span>
                <span className="text-lg font-bold text-green-600">{price} ETH</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Seller (70%)</span>
                  <span>{(parseFloat(price) * 0.7).toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Original Creator (20%)</span>
                  <span>{(parseFloat(price) * 0.2).toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Creator Chain (10%)</span>
                  <span>{(parseFloat(price) * 0.1).toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-2">
                  <span>Platform Fee (2.5%)</span>
                  <span>{(parseFloat(price) * 0.025).toFixed(4)} ETH</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="text-sm font-bold text-blue-700 mb-2">Instant Royalty Distribution</h4>
              <p className="text-xs text-muted-foreground">
                All royalties are distributed instantly to creators upon purchase. No waiting period.
              </p>
            </div>
          </div>
        )}

        {status === "error" ? (
          <DialogFooter>
            <Button onClick={() => setStatus("idle")} variant="outline">
              Try Again
            </Button>
          </DialogFooter>
        ) : (
          status !== "success" && (
            <DialogFooter>
              <Button 
                onClick={handleBuy} 
                disabled={status === "loading"}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy for {price} ETH
                  </>
                )}
              </Button>
            </DialogFooter>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

// NFT上架模态框
export function ListNFTModal({ 
  open, 
  onOpenChange, 
  work, 
  onList 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  work: any
  onList: (price: string) => Promise<void>
}) {
  const [price, setPrice] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleList = async () => {
    if (!price || parseFloat(price) <= 0) {
      setErrorMessage("Please enter a valid price")
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrorMessage("")

    try {
      await onList(price)
      setStatus("success")
      setTimeout(() => {
        onOpenChange(false)
        setStatus("idle")
        setPrice("")
      }, 2000)
    } catch (error) {
      console.error("Listing failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to list NFT")
      setStatus("error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-500" />
            List NFT for Sale
          </DialogTitle>
          <DialogDescription>
            Set a price for your "{work?.title}" NFT
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Listed Successfully!</h3>
            <p className="text-muted-foreground text-sm">
              Your NFT is now available for purchase on the marketplace.
            </p>
          </div>
        ) : status === "error" ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50 flex items-center gap-3">
              <div className="w-12 h-12 bg-background rounded-md overflow-hidden border border-border">
                <img 
                  src={work?.image || "/placeholder.svg"} 
                  className="w-full h-full object-cover" 
                  alt={work?.title}
                />
              </div>
              <div>
                <p className="font-bold text-sm">{work?.title}</p>
                <p className="text-xs text-muted-foreground">by {work?.author}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sale Price (ETH)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0.1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-8 font-mono"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Ξ</span>
              </div>
            </div>

            {price && parseFloat(price) > 0 && (
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="text-sm font-bold text-blue-700 mb-2">Revenue Breakdown</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>You receive (70%)</span>
                    <span className="font-mono">{(parseFloat(price) * 0.7).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original Creator (20%)</span>
                    <span className="font-mono">{(parseFloat(price) * 0.2).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creator Chain (10%)</span>
                    <span className="font-mono">{(parseFloat(price) * 0.1).toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <h4 className="text-sm font-bold text-yellow-700 mb-1">Note</h4>
              <p className="text-xs text-muted-foreground">
                You can cancel this listing anytime. Royalties are distributed instantly upon sale.
              </p>
            </div>
          </div>
        )}

        {status === "error" ? (
          <DialogFooter>
            <Button onClick={() => setStatus("idle")} variant="outline">
              Try Again
            </Button>
          </DialogFooter>
        ) : (
          status !== "success" && (
            <DialogFooter>
              <Button 
                onClick={handleList} 
                disabled={status === "loading" || !price || parseFloat(price) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Listing...
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4 mr-2" />
                    List for {price || "0"} ETH
                  </>
                )}
              </Button>
            </DialogFooter>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}