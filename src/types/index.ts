// ---------- Core vocabulary ----------
export type Skill =
  | 'reading'
  | 'writing'
  | 'listening'
  | 'speaking'
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation';

/** Skills shown as dashboard cards (pronunciation/clarity is shown on the Progress page). */
export const SKILLS_MAIN: Skill[] = ['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'];
export const SKILLS_ALL: Skill[] = [...SKILLS_MAIN, 'pronunciation'];

export const SKILL_LABELS: Record<Skill, { en: string; hi: string }> = {
  reading: { en: 'Reading', hi: 'पढ़ना' },
  writing: { en: 'Writing', hi: 'लिखना' },
  listening: { en: 'Listening', hi: 'सुनना' },
  speaking: { en: 'Speaking', hi: 'बोलना' },
  grammar: { en: 'Grammar', hi: 'व्याकरण' },
  vocabulary: { en: 'Vocabulary', hi: 'शब्द-भंडार' },
  pronunciation: { en: 'Pronunciation / Clarity', hi: 'उच्चारण / स्पष्टता' },
};

export type StageId = 'pre-a1' | 'a1' | 'a2' | 'b1' | 'b2' | 'c1';
export const STAGE_ORDER: StageId[] = ['pre-a1', 'a1', 'a2', 'b1', 'b2', 'c1'];

export interface Stage {
  id: StageId;
  label: string;
  labelHi: string;
  descriptionHi: string;
  cefr: string;
}

// ---------- Exercises ----------
interface BaseEx {
  id: string;
  skill: Skill;
  /** Short Hindi explanation shown after answering. */
  explanationHi: string;
  hintHi?: string;
}

export interface McqEx extends BaseEx {
  type: 'mcq';
  prompt: string;
  options: string[];
  answer: number;
  /** Reading comprehension passage shown above the question. */
  passage?: string;
  /** Listening comprehension: text spoken with text-to-speech. */
  audioText?: string;
}
export interface FillEx extends BaseEx {
  type: 'fill';
  prompt: string;
  /** Sentence containing ___ where the answer goes. */
  sentence: string;
  answers: string[];
  caseSensitive?: boolean;
}
export interface TranslateEx extends BaseEx {
  type: 'translate';
  direction: 'en-hi' | 'hi-en';
  source: string;
  /** Accepted answers. For en-hi these are space-joined Hindi word sequences. */
  answers: string[];
  /** Hindi word tiles (answer words + distractors) for en-hi. */
  bank?: string[];
}
export interface ArrangeEx extends BaseEx {
  type: 'arrange';
  prompt: string;
  words: string[];
  answers: string[];
}
export interface MatchEx extends BaseEx {
  type: 'match';
  prompt: string;
  pairs: [string, string][];
}
export interface DictationEx extends BaseEx {
  type: 'dictation';
  prompt?: string;
  audioText: string;
  answers: string[];
}
export interface CorrectEx extends BaseEx {
  type: 'correct';
  wrong: string;
  answers: string[];
}
export interface SpeakEx extends BaseEx {
  type: 'speak';
  prompt: string;
  /** If set, the learner should say this text (read aloud / repeat). */
  targetText?: string;
  /** For open answers: words/phrases that a good answer contains. */
  keywords?: string[];
  modelAnswer: string;
  /** Role-play: the line spoken by the other person. */
  partnerLine?: string;
}
export interface WriteEx extends BaseEx {
  type: 'write';
  prompt: string;
  minWords: number;
  keywords: string[];
  modelAnswer: string;
}

export type Exercise =
  | McqEx
  | FillEx
  | TranslateEx
  | ArrangeEx
  | MatchEx
  | DictationEx
  | CorrectEx
  | SpeakEx
  | WriteEx;

export type ExerciseType = Exercise['type'];

// ---------- Curriculum ----------
export interface TeachItem {
  en: string;
  hi: string;
  /** Hindi-script pronunciation aid (a memory aid, not exact English phonetics). */
  hint?: string;
  example?: { en: string; hi: string };
}

export interface Lesson {
  id: string;
  title: string;
  titleHi: string;
  stage: StageId;
  module: string;
  moduleHi: string;
  prerequisite?: string;
  minutes: number;
  skills: Skill[];
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  explanationHi: string[];
  teach: TeachItem[];
  mistakes?: { wrong: string; right: string; noteHi: string }[];
  exercises: Exercise[];
  /** Vocabulary ids added to the revision queue when the lesson is completed. */
  vocab?: string[];
}

export interface VocabItem {
  id: string;
  en: string;
  hi: string;
  hint?: string;
  example?: { en: string; hi: string };
  theme: string;
  stage: StageId;
}

export interface GrammarTopic {
  id: string;
  title: string;
  titleHi: string;
  stage: StageId;
  summaryHi: string;
  rulesHi: string[];
  examples: { en: string; hi: string }[];
  lessonId?: string;
  quiz: Exercise[];
}

export interface PronunciationTopic {
  id: string;
  title: string;
  titleHi: string;
  stage: StageId;
  bodyHi: string[];
  examples: { en: string; hint?: string }[];
  pairs?: [string, string][];
}

export interface GlossaryEntry {
  hi: string;
  example?: string;
}
export interface ReadingPassage {
  id: string;
  title: string;
  titleHi: string;
  stage: StageId;
  kind: 'story' | 'dialogue' | 'message' | 'email' | 'notice' | 'article';
  text: string;
  glossary: Record<string, GlossaryEntry>;
  questions: McqEx[];
}
export interface ListeningItem {
  id: string;
  title: string;
  titleHi: string;
  stage: StageId;
  /** Lines spoken in order. */
  lines: { speaker?: string; text: string }[];
  questions: McqEx[];
}
export interface SpeakingTask {
  id: string;
  title: string;
  titleHi: string;
  stage: StageId;
  kind: 'repeat' | 'read-aloud' | 'intro' | 'role-play';
  exercises: SpeakEx[];
  /** Scenario key understood by the AI tutor for open role-play. */
  scenario?: string;
}
export interface WritingTask {
  id: string;
  title: string;
  titleHi: string;
  stage: StageId;
  exercise: WriteEx;
  ruleHi: string;
}

// ---------- Learner data ----------
export type Goal =
  | 'conversation'
  | 'work'
  | 'interview'
  | 'exams'
  | 'travel'
  | 'customer'
  | 'professional';

export type SupportLang = 'hindi' | 'mixed' | 'english';
export type Accent = 'en-IN' | 'en-GB' | 'en-US';

export interface Profile {
  name: string;
  level: StageId;
  goal: Goal;
  dailyMinutes: 5 | 10 | 15 | 20 | 30;
  support: SupportLang;
  accent: Accent;
  comfort: 'nervous' | 'okay' | 'confident';
  createdAt: string;
}

export interface LessonProgress {
  id: string;
  status: 'started' | 'completed';
  bestScore: number; // 0..1
  lastScore: number;
  attempts: number;
  mastered: boolean; // best score >= 0.8
  lastAt: string;
}

export type AttemptContext = 'lesson' | 'quiz' | 'daily' | 'review' | 'practice' | 'placement';

export interface Attempt {
  id: string;
  at: string;
  dateKey: string;
  context: AttemptContext;
  contextId: string;
  exerciseId: string;
  skill: Skill;
  type: ExerciseType | 'flashcard';
  correct: boolean;
  ms: number;
  /** Speaking attempts that had a target text also count toward pronunciation/clarity. */
  targeted?: boolean;
}

export type AssessmentKind = 'lesson' | 'daily' | 'unit' | 'weekly' | 'placement' | 'timed' | 'skill' | 'missed';

export interface AssessmentResult {
  id: string;
  at: string;
  kind: AssessmentKind;
  title: string;
  total: number;
  correct: number;
  durationSec: number;
  bySkill: Partial<Record<Skill, { correct: number; total: number }>>;
  missedIds: string[];
}

export type VocabStatus = 'new' | 'learning' | 'review' | 'mastered';
export interface VocabState {
  id: string;
  status: VocabStatus;
  ease: number;
  interval: number; // days
  reps: number;
  lapses: number;
  due: string; // dateKey
  favourite: boolean;
  addedAt: string;
  custom?: { en: string; hi: string; example?: string };
}

export interface DayActivity {
  dateKey: string;
  seconds: number;
  tasks: number;
  correct: number;
  total: number;
  dailySteps: string[];
}

export interface Settings {
  speechRate: number; // 0.5..1.2
  largeText: boolean;
  reduceMotion: boolean;
  showTranscripts: boolean;
  voiceURI: string | null;
}

/** Saved preferences for the AI tutor. Chat transcripts are NOT saved. */
export interface TutorPrefs {
  oneQuestionAtATime: boolean;
  slowEnglish: boolean;
}

export const DATA_VERSION = 1;

export interface AppData {
  version: number;
  profile: Profile | null;
  lessons: Record<string, LessonProgress>;
  attempts: Attempt[];
  assessments: AssessmentResult[];
  vocab: Record<string, VocabState>;
  activity: Record<string, DayActivity>;
  missed: string[];
  achievements: Record<string, string>;
  settings: Settings;
  tutorPrefs: TutorPrefs;
  savedGrammar: string[];
  updatedAt: string;
}
