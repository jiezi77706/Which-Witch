'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Check } from 'lucide-react'

export default function TestDropdown() {
  return (
    <div className="container mx-auto p-6 max-w-md">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dropdown Menu 测试</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600">测试 dropdown-menu 组件是否正常工作：</p>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                选择选项
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Check className="mr-2 h-4 w-4" />
                选项 1
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Check className="mr-2 h-4 w-4" />
                选项 2
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Check className="mr-2 h-4 w-4" />
                选项 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              ✅ 如果你能看到上面的下拉菜单并且可以点击，说明 dropdown-menu 组件工作正常！
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}