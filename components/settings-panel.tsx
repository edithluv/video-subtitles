"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface Settings {
  subtitleFormat: string
  burnSubtitles: boolean
  language: string
  fontSize: string
}

interface SettingsPanelProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  disabled?: boolean
}

export default function SettingsPanel({ settings, onSettingsChange, disabled = false }: SettingsPanelProps) {
  const updateSetting = (key: keyof Settings, value: any) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Subtitle Format */}
      <div className="space-y-2">
        <Label htmlFor="subtitle-format">Subtitle Format</Label>
        <Select
          value={settings.subtitleFormat}
          onValueChange={(value) => updateSetting("subtitleFormat", value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="srt">SRT</SelectItem>
            <SelectItem value="vtt">WebVTT</SelectItem>
            <SelectItem value="ass">ASS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Language */}
      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select
          value={settings.language}
          onValueChange={(value) => updateSetting("language", value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="it">Italian</SelectItem>
            <SelectItem value="pt">Portuguese</SelectItem>
            <SelectItem value="ru">Russian</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
            <SelectItem value="ko">Korean</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Burn Subtitles */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="burn-subtitles">Burn Subtitles</Label>
          <p className="text-sm text-slate-500">Embed subtitles directly into the video</p>
        </div>
        <Switch
          id="burn-subtitles"
          checked={settings.burnSubtitles}
          onCheckedChange={(checked) => updateSetting("burnSubtitles", checked)}
          disabled={disabled}
        />
      </div>

      {/* Font Size (only if burning subtitles) */}
      {settings.burnSubtitles && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select
              value={settings.fontSize}
              onValueChange={(value) => updateSetting("fontSize", value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  )
}
