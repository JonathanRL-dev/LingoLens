import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import type { BottomNavigationTab } from './components/BottomNavigation';
import { PreviewScreen } from './screens/review/PreviewScreen';
import { ReviewScreen } from './screens/review/ReviewScreen';
import { MissionFlowShell, type MissionStep } from './components/MissionFlowShell';
import { CollectionScreen, mockProps as collectionMockProps } from './screens/CollectionScreen';
import { ExerciseScreen } from './screens/ExerciseScreen';
import { HomeScreen, mockProps as homeMockProps } from './screens/HomeScreen';
import { MissionScreen } from './screens/MissionScreen';
import MascotAssetSheet from './components/Mascot';
import { OrderExerciseScreen, mockProps as orderMockProps } from './screens/OrderExerciseScreen';
import { ProfileScreen, mockProps as profileMockProps } from './screens/ProfileScreen';
import { ScreenStatusView } from './components/ScreenStatusView';
import { screenStatusCopy } from './data/screenStatusCopy';
import { CreditsScreen } from './screens/CreditsScreen';
import { creditSections } from './data/credits';
import { LevelUpScreen } from './screens/LevelUpScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { ResultScreen, mockProps as resultMockProps } from './screens/ResultScreen';
import {
  ScannerScreen,
  mockProps as scannerMockProps,
  type Props as ScannerProps,
} from './screens/ScannerScreen';
import { SplashScreen, type LearnerLevel } from './screens/SplashScreen';
import { VocabCardScreen, mockProps as vocabMockProps } from './screens/VocabCardScreen';
import { WordBuildScreen } from './screens/WordBuildScreen';
import { wordBuildExercise } from './data/wordBuildExercise';
import { CvSpike } from './routes/dev/CvSpike';
import { CvLab } from './routes/dev/CvLab';

type AppScreen =
  | 'splash'
  | 'register'
  | 'login'
  | 'home'
  | 'mission'
  | 'scanner'
  | 'vocab'
  | 'exercise'
  | 'order'
  | 'wordBuild'
  | 'result'
  | 'levelUp'
  | 'collection'
  | 'profile'
  | 'credits';
type MissionScreenName =
  'mission' | 'scanner' | 'vocab' | 'exercise' | 'order' | 'wordBuild' | 'result';

const orderAnswer = 'I drink water from a cup';
const missionSteps: Record<MissionScreenName, MissionStep> = {
  mission: 'scan',
  scanner: 'scan',
  vocab: 'word',
  exercise: 'practice',
  order: 'practice',
  wordBuild: 'practice',
  result: 'practice',
};
const missionStepLabels: Record<MissionStep, string> = {
  scan: 'Pindai',
  word: 'Kata',
  practice: 'Latihan',
};

type DataStatus = 'ready' | 'loading' | 'error' | 'empty';

interface AppProps {
  dataStatus?: 'ready' | 'loading' | 'error' | 'empty';
  scanOutcome?: 'match' | 'timeout';
  entryScreen?: 'splash' | 'register' | 'login';
}

export function App({
  dataStatus = 'ready',
  scanOutcome = 'match',
  entryScreen = 'splash',
}: AppProps) {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : '';
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const view = params.get('view');

  if (pathname === '/dev/cv-spike') return <CvSpike />;
  if (pathname === '/dev/cv-lab') return <CvLab />;

  if (pathname === '/mascot') {
    return <MascotAssetSheet />;
  }

  if (pathname === '/review' || view === 'review') {
    return <ReviewScreen />;
  }

  if (view === 'preview') {
    return <PreviewScreen screen={params.get('screen') ?? ''} state={params.get('state') ?? ''} />;
  }

  return <AppRoot dataStatus={dataStatus} scanOutcome={scanOutcome} entryScreen={entryScreen} />;
}

function AppRoot({
  dataStatus = 'ready',
  scanOutcome = 'match',
  entryScreen = 'splash',
}: AppProps) {
  const [screen, setScreen] = useState<AppScreen>(entryScreen);
  const [contentStatus, setContentStatus] = useState<DataStatus>(dataStatus);

  useEffect(() => {
    setContentStatus(dataStatus);
  }, [dataStatus]);

  useEffect(() => {
    if (contentStatus !== 'loading' || dataStatus === 'loading') {
      return undefined;
    }
    const retryTimer = window.setTimeout(() => setContentStatus('ready'), 1200);
    return () => window.clearTimeout(retryTimer);
  }, [contentStatus, dataStatus]);

  const handleContentRetry = () => setContentStatus('loading');
  const statusView = contentStatus === 'ready' ? null : contentStatus;
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready'>('loading');
  const [nickname, setNickname] = useState('');
  const [, setLevel] = useState<LearnerLevel>('anak');
  const [permissionState, setPermissionState] = useState<'closed' | 'request' | 'denied'>('closed');
  const [scannerStatus, setScannerStatus] = useState<ScannerProps['status']>('loadingModel');
  const [muted, setMuted] = useState(false);
  const [scannerCycle, setScannerCycle] = useState(0);
  const [orderPlacedIds, setOrderPlacedIds] = useState<string[]>([]);
  const [orderResult, setOrderResult] = useState<'correct' | 'wrong' | null>(null);
  const [wordBuildPlacedIds, setWordBuildPlacedIds] = useState<string[]>([]);
  const [wordBuildStatus, setWordBuildStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [orderAttempts, setOrderAttempts] = useState(0);
  const [wordBuildAttempts, setWordBuildAttempts] = useState(0);
  const [unfinishedMissionScreen, setUnfinishedMissionScreen] = useState<MissionScreenName | null>(
    null,
  );
  const [practiceOrigin, setPracticeOrigin] = useState<'mission' | 'collection'>('mission');
  const [completedMissions, setCompletedMissions] = useState(0);
  const [isGuest, setIsGuest] = useState(true);
  const [registerMode, setRegisterMode] = useState<'new' | 'upgrade'>('new');
  const [creditsOrigin, setCreditsOrigin] = useState<'profile' | 'vocab'>('profile');
  const [levelUpDestination, setLevelUpDestination] = useState<'home' | 'collection'>('home');

  const orderBank = orderMockProps.bank.map((chip) => ({
    ...chip,
    placed: orderPlacedIds.includes(chip.id),
  }));
  const orderPlaced = orderPlacedIds
    .map((id) => orderMockProps.bank.find((chip) => chip.id === id))
    .filter((chip): chip is (typeof orderMockProps.bank)[number] => chip !== undefined)
    .map(({ id, label }) => ({ id, label }));
  const orderState =
    orderResult ??
    (orderPlacedIds.length === 0
      ? 'idle'
      : orderPlacedIds.length < orderMockProps.bank.length
        ? 'building'
        : 'complete');

  const handleOrderReset = () => {
    setOrderPlacedIds([]);
    setOrderResult(null);
  };

  const handleOrderCheck = () => {
    const sentence = orderPlaced.map((chip) => chip.label).join(' ');
    const isCorrect = sentence === orderAnswer;
    if (!isCorrect) {
      setOrderAttempts((attempts) => attempts + 1);
    }
    setOrderResult(isCorrect ? 'correct' : 'wrong');
  };

  const wordBuildPlaced = wordBuildPlacedIds
    .map((id) => wordBuildExercise.bank.find((chip) => chip.id === id))
    .filter((chip): chip is (typeof wordBuildExercise.bank)[number] => chip !== undefined);

  const handleWordBuildReset = () => {
    setWordBuildPlacedIds([]);
    setWordBuildStatus('idle');
  };

  const handleWordBuildCheck = () => {
    const isCorrect =
      wordBuildPlacedIds.length === wordBuildExercise.answer.length &&
      wordBuildPlacedIds.every((id, index) => id === wordBuildExercise.answer[index]);
    if (!isCorrect) {
      setWordBuildAttempts((attempts) => attempts + 1);
    }
    setWordBuildStatus(isCorrect ? 'correct' : 'wrong');
  };

  useEffect(() => {
    const readyTimer = window.setTimeout(() => setModelStatus('ready'), 1500);
    return () => window.clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (screen !== 'scanner') {
      return undefined;
    }

    setScannerStatus('loadingModel');
    const searchTimer = window.setTimeout(() => setScannerStatus('searching'), 1500);
    const matchTimer =
      scanOutcome === 'timeout'
        ? window.setTimeout(
            () => setScannerStatus('failed'),
            1500 + scannerMockProps.timeoutSeconds * 1000,
          )
        : window.setTimeout(() => setScannerStatus('matched'), 5500);

    return () => {
      window.clearTimeout(searchTimer);
      window.clearTimeout(matchTimer);
    };
  }, [screen, scannerCycle, scanOutcome]);

  const goToMissionScreen = (nextScreen: MissionScreenName) => {
    setUnfinishedMissionScreen(nextScreen === 'result' ? null : nextScreen);
    setScreen(nextScreen);
  };

  const homeMissions = homeMockProps.missions.map((mission, index) => {
    if (completedMissions === 0 || index > completedMissions) {
      return mission;
    }
    if (index < completedMissions) {
      return {
        ...mission,
        status: 'completed' as const,
        bestStars: resultMockProps.stars,
        lockedHint: undefined,
      };
    }
    return { ...mission, status: 'open' as const, lockedHint: undefined };
  });

  const handleOpenMission = (id: string) => {
    const mission = homeMissions.find((item) => item.id === id);
    if (mission?.status === 'open') {
      setPracticeOrigin('mission');
      goToMissionScreen(unfinishedMissionScreen ?? 'mission');
    }
  };

  const handleOpenCamera = () => {
    setPermissionState('closed');
    setScannerCycle((cycle) => cycle + 1);
    goToMissionScreen('scanner');
  };

  const handleRestartScanner = () => {
    setScannerCycle((cycle) => cycle + 1);
  };

  const handleCompleteScan = () => {
    goToMissionScreen('vocab');
  };

  const handleMissionBack = (currentScreen: MissionScreenName) => {
    const previousScreen: Record<MissionScreenName, AppScreen> = {
      mission: 'home',
      scanner: 'mission',
      vocab: 'scanner',
      exercise: practiceOrigin === 'collection' ? 'collection' : 'vocab',
      order: 'exercise',
      wordBuild: 'order',
      result: 'wordBuild',
    };
    const previous = previousScreen[currentScreen];
    if (
      previous === 'mission' ||
      previous === 'scanner' ||
      previous === 'vocab' ||
      previous === 'exercise' ||
      previous === 'order' ||
      previous === 'wordBuild'
    ) {
      setUnfinishedMissionScreen(previous);
    }
    setScreen(previous);
  };

  const handleMissionExit = (currentScreen: MissionScreenName) => {
    setUnfinishedMissionScreen(currentScreen === 'result' ? null : currentScreen);
    setScreen('home');
  };

  const handleMissionComplete = (destination: 'home' | 'collection') => {
    setCompletedMissions((count) => Math.min(count + 1, homeMockProps.missions.length));
    setUnfinishedMissionScreen(null);
    setPracticeOrigin('mission');
    setScreen(destination);
  };

  const handleResultAction = (destination: 'home' | 'collection') => {
    if (resultMockProps.level.after > resultMockProps.level.before) {
      setLevelUpDestination(destination);
      setUnfinishedMissionScreen(null);
      setScreen('levelUp');
      return;
    }
    handleMissionComplete(destination);
  };

  const activeNavigationTab: BottomNavigationTab | null =
    screen === 'home' || screen === 'collection' || screen === 'profile' ? screen : null;

  return (
    <AppShell navTab={activeNavigationTab} onNavChange={setScreen}>
      {screen === 'splash' ? (
        <SplashScreen
          modelStatus={modelStatus}
          progress={64}
          onStart={() => setScreen('register')}
        />
      ) : null}

      {screen === 'register' ? (
        <RegisterScreen
          key={registerMode}
          mode={registerMode}
          guestNickname={nickname || profileMockProps.user.nickname}
          onRegister={(name) => {
            setNickname(name);
            setIsGuest(false);
            setScreen(registerMode === 'upgrade' ? 'profile' : 'home');
            setRegisterMode('new');
          }}
          onGoToLogin={() => setScreen('login')}
          onGuestStart={(guestNickname, guestLevel) => {
            setNickname(guestNickname);
            setLevel(guestLevel);
            setIsGuest(true);
            setScreen('home');
          }}
          onBack={() => {
            setScreen(registerMode === 'upgrade' ? 'profile' : 'splash');
            setRegisterMode('new');
          }}
        />
      ) : null}

      {screen === 'login' ? (
        <LoginScreen
          onLogin={() => {
            setIsGuest(false);
            setScreen('home');
          }}
          onGoToRegister={() => setScreen('register')}
          onBack={() => setScreen('splash')}
        />
      ) : null}

      {screen === 'home' && statusView ? (
        <ScreenStatusView
          status={statusView}
          layout="home"
          copy={screenStatusCopy.home}
          onRetry={handleContentRetry}
          onEmptyAction={handleContentRetry}
        />
      ) : null}

      {screen === 'home' && !statusView ? (
        <HomeScreen
          {...homeMockProps}
          missions={homeMissions}
          user={{ ...homeMockProps.user, nickname: nickname || homeMockProps.user.nickname }}
          showBottomNav={false}
          unfinishedStep={
            unfinishedMissionScreen
              ? missionStepLabels[missionSteps[unfinishedMissionScreen]]
              : undefined
          }
          onOpenMission={handleOpenMission}
        />
      ) : null}

      {screen === 'mission' ? (
        <MissionFlowShell
          currentStep="scan"
          onBack={() => handleMissionBack('mission')}
          onExit={() => handleMissionExit('mission')}
        >
          <MissionScreen
            permissionState={permissionState}
            onBack={() => handleMissionBack('mission')}
            onRequestCamera={() => setPermissionState('request')}
            onDismissPermission={() => setPermissionState('closed')}
            onDenyCamera={() => setPermissionState('denied')}
            onUpload={handleOpenCamera}
            onDemo={handleOpenCamera}
            onOpenCamera={handleOpenCamera}
          />
        </MissionFlowShell>
      ) : null}

      {screen === 'scanner' ? (
        <MissionFlowShell
          currentStep="scan"
          onBack={() => handleMissionBack('scanner')}
          onExit={() => handleMissionExit('scanner')}
          lockContent
        >
          <ScannerScreen
            {...scannerMockProps}
            status={scannerStatus}
            muted={muted}
            onHint={() => undefined}
            onRetry={handleRestartScanner}
            onClose={() => handleMissionExit('scanner')}
            onUpload={() => setScannerStatus('matched')}
            onDemo={() => setScannerStatus('matched')}
            onToggleMute={() => setMuted((current) => !current)}
            onContinue={handleCompleteScan}
          />
        </MissionFlowShell>
      ) : null}

      {screen === 'vocab' ? (
        <MissionFlowShell
          currentStep="word"
          onBack={() => handleMissionBack('vocab')}
          onExit={() => handleMissionExit('vocab')}
        >
          {statusView ? (
            <ScreenStatusView
              status={statusView}
              layout="card"
              copy={screenStatusCopy.card}
              onRetry={handleContentRetry}
              onEmptyAction={handleOpenCamera}
            />
          ) : (
            <VocabCardScreen
              {...vocabMockProps}
              onSpeak={() => undefined}
              onOpenSource={() => undefined}
              onOpenCredits={() => {
                setCreditsOrigin('vocab');
                setScreen('credits');
              }}
              onStartPractice={() => goToMissionScreen('exercise')}
            />
          )}
        </MissionFlowShell>
      ) : null}

      {screen === 'exercise' ? (
        <MissionFlowShell
          currentStep="practice"
          onBack={() => handleMissionBack('exercise')}
          onExit={() => handleMissionExit('exercise')}
        >
          {statusView ? (
            <ScreenStatusView
              status={statusView}
              layout="exercise"
              copy={screenStatusCopy.exercise}
              onRetry={handleContentRetry}
              onEmptyAction={() => handleMissionExit('exercise')}
            />
          ) : (
            <ExerciseScreen
              onSkip={() => goToMissionScreen('result')}
              onDone={() => {
                handleOrderReset();
                setOrderAttempts(0);
                goToMissionScreen('order');
              }}
            />
          )}
        </MissionFlowShell>
      ) : null}

      {screen === 'order' ? (
        <MissionFlowShell
          currentStep="practice"
          onBack={() => handleMissionBack('order')}
          onExit={() => handleMissionExit('order')}
        >
          <OrderExerciseScreen
            {...orderMockProps}
            bank={orderBank}
            placed={orderPlaced}
            state={orderState}
            attemptNo={orderAttempts}
            onSkip={() => goToMissionScreen('result')}
            onPlace={(id) => setOrderPlacedIds((ids) => (ids.includes(id) ? ids : [...ids, id]))}
            onRemove={(id) => setOrderPlacedIds((ids) => ids.filter((placedId) => placedId !== id))}
            onReset={handleOrderReset}
            onCheck={handleOrderCheck}
            onContinue={() => {
              handleWordBuildReset();
              setWordBuildAttempts(0);
              goToMissionScreen('wordBuild');
            }}
          />
        </MissionFlowShell>
      ) : null}

      {screen === 'wordBuild' ? (
        <MissionFlowShell
          currentStep="practice"
          onBack={() => handleMissionBack('wordBuild')}
          onExit={() => handleMissionExit('wordBuild')}
        >
          <WordBuildScreen
            bank={wordBuildExercise.bank}
            placed={wordBuildPlaced}
            endPunctuation={wordBuildExercise.endPunctuation}
            hintTranslation={wordBuildExercise.hintTranslation}
            status={wordBuildStatus}
            attemptNo={wordBuildAttempts}
            onSkip={() => goToMissionScreen('result')}
            hint={wordBuildExercise.hint}
            correctAnswerText={wordBuildExercise.correctAnswerText}
            pointsAwarded={wordBuildExercise.pointsAwarded}
            onPlace={(id) =>
              setWordBuildPlacedIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
            }
            onRemove={(id) =>
              setWordBuildPlacedIds((ids) => ids.filter((placedId) => placedId !== id))
            }
            onReset={handleWordBuildReset}
            onCheck={handleWordBuildCheck}
            onContinue={() => goToMissionScreen('result')}
          />
        </MissionFlowShell>
      ) : null}

      {screen === 'result' ? (
        <MissionFlowShell
          currentStep="practice"
          onBack={() => handleMissionBack('result')}
          onExit={() => handleMissionExit('result')}
        >
          <ResultScreen
            {...resultMockProps}
            level={{ ...resultMockProps.level, after: resultMockProps.level.before }}
            onNextMission={() => handleResultAction('home')}
            onOpenCollection={() => handleResultAction('collection')}
            onHome={() => handleResultAction('home')}
          />
        </MissionFlowShell>
      ) : null}

      {screen === 'levelUp' ? (
        <LevelUpScreen
          newLevel={resultMockProps.level.after}
          xpInLevel={resultMockProps.level.xp}
          xpForNextLevel={resultMockProps.level.xpToNext}
          onContinue={() => handleMissionComplete(levelUpDestination)}
        />
      ) : null}

      {screen === 'profile' ? (
        <ProfileScreen
          {...profileMockProps}
          user={{ ...profileMockProps.user, nickname: nickname || profileMockProps.user.nickname }}
          soundOn={!muted}
          isGuest={isGuest}
          onUpgradeToAccount={() => {
            setRegisterMode('upgrade');
            setScreen('register');
          }}
          onGoToLogin={() => setScreen('login')}
          onRename={setNickname}
          onToggleSound={() => setMuted((current) => !current)}
          onOpenSources={() => undefined}
          onOpenCredits={() => {
            setCreditsOrigin('profile');
            setScreen('credits');
          }}
          onSignOut={() => {
            setNickname('');
            setModelStatus('ready');
            setScreen('splash');
          }}
        />
      ) : null}

      {screen === 'credits' ? (
        <CreditsScreen
          sections={creditSections}
          backLabel={creditsOrigin === 'vocab' ? 'Kembali ke kartu kosakata' : 'Kembali ke Profil'}
          onBack={() => setScreen(creditsOrigin)}
        />
      ) : null}

      {screen === 'collection' && statusView ? (
        <ScreenStatusView
          status={statusView}
          layout="collection"
          copy={screenStatusCopy.collection}
          onRetry={handleContentRetry}
          onEmptyAction={() => setScreen('home')}
        />
      ) : null}

      {screen === 'collection' && !statusView ? (
        <CollectionScreen
          {...collectionMockProps}
          onOpenItem={() => undefined}
          onStartMission={() => setScreen('home')}
          onStartPractice={() => {
            setPracticeOrigin('collection');
            goToMissionScreen('exercise');
          }}
        />
      ) : null}
    </AppShell>
  );
}
