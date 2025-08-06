import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = decodeURIComponent(params.filename)
    const filePath = path.join(process.cwd(), "temp", filename)

    console.log(`Attempting to download file: ${filePath}`)

    // Check if file exists
    try {
      const stats = await fs.stat(filePath)
      console.log(`File found, size: ${stats.size} bytes`)
    } catch (error) {
      console.error(`File not found: ${filePath}`)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)

    // Get the file extension to set proper content type
    const extension = filename.split(".").pop()?.toLowerCase()
    const contentType = getContentType(extension || "")

    // Clean filename for download (remove processing ID and sanitize)
    let cleanFilename = filename.replace(/^[a-f0-9-]+_/, "")
    
    // Sanitize filename to remove problematic characters for HTTP headers
    cleanFilename = sanitizeFilename(cleanFilename)

    console.log(`Serving file: ${cleanFilename}, type: ${contentType}, size: ${fileBuffer.length}`)

    // Create response with proper headers
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })

    // Clean up file after 5 minutes
    setTimeout(async () => {
      try {
        await fs.unlink(filePath)
        console.log(`Cleaned up file: ${filePath}`)
      } catch (error) {
        console.error("Failed to cleanup file:", error)
      }
    }, 300000) // 5 minutes

    return response
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function sanitizeFilename(filename: string): string {
  // Replace problematic characters while keeping the essence of the filename
  return filename
    .replace(/[🔥]/g, "Fire") // Replace fire emoji with text
    .replace(/[⚡]/g, "Lightning") // Replace lightning emoji with text
    .replace(/[💥]/g, "Boom") // Replace explosion emoji with text
    .replace(/[✨]/g, "Sparkle") // Replace sparkle emoji with text
    .replace(/[🌟]/g, "Star") // Replace star emoji with text
    .replace(/[🎬]/g, "Movie") // Replace movie emoji with text
    .replace(/[🎥]/g, "Camera") // Replace camera emoji with text
    .replace(/[📺]/g, "TV") // Replace TV emoji with text
    .replace(/[🏀]/g, "Basketball") // Replace basketball emoji with text
    .replace(/[⭐]/g, "Star") // Replace star emoji with text
    .replace(/[🎯]/g, "Target") // Replace target emoji with text
    .replace(/[🚀]/g, "Rocket") // Replace rocket emoji with text
    .replace(/[💫]/g, "Dizzy") // Replace dizzy emoji with text
    .replace(/[🌈]/g, "Rainbow") // Replace rainbow emoji with text
    .replace(/[🎊]/g, "Confetti") // Replace confetti emoji with text
    .replace(/[🎉]/g, "Party") // Replace party emoji with text
    // Remove any remaining emojis or special Unicode characters
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "")
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    // Trim whitespace
    .trim()
}

function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    webm: "video/webm",
    flv: "video/x-flv",
    wmv: "video/x-ms-wmv",
    m4v: "video/x-m4v",
    srt: "text/plain",
    vtt: "text/vtt",
    ass: "text/plain",
  }

  return contentTypes[extension] || "application/octet-stream"
}
