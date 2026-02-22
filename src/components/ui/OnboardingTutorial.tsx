import { useState, useEffect } from 'react'

const STORAGE_KEY = 'ophi-onboarding-complete'

interface TutorialStep {
  title: string
  description: string
  stepNum: string
  position: 'left' | 'center' | 'right'
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Ophi',
    description: 'Ophi translates your Python pandas code into Alteryx workflow visualizations. See exactly how each line maps to an Alteryx tool.',
    stepNum: '',
    position: 'center',
  },
  {
    title: 'Paste or Upload Code',
    description: 'Paste Python code in the left panel, upload a .py or .ipynb file, or pick one of the pre-built samples to get started.',
    stepNum: '01',
    position: 'left',
  },
  {
    title: 'Click Translate',
    description: 'Hit the blue arrow button between the panels. Ophi parses each pandas operation and maps it to the closest Alteryx tool.',
    stepNum: '02',
    position: 'center',
  },
  {
    title: 'Explore the Workflow',
    description: 'The right panel shows your code as a connected Alteryx workflow. Click any node to see details about the tool mapping.',
    stepNum: '03',
    position: 'right',
  },
  {
    title: 'Switch Views',
    description: 'Use the tabs to see a Cheat Sheet summary, smart Recommendations, or your original code with Alteryx annotations inline.',
    stepNum: '04',
    position: 'right',
  },
]

export function OnboardingTutorial() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setVisible(true)
    }
  }, [])

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={handleClose} />

      {/* Card */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] overflow-hidden animate-node-in
          ${current.position === 'left' ? 'mr-auto ml-[5%]' : ''}
          ${current.position === 'right' ? 'ml-auto mr-[5%]' : ''}
        `}
      >
        {/* Progress bar */}
        <div className="h-1 bg-surface-alt">
          <div
            className="h-full bg-duke-gradient transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step indicator or logo */}
          {current.stepNum ? (
            <div className="text-[10px] font-black tracking-widest text-white bg-duke inline-block px-2 py-0.5 mb-3">
              STEP {current.stepNum}
            </div>
          ) : (
            <img src="/ophi-logo-80-retina.png" alt="Ophi" className="w-10 h-10 mb-3" />
          )}

          {/* Content */}
          <h2 className="text-lg font-black text-text-primary mb-2">{current.title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">{current.description}</p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === step ? 'bg-duke w-5' : i < step ? 'bg-duke/40' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step === 0 ? (
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  Skip
                </button>
              ) : (
                <button
                  onClick={handleBack}
                  className="px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-md text-sm font-semibold bg-duke-gradient text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {isLast ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
}
