"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X, Vote, Calendar, Users, Trophy } from "lucide-react"

interface VotingOption {
  id: string
  title: string
  description: string
}

interface CreateVotingModalProps {
  isOpen: boolean
  onClose: () => void
  work: any
  onCreateVoting: (votingData: any) => void
}

export function CreateVotingModal({ isOpen, onClose, work, onCreateVoting }: CreateVotingModalProps) {
  const [votingData, setVotingData] = useState({
    title: "",
    description: "",
    duration: "7", // days
    stake: "0.01", // ETH - customizable stake amount
    deliveryDays: "30" // days - customizable delivery deadline
  })
  
  const [options, setOptions] = useState<VotingOption[]>([
    { id: "1", title: "", description: "" },
    { id: "2", title: "", description: "" }
  ])
  
  const [newOption, setNewOption] = useState({ title: "", description: "" })

  const addOption = () => {
    if (newOption.title.trim() && options.length < 5) {
      const newId = (options.length + 1).toString()
      setOptions([...options, { id: newId, title: newOption.title, description: newOption.description }])
      setNewOption({ title: "", description: "" })
    }
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id))
    }
  }

  const updateOption = (id: string, field: 'title' | 'description', value: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ))
  }

  const handleSubmit = () => {
    if (!votingData.title.trim() || options.some(opt => !opt.title.trim())) {
      alert("Please fill in all required fields")
      return
    }

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + parseInt(votingData.duration))

    const voting = {
      workId: work.id,
      title: votingData.title,
      description: votingData.description,
      options: options.filter(opt => opt.title.trim()),
      endDate: endDate.toISOString(),
      stake: votingData.stake, // User-defined stake amount
      deliveryDays: parseInt(votingData.deliveryDays), // User-defined delivery deadline
      creatorAddress: work.creator || work.author
    }

    onCreateVoting(voting)
    onClose()
    
    // Reset form
    setVotingData({ title: "", description: "", duration: "7", stake: "0.01", deliveryDays: "30" })
    setOptions([
      { id: "1", title: "", description: "" },
      { id: "2", title: "", description: "" }
    ])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5 text-primary" />
            Create Community Vote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Work Preview */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={work.image || "/placeholder.svg"} 
                    alt={work.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{work.title}</h4>
                  <p className="text-sm text-muted-foreground">by {work.author}</p>
                  <Badge variant="secondary" className="mt-1">Your Work</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="voting-title">Voting Title *</Label>
              <Input
                id="voting-title"
                placeholder="e.g., Choose the next story direction / Pick the new skin design"
                value={votingData.title}
                onChange={(e) => setVotingData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="voting-description">Description</Label>
              <Textarea
                id="voting-description"
                placeholder="Describe the context: What happens next in the story? What style should the new skin have? Help fans understand the choices..."
                value={votingData.description}
                onChange={(e) => setVotingData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Voting Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="30"
                  value={votingData.duration}
                  onChange={(e) => setVotingData(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="stake">Your Stake (ETH)</Label>
                <Input
                  id="stake"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={votingData.stake}
                  onChange={(e) => setVotingData(prev => ({ ...prev, stake: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher stakes show stronger commitment
                </p>
              </div>
              <div>
                <Label htmlFor="deliveryDays">Delivery Deadline (days)</Label>
                <Input
                  id="deliveryDays"
                  type="number"
                  min="1"
                  max="365"
                  value={votingData.deliveryDays}
                  onChange={(e) => setVotingData(prev => ({ ...prev, deliveryDays: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Days to complete after voting ends
                </p>
              </div>
            </div>
          </div>

          {/* Voting Options */}
          <div className="space-y-4">
            <Label>Voting Options (2-5 options) *</Label>
            
            {options.map((option, index) => (
              <Card key={option.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="e.g., The hero goes to the forest / Cyberpunk style skin"
                        value={option.title}
                        onChange={(e) => updateOption(option.id, 'title', e.target.value)}
                      />
                      <Input
                        placeholder="e.g., Discover ancient secrets / Neon colors with tech elements"
                        value={option.description}
                        onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                      />
                    </div>
                    {options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(option.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Option */}
            {options.length < 5 && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="New story direction / skin design idea"
                        value={newOption.title}
                        onChange={(e) => setNewOption(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <Input
                        placeholder="Describe this choice in detail"
                        value={newOption.description}
                        onChange={(e) => setNewOption(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      disabled={!newOption.title.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Voting Summary */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-600" />
                Voting Summary
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Voting: {votingData.duration} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span>Stake: {votingData.stake} ETH</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Delivery: {votingData.deliveryDays} days</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Options: {options.filter(opt => opt.title.trim()).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-muted-foreground" />
                  <span>Open to all fans</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stake Requirement */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm">
            <p className="font-medium text-orange-600 mb-1">🔒 Creator Stake Requirement</p>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between font-medium text-foreground">
                <span>Delivery Guarantee Stake:</span>
                <span>{votingData.stake} ETH</span>
              </div>
            </div>
            <div className="mt-2 p-2 bg-orange-500/5 rounded text-xs">
              <p className="text-orange-700">
                💡 <strong>Stake Purpose:</strong> This stake ensures you will deliver the winning option. 
                If you complete the work within {votingData.deliveryDays} days after voting ends, your stake will be returned. 
                If not, the stake will go to the platform reward pool.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!votingData.title.trim() || options.some(opt => !opt.title.trim())}
          >
            Create Vote ({votingData.stake} ETH Stake)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}