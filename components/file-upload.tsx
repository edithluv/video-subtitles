"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileVideo, X } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
}

export default function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const videoFile = files.find((file) => file.type.startsWith("video/"))

      if (videoFile) {
        onFileSelect(videoFile)
      }
    },
    [onFileSelect],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (selectedFile) {
    return (
      <Card className="p-4 border-2 border-dashed border-green-200 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileVideo className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-green-900">{selectedFile.name}</p>
              <p className="text-sm text-green-700">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFileSelect(null as any)}
            className="text-green-700 hover:text-green-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
        isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center space-y-4">
        <Upload className={`h-12 w-12 mx-auto ${isDragOver ? "text-blue-500" : "text-slate-400"}`} />
        <div>
          <p className="text-lg font-medium text-slate-900">Drop your video file here</p>
          <p className="text-sm text-slate-500">or click to browse</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {["MP4", "MOV", "AVI", "MKV", "WebM"].map((format) => (
            <Badge key={format} variant="secondary" className="text-xs">
              {format}
            </Badge>
          ))}
        </div>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </Card>
  )
}
