import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TrainingAssignment } from "../contexts/useTrainingStore";
import { Modal } from "./Modal";

interface TrainingFlowModalProps {
  open: boolean;
  training: TrainingAssignment | null;
  onClose: () => void;
  onComplete: (result: { quizScore: number; signature: string }) => void;
}

export function TrainingFlowModal({
  open,
  training,
  onClose,
  onComplete,
}: TrainingFlowModalProps) {
  const [step, setStep] = useState(0);
  const [contentProgress, setContentProgress] = useState(0);
  const [contentComplete, setContentComplete] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.clientWidth;
    const height = rect.height || canvas.clientHeight;

    if (!width || !height) {
      return;
    }

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2;
    context.strokeStyle = '#0f172a';
    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const position = getPointerPosition(event);
    if (!position) return;

    context.beginPath();
    context.moveTo(position.x, position.y);
    setIsDrawing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const position = getPointerPosition(event);
    if (!position) return;

    context.lineTo(position.x, position.y);
    context.stroke();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    context?.closePath();
    setIsDrawing(false);

    if (typeof event.currentTarget.releasePointerCapture === 'function') {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore if pointer capture was not active
      }
    }

    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const handleClearSignature = useCallback(() => {
    setSignatureDataUrl('');
    prepareCanvas();
  }, [prepareCanvas]);

  const handleVideoLoadedMetadata = () => {
    setVideoError(null);
  };

  const handleVideoTimeUpdate = () => {
    const element = videoRef.current;
    if (!element || !element.duration || Number.isNaN(element.duration)) {
      return;
    }

    const progress = Math.min(
      100,
      Math.round((element.currentTime / element.duration) * 100)
    );
    setContentProgress(progress);

    if (progress >= 99) {
      setContentComplete(true);
    }
  };

  const handleVideoEnded = () => {
    setContentProgress(100);
    setContentComplete(true);
  };

  const handleVideoError = () => {
    setVideoError(
      "Unable to load the training video. Please try again or contact your administrator."
    );
  };

  const handleMarkContentReviewed = () => {
    setContentProgress(100);
    setContentComplete(true);
  };

  useEffect(() => {
    if (open && training) {
      setStep(0);
      setContentProgress(0);
      setContentComplete(false);
      setSelectedAnswers(new Array(training.quiz.length).fill(-1));
      setQuizScore(null);
      setQuizSubmitted(false);
      setSignatureDataUrl('');
      setQuizError(null);
      setVideoError(null);
      if (videoRef.current) {
        videoRef.current.pause();
        try {
          videoRef.current.currentTime = 0;
        } catch {
          // ignore seek issues
        }
      }
      requestAnimationFrame(() => prepareCanvas());
    }
  }, [open, training, prepareCanvas]);

  useEffect(() => {
    if (!open || !training || step !== 0) return;

    setContentProgress(0);
    setContentComplete(false);

    const shouldSimulateProgress =
      training.contentType !== "video" || !training.contentUrl;

    if (!shouldSimulateProgress) {
      return;
    }

    const durationMinutes = training.durationMinutes || 5;
    const durationMs = Math.max(1, Math.min(durationMinutes, 5)) * 1000;
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setContentProgress(progress);
      if (progress >= 100) {
        setContentComplete(true);
        clearInterval(timer);
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [open, training, step]);

  useEffect(() => {
    if (!open) return;

    const handleResize = () => prepareCanvas();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [open, prepareCanvas]);

  const handleQuizSubmit = () => {
    if (!training) return;

    if (selectedAnswers.some((value) => value === -1)) {
      setQuizError("Please answer all questions before submitting.");
      return;
    }

    const correctAnswers = selectedAnswers.reduce((total, answer, index) => {
      if (answer === training.quiz[index].correctAnswerIndex) {
        return total + 1;
      }
      return total;
    }, 0);

    const scorePercentage = Math.round(
      (correctAnswers / training.quiz.length) * 100
    );
    setQuizScore(scorePercentage);
    setQuizSubmitted(true);
    setQuizError(
      scorePercentage >= training.passPercentage
        ? null
        : `You need ${training.passPercentage}% to pass. Please review and try again.`
    );
  };

  const handleNextStep = () => {
    if (step === 0 && contentComplete) {
      setStep(1);
      return;
    }

    if (step === 1 && canAdvanceFromQuiz) {
      setStep(2);
      return;
    }

    if (step === 2 && quizScore !== null && signatureDataUrl) {
      onComplete({ quizScore, signature: signatureDataUrl });
      onClose();
    }
  };

  const modalTitle = useMemo(() => {
    if (!training) return "Training";
    return `${training.title} · ${training.contentType.toUpperCase()}`;
  }, [training]);

  const quizStepComplete =
    quizSubmitted &&
    quizScore !== null &&
    quizScore >= (training?.passPercentage ?? 80);

  const canAdvanceFromQuiz = quizStepComplete;

  const completedSegments =
    (contentComplete ? 1 : 0) +
    (quizStepComplete ? 1 : 0) +
    (signatureDataUrl ? 1 : 0);

  const activeSegmentContribution =
    !contentComplete ? (contentProgress / 100) * (100 / 3) : 0;

  const overallProgress = Math.min(
    100,
    Math.round(completedSegments * (100 / 3) + activeSegmentContribution)
  );

  const renderContentStep = () => {
    const hasVideoContent =
      training?.contentType === "video" && Boolean(training?.contentUrl);

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {hasVideoContent
              ? "Watch the training video in full."
              : training?.contentType === "pdf"
              ? "Review the PDF presentation."
              : training?.contentType === "powerpoint"
              ? "Review the PowerPoint presentation."
              : "Review the training presentation."}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {training?.durationMinutes}{" "}
            {`minute${(training?.durationMinutes || 0) > 1 ? "s" : ""}`} ·{" "}
            {training?.passPercentage}% minimum passing score
          </p>
        </div>

        {hasVideoContent ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-slate-700">
              <video
                ref={videoRef}
                src={training?.contentUrl ?? undefined}
                controls
                controlsList="nodownload"
                playsInline
                className="h-64 w-full bg-black object-contain"
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                onError={handleVideoError}
              />
            </div>
            {videoError && (
              <p className="text-xs font-semibold text-red-500">{videoError}</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-4 text-sm dark:border-slate-600 dark:bg-slate-900/40">
            <p className="text-slate-600 dark:text-slate-300">
              Open the training material and review it completely before
              continuing.
            </p>
            {training?.contentUrl ? (
              <a
                href={training.contentUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
              >
                Open training material
              </a>
            ) : (
              <p className="mt-3 text-xs text-red-500">
                No training file is attached to this course.
              </p>
            )}
            <button
              type="button"
              onClick={handleMarkContentReviewed}
              disabled={contentComplete}
              className={`mt-4 inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition ${
                contentComplete
                  ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {contentComplete ? "Content reviewed" : "Mark content as reviewed"}
            </button>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Step progress</span>
            <span>{contentProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-2 rounded-full ${
                contentComplete ? "bg-emerald-500" : "bg-primary"
              }`}
              style={{ width: `${contentProgress}%` }}
            />
          </div>
          {!contentComplete && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Finish this step to unlock the quiz.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderQuizStep = () => (
    <div className="space-y-4">
      {training?.quiz.map((question, questionIndex) => (
        <div
          key={question.question}
          className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Question {questionIndex + 1}: {question.question}
          </p>
          <div className="mt-3 space-y-2">
            {question.answers.map((answer, answerIndex) => (
              <label
                key={answer}
                className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300"
              >
                <input
                  type="radio"
                  name={`quiz-${questionIndex}`}
                  value={answerIndex}
                  checked={selectedAnswers[questionIndex] === answerIndex}
                  onChange={() => {
                    setSelectedAnswers((prev) => {
                      const next = [...prev];
                      next[questionIndex] = answerIndex;
                      return next;
                    });
                  }}
                  className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                />
                {answer}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Score:
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {quizScore !== null ? `${quizScore}%` : "--"}
          </span>
        </div>
        {quizError && <p className="text-xs text-red-500">{quizError}</p>}
        <button
          onClick={handleQuizSubmit}
          className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          {quizSubmitted ? "Recalculate score" : "Submit quiz"}
        </button>
      </div>
    </div>
  );

  const renderSignatureStep = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Certification
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          I certify that I have completed this training and understand the requirements of {training?.title}.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Sign using your finger, stylus, or mouse
        </label>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-3 dark:border-slate-600 dark:bg-slate-900/40">
          <canvas
            ref={canvasRef}
            className="h-48 w-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Use a pen-enabled device for the most accurate signature.</span>
          <button
            type="button"
            onClick={handleClearSignature}
            className="font-semibold text-primary transition hover:text-primary/80"
          >
            Clear signature
          </button>
        </div>
      </div>

      {signatureDataUrl && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Captured signature preview</p>
          <img
            src={signatureDataUrl}
            alt="Employee signature preview"
            className="mx-auto mt-2 h-20 w-full object-contain"
          />
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    if (step === 0) return renderContentStep();
    if (step === 1) return renderQuizStep();
    return renderSignatureStep();
  };

  const primaryButtonLabel =
    step === 0
      ? contentComplete
        ? "Go to quiz"
        : "Please finish the content"
      : step === 1
      ? canAdvanceFromQuiz
        ? "Go to signature"
        : "Submit quiz"
      : "Submit training";

  const primaryDisabled =
    (step === 0 && !contentComplete) ||
    (step === 1 && !canAdvanceFromQuiz) ||
    (step === 2 && !signatureDataUrl);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      description="Complete all three steps to finish this training."
    >
      <div className="pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <span className={step === 0 ? "text-primary" : "text-slate-400"}>
            1 · Content
          </span>
          <span className="text-slate-400">/</span>
          <span className={step === 1 ? "text-primary" : "text-slate-400"}>
            2 · Quiz
          </span>
          <span className="text-slate-400">/</span>
          <span className={step === 2 ? "text-primary" : "text-slate-400"}>
            3 · Signature
          </span>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Overall progress</span>
            <span>{overallProgress}% complete</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="space-y-6">{renderStep()}</div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          disabled={primaryDisabled}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
            primaryDisabled
              ? "bg-slate-300 dark:bg-slate-700"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {primaryButtonLabel}
        </button>
      </div>
    </Modal>
  );
}
