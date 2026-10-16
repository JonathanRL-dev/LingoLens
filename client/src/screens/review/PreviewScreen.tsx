import type { ReactNode } from "react";

import { AppShell } from "../../components/AppShell";
import type { BottomNavigationTab } from "../../components/BottomNavigation";
import { MissionFlowShell, type MissionStep } from "../../components/MissionFlowShell";
import { ScreenStatusView } from "../../components/ScreenStatusView";
import { creditSections } from "../../data/credits";
import { screenStatusCopy } from "../../data/screenStatusCopy";
import { wordBuildExercise } from "../../data/wordBuildExercise";
import { CollectionScreen, mockProps as collectionMockProps } from "../CollectionScreen";
import { CreditsScreen } from "../CreditsScreen";
import { ExerciseScreen } from "../ExerciseScreen";
import { HomeScreen, mockProps as homeMockProps } from "../HomeScreen";
import { LevelUpScreen } from "../LevelUpScreen";
import { LoginScreen } from "../LoginScreen";
import { MissionScreen } from "../MissionScreen";
import { OrderExerciseScreen, mockProps as orderMockProps, type Props as OrderProps } from "../OrderExerciseScreen";
import { ProfileScreen, mockProps as profileMockProps } from "../ProfileScreen";
import { RegisterScreen } from "../RegisterScreen";
import { ResultScreen, mockProps as resultMockProps } from "../ResultScreen";
import { ScannerScreen, mockProps as scannerMockProps, type Props as ScannerProps } from "../ScannerScreen";
import { SplashScreen } from "../SplashScreen";
import { VocabCardScreen, mockProps as vocabMockProps } from "../VocabCardScreen";
import { WordBuildScreen } from "../WordBuildScreen";

export interface PreviewScreenProps {
  screen: string;
  state: string;
}

type DataState = "loading" | "error" | "empty";

const noop = () => undefined;

export function PreviewScreen({ screen, state }: PreviewScreenProps) {
  const navTab: BottomNavigationTab | null = screen === "home" || screen === "collection" || screen === "profile" ? screen : null;

  return (
    <AppShell navTab={navTab} onNavChange={noop}>
      {renderScreen(screen, state)}
    </AppShell>);

}

function inFlow(step: MissionStep, content: ReactNode, lockContent = false) {
  return (
    <MissionFlowShell currentStep={step} onBack={noop} onExit={noop} lockContent={lockContent}>
      {content}
    </MissionFlowShell>);

}

function statusView(state: string, layout: "home" | "card" | "exercise" | "collection") {
  if (state !== "loading" && state !== "error" && state !== "empty") return null;
  return <ScreenStatusView status={state as DataState} layout={layout} copy={screenStatusCopy[layout]} onRetry={noop} onEmptyAction={noop} />;
}

function renderScreen(screen: string, state: string): ReactNode {
  switch (screen) {
    case "splash":
      return <SplashScreen modelStatus={state === "loading" ? "loading" : "ready"} progress={64} onStart={noop} />;
    case "register":
      return (
        <RegisterScreen
          mode="new"
          guestNickname={profileMockProps.user.nickname}
          onRegister={noop}
          onGoToLogin={noop}
          onGuestStart={noop}
          onBack={noop} />);


    case "login":
      return <LoginScreen onLogin={noop} onGoToRegister={noop} onBack={noop} />;
    case "home":
      return statusView(state, "home") ?? <HomeScreen {...homeMockProps} showBottomNav={false} onOpenMission={noop} />;
    case "mission":
      return inFlow(
        "scan",
        <MissionScreen
          permissionState={state === "request" || state === "denied" ? state : "closed"}
          onBack={noop}
          onRequestCamera={noop}
          onDismissPermission={noop}
          onDenyCamera={noop}
          onUpload={noop}
          onDemo={noop}
          onOpenCamera={noop} />

      );
    case "scanner":
      return inFlow("scan", <ScannerScreen {...scannerMockProps} status={state as ScannerProps["status"]} />, true);
    case "vocab":
      return inFlow(
        "word",
        statusView(state, "card") ??
        <VocabCardScreen {...vocabMockProps} onSpeak={noop} onOpenSource={noop} onOpenCredits={noop} onStartPractice={noop} />

      );
    case "exercise":
      return inFlow("practice", statusView(state, "exercise") ?? <ExerciseScreen onSkip={noop} onDone={noop} />);
    case "order":
      return inFlow("practice", renderOrder(state));
    case "wordBuild":
      return inFlow("practice", renderWordBuild(state));
    case "result":
      return inFlow(
        "practice",
        <ResultScreen
          {...resultMockProps}
          level={{ ...resultMockProps.level, after: resultMockProps.level.before }}
          onNextMission={noop}
          onOpenCollection={noop}
          onHome={noop} />

      );
    case "levelUp":
      return (
        <LevelUpScreen
          newLevel={resultMockProps.level.after}
          xpInLevel={resultMockProps.level.xp}
          xpForNextLevel={resultMockProps.level.xpToNext}
          onContinue={noop} />);


    case "collection":
      return statusView(state, "collection") ??
      <CollectionScreen {...collectionMockProps} onOpenItem={noop} onStartMission={noop} onStartPractice={noop} />;

    case "profile":
      return (
        <ProfileScreen
          {...profileMockProps}
          isGuest={state !== "account"}
          onRename={noop}
          onToggleSound={noop}
          onOpenSources={noop}
          onOpenCredits={noop}
          onUpgradeToAccount={noop}
          onGoToLogin={noop}
          onSignOut={noop} />);


    case "credits":
      return <CreditsScreen sections={creditSections} backLabel="Kembali ke Profil" onBack={noop} />;
    default:
      return <SplashScreen modelStatus="ready" progress={64} onStart={noop} />;
  }
}

function renderOrder(state: string) {
  const bank = orderMockProps.bank;
  const placedIds = state === "idle" ? [] : state === "building" ? bank.slice(0, 2).map((chip) => chip.id) : bank.map((chip) => chip.id);

  return (
    <OrderExerciseScreen
      {...orderMockProps}
      bank={bank.map((chip) => ({ ...chip, placed: placedIds.includes(chip.id) }))}
      placed={bank.filter((chip) => placedIds.includes(chip.id)).map(({ id, label }) => ({ id, label }))}
      state={state as OrderProps["state"]}
      attemptNo={state === "wrong" ? 1 : 0}
      onSkip={noop}
      onPlace={noop}
      onRemove={noop}
      onReset={noop}
      onCheck={noop}
      onContinue={noop} />);


}

function renderWordBuild(state: string) {
  const status = state === "correct" || state === "wrong" ? state : "idle";
  const ids = status === "idle" ? [] : status === "correct" ? wordBuildExercise.answer : [...wordBuildExercise.answer].reverse();
  const placed = ids.
  map((id) => wordBuildExercise.bank.find((chip) => chip.id === id)).
  filter((chip): chip is (typeof wordBuildExercise.bank)[number] => chip !== undefined);

  return (
    <WordBuildScreen
      bank={wordBuildExercise.bank}
      placed={placed}
      endPunctuation={wordBuildExercise.endPunctuation}
      hintTranslation={wordBuildExercise.hintTranslation}
      status={status}
      attemptNo={status === "wrong" ? 1 : 0}
      hint={wordBuildExercise.hint}
      correctAnswerText={wordBuildExercise.correctAnswerText}
      pointsAwarded={wordBuildExercise.pointsAwarded}
      onSkip={noop}
      onPlace={noop}
      onRemove={noop}
      onReset={noop}
      onCheck={noop}
      onContinue={noop} />);


}