import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = decodeURIComponent(params.filename)
    const filePath = path.join(process.cwd(), "temp", filename)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)

    // Get the file extension to set proper content type
    const extension = filename.split(".").pop()?.toLowerCase()
    const contentType = getContentType(extension || "")

    // Clean filename for download (remove processing ID)
    const cleanFilename = filename.replace(/^[a-f0-9-]+_/, "")

    const response = new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${cleanFilename}"`,
        "Cache-Control": "no-cache",
      },
    })

    // Clean up file after sending (optional)
    // You might want to implement a cleanup job instead
    setTimeout(async () => {
      try {
        await fs.unlink(filePath)
      } catch (error) {
        console.error("Failed to cleanup file:", error)
      }
    }, 60000) // Delete after 1 minute

    return response
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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
    srt: "text/plain",
    vtt: "text/vtt",
    ass: "text/plain",
  }

  return contentTypes[extension] || "application/octet-stream"
}
