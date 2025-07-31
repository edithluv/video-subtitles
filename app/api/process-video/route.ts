import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { promises as fs } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File
    const settings = JSON.parse(formData.get("settings") as string)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create unique processing ID
    const processingId = uuidv4()
    const tempDir = path.join(process.cwd(), "temp")

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true })

    // Save uploaded file
    const originalName = file.name
    const fileExtension = originalName.split(".").pop() || "mp4"
    const baseName = originalName.replace(/\.[^/.]+$/, "")
    const inputPath = path.join(tempDir, `${processingId}_input.${fileExtension}`)

    const arrayBuffer = await file.arrayBuffer()
    await fs.writeFile(inputPath, new Uint8Array(arrayBuffer))

    // Process video using Python script
    const outputFileName = `${baseName}_subtitled.${fileExtension}`
    const outputPath = path.join(tempDir, `${processingId}_${outputFileName}`)

    const apiKey = process.env.ASSEMBLYAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AssemblyAI API key not configured" }, { status: 500 })
    }

    // Call Python script
    const pythonProcess = spawn("python3", [path.join(process.cwd(), "video_processor.py"), inputPath], {
      env: {
        ...process.env,
        ASSEMBLYAI_API_KEY: apiKey,
      },
    })

    let output = ""
    let error = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString()
    })

    // Wait for Python script to complete
    await new Promise((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve(code)
        } else {
          reject(new Error(`Python script failed with code ${code}: ${error}`))
        }
      })
    })

    // Clean up input file
    await fs.unlink(inputPath)

    return NextResponse.json({
      success: true,
      processingId,
      downloadUrl: `/api/download/${processingId}_${encodeURIComponent(outputFileName)}`,
      originalFileName: originalName,
      outputFileName: outputFileName,
    })
  } catch (error) {
    console.error("Processing error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process video",
      },
      { status: 500 },
    )
  }
}

// Increase timeout for video processing
export const maxDuration = 300 // 5 minutes
