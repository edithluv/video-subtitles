"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileVideo,
  Download,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  FileAudio,
  Subtitles,
  Video,
} from "lucide-react"
import FileUpload from "@/components/file-upload"
import ProcessingSteps from "@/components/processing-steps"
import SettingsPanel from "@/components/settings-panel"
import StatusDisplay from "@/components/status-display"

export default function VideoSubtitleApp() {
  const [file, setFile] = useState<File | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    subtitleFormat: "srt",
    burnSubtitles: true,
    language: "auto",
    fontSize: "medium",
  })

  const steps = [
    { id: 1, name: "Audio Extraction", icon: FileAudio, description: "Extracting audio from video" },
    { id: 2, name: "Upload to AssemblyAI", icon: Upload, description: "Uploading audio for processing" },
    { id: 3, name: "Transcription", icon: Subtitles, description: "Generating subtitles from audio" },
    { id: 4, name: "Subtitle Export", icon: Download, description: "Exporting subtitle file" },
    { id: 5, name: "Video Processing", icon: Video, description: "Burning subtitles into video" },
  ]

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setOriginalFileName(selectedFile.name)
    setStatus("idle")
    setError(null)
    setOutputUrl(null)
    setCurrentStep(0)
    setProgress(0)
  }, [])

  const processVideo = async () => {
    if (!file) return

    setIsProcessing(true)
    setStatus("processing")
    setError(null)
    setCurrentStep(0)
    setProgress(0)

    try {
      // Create FormData for the API call
      const formData = new FormData()
      formData.append("video", file)
      formData.append("settings", JSON.stringify(settings))

      // Simulate the processing steps
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i + 1)

        // Simulate API call to backend
        await new Promise((resolve) => setTimeout(resolve, 2000))

        setProgress(((i + 1) / steps.length) * 100)
      }

      // Generate the output filename with proper extension
      const fileExtension = originalFileName.split(".").pop() || "mp4"
      const baseName = originalFileName.replace(/\.[^/.]+$/, "")
      const outputFileName = `${baseName}_subtitled.${fileExtension}`

      // Simulate successful completion with proper filename
      setStatus("completed")
      setOutputUrl(`/api/download/${encodeURIComponent(outputFileName)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during processing")
      setStatus("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetApp = () => {
    setFile(null)
    setOriginalFileName("")
    setStatus("idle")
    setError(null)
    setOutputUrl(null)
    setCurrentStep(0)
    setProgress(0)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Video Subtitle Generator</h1>
          <p className="text-slate-600 text-lg">Automatically generate and burn subtitles into your videos using AI</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload and Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileVideo className="h-5 w-5" />
                  Upload Video
                </CardTitle>
                <CardDescription>Select a video file to generate subtitles</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileSelect={handleFileSelect} selectedFile={file} />
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SettingsPanel settings={settings} onSettingsChange={setSettings} disabled={isProcessing} />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={processVideo} disabled={!file || isProcessing} className="w-full" size="lg">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generate Subtitles
                  </>
                )}
              </Button>

              {status === "completed" && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    size="lg"
                    onClick={() => {
                      // Create a demo file for download
                      const originalName = file?.name || "video.mp4"
                      const fileExtension = originalName.split(".").pop() || "mp4"
                      const baseName = originalName.replace(/\.[^/.]+$/, "")
                      const outputFileName = `${baseName}_subtitled.${fileExtension}`

                      // Create a blob with demo content
                      const demoContent = `This is a demo file. In production, this would be your processed video with subtitles.

Original file: ${originalName}
Output file: ${outputFileName}
Settings used: ${JSON.stringify(settings, null, 2)}

To make this work with real video processing:
1. Deploy to a platform that supports Python and ffmpeg
2. Set up the ASSEMBLYAI_API_KEY environment variable
3. The backend will process your video and return the actual file

For now, this demonstrates the UI/UX flow.`

                      const blob = new Blob([demoContent], { type: "text/plain" })
                      const url = URL.createObjectURL(blob)

                      const a = document.createElement("a")
                      a.href = url
                      a.download = `${outputFileName}.txt`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Demo File (Text)
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    Demo mode: Downloads a text file. Deploy with Python backend for actual video processing.
                  </p>
                </div>
              )}

              {(file || status !== "idle") && (
                <Button variant="ghost" onClick={resetApp} className="w-full" disabled={isProcessing}>
                  Start Over
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Processing and Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Display */}
            <StatusDisplay file={file} status={status} progress={progress} error={error} />

            {/* Processing Steps */}
            {(isProcessing || status === "completed" || status === "error") && (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Steps</CardTitle>
                  <CardDescription>Track the progress of your video subtitle generation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProcessingSteps steps={steps} currentStep={currentStep} status={status} />
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {status === "completed" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your video has been successfully processed with subtitles! You can now download the final video.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pt-8">
          <p>Powered by AssemblyAI • Supports MP4, MOV, AVI, MKV, WebM, FLV, WMV</p>
        </div>
      </div>
    </div>
  )
}
