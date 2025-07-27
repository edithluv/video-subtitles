"use client"

import type React from "react"

import { Card } from "../components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react"

interface Step {
  id: number
  name: string
  icon: React.ComponentType<any>
  description: string
}

interface ProcessingStepsProps {
  steps: Step[]
  currentStep: number
  status: "idle" | "processing" | "completed" | "error"
}

export default function ProcessingSteps({ steps, currentStep, status }: ProcessingStepsProps) {
  const getStepStatus = (stepId: number) => {
    if (status === "error" && stepId === currentStep) return "error"
    if (stepId < currentStep) return "completed"
    if (stepId === currentStep && status === "processing") return "processing"
    if (stepId === currentStep && status === "completed") return "completed"
    return "pending"
  }

  const getStepIcon = (step: Step, stepStatus: string) => {
    const IconComponent = step.icon

    switch (stepStatus) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Circle className="h-5 w-5 text-slate-400" />
    }
  }

  const getStepBadge = (stepStatus: string) => {
    switch (stepStatus) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Processing
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.id)
        const isActive = step.id === currentStep

        return (
          <Card key={step.id} className={`p-4 transition-all ${isActive ? "ring-2 ring-blue-200 bg-blue-50" : ""}`}>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">{getStepIcon(step, stepStatus)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">{step.name}</h3>
                  {getStepBadge(stepStatus)}
                </div>
                <p className="text-sm text-slate-600 mt-1">{step.description}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
