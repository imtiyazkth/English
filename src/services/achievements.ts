import { AppData } from '../types';
import { streakInfo, totalMinutes, vocabCounts } from './selectors';
import { dateKey } from '../utils/dates';

export interface AchievementDef {
  id: string;
  title: string;
  titleHi: string;
  descHi: string;
  test: (d: AppData, today: string) => boolean;
}

const count = (d: AppData, skill: string) => d.attempts.filter((a) => a.skill === skill).length;

/** Every achievement is computed from stored activity; none can be earned without real effort. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-lesson', title: 'First lesson done', titleHi: 'पहला पाठ पूरा', descHi: 'एक पाठ पूरा किया।', test: (d) => Object.values(d.lessons).some((l) => l.status === 'completed') },
  { id: 'five-lessons', title: 'Five lessons done', titleHi: 'पाँच पाठ पूरे', descHi: 'पाँच पाठ पूरे किए।', test: (d) => Object.values(d.lessons).filter((l) => l.status === 'completed').length >= 5 },
  { id: 'streak-3', title: '3-day streak', titleHi: 'लगातार 3 दिन', descHi: 'लगातार तीन दिन अभ्यास किया।', test: (d, t) => streakInfo(d, t).longest >= 3 },
  { id: 'streak-7', title: '7-day streak', titleHi: 'लगातार 7 दिन', descHi: 'लगातार सात दिन अभ्यास किया।', test: (d, t) => streakInfo(d, t).longest >= 7 },
  { id: 'words-10', title: '10 words learning', titleHi: '10 शब्द दोहराव में', descHi: 'दस शब्द दोहराव सूची में हैं।', test: (d, t) => vocabCounts(d, t).total >= 10 },
  { id: 'word-mastered', title: 'First mastered word', titleHi: 'पहला पक्का शब्द', descHi: 'एक शब्द 21+ दिन के अंतराल तक पहुँचा।', test: (d, t) => vocabCounts(d, t).mastered >= 1 },
  { id: 'accuracy-80', title: 'Strong test result', titleHi: 'बढ़िया टेस्ट परिणाम', descHi: 'कम से कम 8 सवालों के टेस्ट में 80% या ज़्यादा।', test: (d) => d.assessments.some((a) => a.total >= 8 && a.correct / a.total >= 0.8) },
  { id: 'listening-10', title: '10 listening answers', titleHi: '10 सुनने के जवाब', descHi: 'सुनने के 10 सवाल हल किए।', test: (d) => count(d, 'listening') >= 10 },
  { id: 'speaking-5', title: '5 speaking attempts', titleHi: 'बोलने के 5 प्रयास', descHi: 'बोलने के पाँच अभ्यास किए।', test: (d) => count(d, 'speaking') >= 5 },
  { id: 'writing-3', title: '3 writing answers', titleHi: 'लिखने के 3 अभ्यास', descHi: 'लिखने के तीन अभ्यास पूरे किए।', test: (d) => count(d, 'writing') >= 3 },
  { id: 'minutes-60', title: '60 minutes learned', titleHi: '60 मिनट की पढ़ाई', descHi: 'कुल 60 मिनट अभ्यास किया।', test: (d) => totalMinutes(d) >= 60 },
];

export function earnedAchievementIds(d: AppData, today: string = dateKey()): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(d, today)).map((a) => a.id);
}
