import { useState } from "react";
import {
  CheckIcon,
  Volume2Icon,
  XIcon } from
"lucide-react";

import { Button } from "../components/Button";
import { ExerciseFeedbackPanel } from "../components/ExerciseFeedbackPanel";
import { PracticeActionBar, practiceBarContentPadding } from "../components/PracticeActionBar";
import { ScreenColumn } from "../components/ScreenColumn";
import { MascotSlot } from "../components/MascotSlot";
import { StickerCard } from "../components/StickerCard";

export interface Props {
  onDone: () => void;
  onSkip?: () => void;
}

type ChoiceQuestion = {
  type: "choice";
  hint: string;
  word: string;
  options: {id: string;label: string;correct: boolean;}[];
};

type ClozeQuestion = {
  type: "cloze";
  hint: string;
  parts: [string, string, string];
  translation: string;
  chips: {id: string;label: string;correct: boolean;}[];
};

type Question = ChoiceQuestion | ClozeQuestion;
type Feedback = "correct" | "retry" | "reveal" | null;

export const mockProps = {
  onDone: () => undefined,
  pointsAwarded: 10,
  questions: [
  {
    type: "choice",
    hint: "Benda ini dipakai untuk minum.",
    word: "Cup",
    options: [
    { id: "a", label: "cangkir", correct: true },
    { id: "b", label: "piring", correct: false },
    { id: "c", label: "sendok", correct: false },
    { id: "d", label: "botol", correct: false }]

  },
  {
    type: "cloze",
    hint: "Kata ini adalah benda yang kamu pindai tadi.",
    parts: ["I drink water from a", "___", "."],
    translation: "Aku minum air dari ___.",
    chips: [
    { id: "cup", label: "cup", correct: true },
    { id: "spoon", label: "spoon", correct: false },
    { id: "bowl", label: "bowl", correct: false },
    { id: "bottle", label: "bottle", correct: false }]

  }] satisfies
  Question[]
};

const optionLetters = ["A", "B", "C", "D"];

export function ExerciseScreen({ onDone, onSkip }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState([0, 0]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const question = mockProps.questions[questionIndex];
  if (!question) return null;
  const selectedAnswer = question.type === "choice" ?
  question.options.find((option) => option.id === selectedId) :
  question.chips.find((chip) => chip.id === selectedId);
  const correctAnswer = question.type === "choice" ?
  question.options.find((option) => option.correct) :
  question.chips.find((chip) => chip.correct);

  const handleCheck = () => {
    if (!selectedAnswer) {
      return;
    }

    if (selectedAnswer.correct) {
      setFeedback("correct");
      return;
    }

    const nextAttempts = (wrongAttempts[questionIndex] ?? 0) + 1;
    setWrongAttempts((attempts) => attempts.map((count, index) =>
    index === questionIndex ? nextAttempts : count
    ));
    setFeedback(nextAttempts === 1 ? "retry" : "reveal");
  };

  const handleRetry = () => {
    setFeedback(null);
    setSelectedId(null);
  };

  const handleContinue = () => {
    if (questionIndex === mockProps.questions.length - 1) {
      onDone();
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedId(null);
    setFeedback(null);
  };

  const getAnswerClasses = (id: string) => {
    const isSelected = selectedId === id;
    if (!isSelected) {
      return "border-ink bg-card text-ink";
    }
    if (feedback === "correct") {
      return "border-primary bg-primary text-white";
    }
    if (feedback === "retry" || feedback === "reveal") {
      return "border-signal bg-signal text-white";
    }
    return "border-ink bg-accent text-ink";
  };

  return (
    <main className={`relative flex h-full w-full flex-col overflow-y-auto bg-paper pt-6 text-ink ${onSkip ? practiceBarContentPadding.withSkip : practiceBarContentPadding.withoutSkip}`}>
      <ScreenColumn className="flex flex-1 flex-col">
      <header>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-orange px-3 font-body text-[15px] font-bold leading-5 shadow-[2px_2px_0_var(--ink)]">
            Latihan {questionIndex + 1} dari 3
          </span>
          <div className="flex gap-2" aria-label={`${questionIndex + 1} dari 3 latihan`}>
            {[0, 1, 2].map((segment) =>
              <span
                key={segment}
                className={`h-4 w-12 rounded-chip border-2 border-ink ${segment <= questionIndex ? "bg-accent" : "bg-card"}`}
                aria-hidden="true" />

              )}
          </div>
        </div>
        <h1 className="mt-5 font-display text-[28px] font-extrabold leading-8">
          {question.type === "choice" ? "Apa arti kata ini?" : "Lengkapi kalimatnya"}
        </h1>
      </header>

      {question.type === "choice" ?
        <section className="mt-5 flex-1" aria-label="Pilihan jawaban">
          <StickerCard className="relative grid min-h-[142px] place-items-center px-5 py-6">
            <MascotSlot label="idle" size={48} className="absolute -right-1 -top-5" />
            <p className="font-display text-[56px] font-black leading-[60px] tracking-[-0.03em]">{question.word}</p>
          </StickerCard>

          <div className="mt-5 space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedId === option.id;
              const isChecked = isSelected && feedback !== null;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => feedback === null && setSelectedId(option.id)}
                  disabled={feedback !== null}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-card border-[3px] px-3 text-left font-body text-[18px] font-bold leading-6 shadow-[2px_3px_0_var(--ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${getAnswerClasses(option.id)}`}
                  aria-pressed={isSelected}>

                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-[2.5px] font-display text-[16px] font-black ${isSelected ? "border-current" : "border-ink bg-paper text-ink"}`}>
                    {optionLetters[index]}
                  </span>
                  <span className="flex-1">{option.label}</span>
                  {isChecked ?
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-[15px]">
                      {feedback === "correct" ? <CheckIcon size={22} strokeWidth={2.25} aria-hidden="true" /> : <XIcon size={22} strokeWidth={2.25} aria-hidden="true" />}
                      {feedback === "correct" ? "Benar" : "Salah"}
                    </span> :
                  null}
                </button>);

            })}
          </div>
        </section> :

        <section className="mt-5 flex-1">
          <StickerCard className="relative px-5 pb-5 pt-8">
            <MascotSlot label="idle" size={48} className="absolute -right-1 -top-5" />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-3 font-display text-[25px] font-extrabold leading-9">
              <span>{question.parts[0]}</span>
              <button
                type="button"
                onClick={() => feedback === null && selectedId && setSelectedId(null)}
                disabled={!selectedId || feedback !== null}
                className={`inline-flex min-h-14 min-w-24 items-center justify-center rounded-chip border-[3px] border-dashed px-3 font-body text-[17px] font-bold leading-[26px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${selectedId ? getAnswerClasses(selectedId) : "border-ink bg-paper text-muted"}`}
                aria-label={selectedId ? "Kembalikan kata ke pilihan" : "Tempat jawaban"}>

                {selectedAnswer ?
                <span className="flex items-center gap-1.5">
                    {selectedAnswer.label}
                    {feedback === "correct" ? <CheckIcon size={20} strokeWidth={2.25} aria-label="Benar" /> : null}
                    {feedback === "retry" || feedback === "reveal" ? <XIcon size={20} strokeWidth={2.25} aria-label="Salah" /> : null}
                  </span> :
                question.parts[1]}
              </button>
              <span>{question.parts[2]}</span>
            </div>
            <p className="mt-5 font-body text-[17px] leading-[26px] text-muted">{question.translation}</p>
            <Button type="button" variant="ghost" className="mt-4 w-auto px-4">
              <span className="flex items-center gap-2"><Volume2Icon size={20} strokeWidth={2.25} aria-hidden="true" />Dengar</span>
            </Button>
          </StickerCard>

          <div className="mt-7 flex flex-wrap gap-3" aria-label="Pilihan kata">
            {question.chips.map((chip) => {
              const isUsed = selectedId === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => !isUsed && feedback === null && setSelectedId(chip.id)}
                  disabled={isUsed || feedback !== null}
                  className={`min-h-14 rounded-chip border-[2.5px] px-5 font-body text-[17px] font-bold leading-[26px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${isUsed ? "border-ink bg-paper text-muted" : "border-ink bg-accent text-ink shadow-[2px_2px_0_var(--ink)]"}`}>

                  {chip.label}
                </button>);

            })}
          </div>
        </section>
        }

      </ScreenColumn>

      <PracticeActionBar onSkip={onSkip} skipDisabled={feedback !== null}>
        <Button type="button" className="!h-14" disabled={!selectedId || feedback !== null} onClick={handleCheck}>Periksa</Button>
      </PracticeActionBar>

      {feedback ?
      <ExerciseFeedbackPanel
        status={feedback === "correct" ? "correct" : "wrong"}
        attemptNo={feedback === "reveal" ? 2 : 1}
        hint={question.hint}
        correctAnswerText={correctAnswer?.label ?? ""}
        pointsAwarded={mockProps.pointsAwarded}
        onRetry={handleRetry}
        onNext={handleContinue} /> :

      null}
    </main>);

}
