"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner";

interface CopyToClipboardProps {
  text: string
  className?: string
  showBackground?: boolean
}

export function CopyToClipboard({ text, className, showBackground = true }: CopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)

      toast("Copied!", {
        description: "Text copied to clipboard",
      })

      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      toast("Failed to copy", {
        description: "Could not copy text to clipboard",
      })
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 w-full",
        showBackground && "rounded-md border bg-muted p-3",
        className,
      )}
    >
      <div className="truncate text-sm text-muted-foreground">{text}</div>
      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={copyToClipboard} aria-label="Copy to clipboard">
        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}
