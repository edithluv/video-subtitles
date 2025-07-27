"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Progress } from "../components/ui/progress"
import { Badge } from "../components/ui/badge"
import { FileVideo, CheckCircle, AlertCircle, Loader2, Upload } from "lucide-react"

interface StatusDisplayProps {
  file: File | null
  status: "idle" | "processing" | "completed" | "error"
  progress: number
  error: string | null
}

export default function StatusDisplay({ file, status, progress, error }: StatusDisplayProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Upload className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Ready</Badge>
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "processing":
        return "Your video is being processed. This may take a few minutes depending on the video length."
      case "completed":
        return "Your video has been successfully processed with subtitles!"
      case "error":
        return error || "An error occurred during processing."
      default:
        return file
          ? 'Video file selected. Click "Generate Subtitles" to start processing.'
          : "Select a video file to get started."
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Status
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {file && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <FileVideo className="h-6 w-6 text-slate-600" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{file.name}</p>
              <p className="text-sm text-slate-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
        )}

        <p className="text-slate-600">{getStatusMessage()}</p>

        {status === "completed" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> This UI demonstrates the complete workflow. To process actual videos, deploy
              with the Python backend and set up your AssemblyAI API key.
            </p>
          </div>
        )}

        {status === "processing" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
