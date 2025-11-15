import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
export function TrainingFlowModal({ open, training, onClose, onComplete, }) {
    const [step, setStep] = useState(0);
    const [contentProgress, setContentProgress] = useState(0);
    const [contentComplete, setContentComplete] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState([]);
    const [quizScore, setQuizScore] = useState(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [signature, setSignature] = useState("");
    const [quizError, setQuizError] = useState(null);
    useEffect(() => {
        if (open && training) {
            setStep(0);
            setContentProgress(0);
            setContentComplete(false);
            setSelectedAnswers(new Array(training.quiz.length).fill(-1));
            setQuizScore(null);
            setQuizSubmitted(false);
            setSignature("");
            setQuizError(null);
        }
    }, [open, training]);
    useEffect(() => {
        if (!open || !training || step !== 0)
            return;
        setContentProgress(0);
        setContentComplete(false);
        const durationMs = Math.min(training.durationMinutes, 5) * 1000;
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
    const canAdvanceFromQuiz = quizSubmitted &&
        quizScore !== null &&
        quizScore >= (training?.passPercentage ?? 80);
    const handleQuizSubmit = () => {
        if (!training)
            return;
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
        const scorePercentage = Math.round((correctAnswers / training.quiz.length) * 100);
        setQuizScore(scorePercentage);
        setQuizSubmitted(true);
        setQuizError(scorePercentage >= training.passPercentage
            ? null
            : `You need ${training.passPercentage}% to pass. Please review and try again.`);
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
        if (step === 2 && quizScore !== null && signature.trim().length >= 3) {
            onComplete({ quizScore, signature: signature.trim() });
            onClose();
        }
    };
    const modalTitle = useMemo(() => {
        if (!training)
            return "Training";
        return `${training.title} · ${training.contentType.toUpperCase()}`;
    }, [training]);
    const renderContentStep = () => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: training?.contentType === "video"
                            ? "Watch the training video in full."
                            : training?.contentType === "pdf"
                                ? "Review the PDF presentation."
                                : "Review the training presentation." }), _jsxs("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: [training?.durationMinutes, " ", `minute${(training?.durationMinutes || 0) > 1 ? "s" : ""}`, " \u00B7", " ", training?.passPercentage, "% minimum passing score"] })] }), _jsxs("div", { children: [_jsxs("div", { className: "mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [contentProgress, "%"] })] }), _jsx("div", { className: "h-2 rounded-full bg-slate-200 dark:bg-slate-800", children: _jsx("div", { className: `h-2 rounded-full ${contentComplete ? "bg-emerald-500" : "bg-primary"}`, style: { width: `${contentProgress}%` } }) }), !contentComplete && (_jsx("p", { className: "mt-2 text-xs text-slate-500 dark:text-slate-400", children: "Keep this window open. The next step unlocks after the content is marked as viewed." }))] })] }));
    const renderQuizStep = () => (_jsxs("div", { className: "space-y-4", children: [training?.quiz.map((question, questionIndex) => (_jsxs("div", { className: "rounded-2xl border border-slate-200 p-4 dark:border-slate-700", children: [_jsxs("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: ["Question ", questionIndex + 1, ": ", question.question] }), _jsx("div", { className: "mt-3 space-y-2", children: question.answers.map((answer, answerIndex) => (_jsxs("label", { className: "flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300", children: [_jsx("input", { type: "radio", name: `quiz-${questionIndex}`, value: answerIndex, checked: selectedAnswers[questionIndex] === answerIndex, onChange: () => {
                                        setSelectedAnswers((prev) => {
                                            const next = [...prev];
                                            next[questionIndex] = answerIndex;
                                            return next;
                                        });
                                    }, className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), answer] }, answer))) })] }, question.question))), _jsxs("div", { className: "flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/50", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-semibold text-slate-700 dark:text-slate-200", children: "Score:" }), _jsx("span", { className: "text-lg font-bold text-slate-900 dark:text-white", children: quizScore !== null ? `${quizScore}%` : "--" })] }), quizError && _jsx("p", { className: "text-xs text-red-500", children: quizError }), _jsx("button", { onClick: handleQuizSubmit, className: "mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90", children: quizSubmitted ? "Recalculate score" : "Submit quiz" })] })] }));
    const renderSignatureStep = () => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: "Certification" }), _jsxs("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: ["I certify that I have completed this training and understand the requirements of ", training?.title, "."] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: "Enter your full name as a digital signature" }), _jsx("input", { type: "text", value: signature, onChange: (event) => setSignature(event.target.value), className: "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", placeholder: "e.g., Jean Carmona" }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Signatures are stored as part of the audit trail for this training record." })] })] }));
    const renderStep = () => {
        if (step === 0)
            return renderContentStep();
        if (step === 1)
            return renderQuizStep();
        return renderSignatureStep();
    };
    const primaryButtonLabel = step === 0
        ? contentComplete
            ? "Go to quiz"
            : "Please finish the content"
        : step === 1
            ? canAdvanceFromQuiz
                ? "Go to signature"
                : "Submit quiz"
            : "Submit training";
    const primaryDisabled = (step === 0 && !contentComplete) ||
        (step === 1 && !canAdvanceFromQuiz) ||
        (step === 2 && signature.trim().length < 3);
    return (_jsxs(Modal, { open: open, onClose: onClose, title: modalTitle, description: "Complete all three steps to finish this training.", children: [_jsx("div", { className: "pb-4", children: _jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary", children: [_jsx("span", { className: step === 0 ? "text-primary" : "text-slate-400", children: "1 \u00B7 Content" }), _jsx("span", { className: "text-slate-400", children: "/" }), _jsx("span", { className: step === 1 ? "text-primary" : "text-slate-400", children: "2 \u00B7 Quiz" }), _jsx("span", { className: "text-slate-400", children: "/" }), _jsx("span", { className: step === 2 ? "text-primary" : "text-slate-400", children: "3 \u00B7 Signature" })] }) }), _jsx("div", { className: "space-y-6", children: renderStep() }), _jsxs("div", { className: "mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700", children: [_jsx("button", { type: "button", onClick: onClose, className: "rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300", children: "Cancel" }), _jsx("button", { type: "button", onClick: handleNextStep, disabled: primaryDisabled, className: `rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${primaryDisabled
                            ? "bg-slate-300 dark:bg-slate-700"
                            : "bg-primary hover:bg-primary/90"}`, children: primaryButtonLabel })] })] }));
}
