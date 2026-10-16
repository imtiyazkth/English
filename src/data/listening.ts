import type { ListeningItem } from '../types';
import { mcq } from './builders';

export const LISTENING: ListeningItem[] = [
  {
    id: 'l-intro',
    title: 'Meeting Sara',
    titleHi: 'सारा से मुलाक़ात',
    stage: 'pre-a1',
    lines: [{ text: 'Hello, my name is Sara. I am from Delhi. Nice to meet you.' }],
    questions: [
      mcq('l-intro-1', 'listening', 'Where is Sara from?', ['Mumbai', 'Delhi', 'Pune'], 1, 'Sara कहती है: I am from Delhi.'),
      mcq('l-intro-2', 'listening', 'What is her name?', ['Sana', 'Sara', 'Sita'], 1, 'My name is Sara.'),
    ],
  },
  {
    id: 'l-shop',
    title: 'At the shop',
    titleHi: 'दुकान पर',
    stage: 'a1',
    lines: [
      { speaker: 'Customer', text: 'Hello. How much is this shirt?' },
      { speaker: 'Shopkeeper', text: 'It is four hundred rupees.' },
      { speaker: 'Customer', text: 'That is too expensive. Do you have a cheaper one?' },
      { speaker: 'Shopkeeper', text: 'Yes, this one is two hundred and fifty rupees.' },
    ],
    questions: [
      mcq('l-shop-1', 'listening', 'How much is the first shirt?', ['₹250', '₹400', '₹14'], 1, 'पहली शर्ट: four hundred rupees (₹400)।'),
      mcq('l-shop-2', 'listening', 'What does the customer say about the price?', ['It is cheap', 'It is too expensive', 'It is fine'], 1, 'Customer: That is too expensive.'),
      mcq('l-shop-3', 'listening', 'How much is the cheaper shirt?', ['₹150', '₹250', '₹350'], 1, 'two hundred and fifty = ₹250।'),
    ],
  },
  {
    id: 'l-clinic',
    title: 'A phone call from the clinic',
    titleHi: 'क्लिनिक का फ़ोन',
    stage: 'a2',
    lines: [
      {
        text: 'Hello, this is City Clinic. Your appointment is on Friday at ten thirty. Please arrive ten minutes early and bring your previous reports.',
      },
    ],
    questions: [
      mcq('l-clinic-1', 'listening', 'When is the appointment?', ['Thursday at 10:30', 'Friday at 10:30', 'Friday at 3:30'], 1, 'Friday at ten thirty = शुक्रवार 10:30।'),
      mcq('l-clinic-2', 'listening', 'What should the patient bring?', ['Previous reports', 'Money only', 'A friend'], 0, 'Please bring your previous reports.'),
    ],
  },
  {
    id: 'l-train',
    title: 'Station announcement',
    titleHi: 'स्टेशन की घोषणा',
    stage: 'b1',
    lines: [
      {
        text: 'Attention please. The six fifteen train to Pune is delayed by forty minutes. Passengers are requested to wait on platform two. We apologise for the inconvenience.',
      },
    ],
    questions: [
      mcq('l-train-1', 'listening', 'How late is the train?', ['Fourteen minutes', 'Forty minutes', 'Four hours'], 1, 'delayed by forty minutes (40 मिनट)। forty और fourteen की आवाज़ों का फ़र्क़ ध्यान से सुनें।'),
      mcq('l-train-2', 'listening', 'Where should passengers wait?', ['Platform one', 'Platform two', 'Outside the station'], 1, 'wait on platform two।'),
    ],
  },
  {
    id: 'l-hybrid',
    title: 'A short talk about hybrid work',
    titleHi: 'हाइब्रिड काम पर छोटी बात',
    stage: 'b2',
    lines: [
      {
        text: 'Many companies now allow staff to work from home two days a week. Employees say they save time and feel less tired. Managers, however, say that new colleagues need more face-to-face support during their first months.',
      },
    ],
    questions: [
      mcq('l-hybrid-1', 'listening', 'How often can staff work from home?', ['Two days a week', 'Every day', 'Once a month'], 0, 'two days a week।'),
      mcq('l-hybrid-2', 'listening', 'What concern do managers have?', ['New colleagues may need more face-to-face support', 'Employees are working too much', 'Offices are too expensive'], 0, 'Managers: new colleagues need more face-to-face support।'),
    ],
  },
];

/** Minimal-pair sets for sound discrimination (listening + pronunciation). */
export const MINIMAL_PAIRS: { a: string; b: string; noteHi: string }[] = [
  { a: 'vine', b: 'wine', noteHi: 'V: नीचे का होंठ दाँतों को छूता है; W: होंठ गोल।' },
  { a: 'ship', b: 'sheep', noteHi: 'छोटा "इ" बनाम लंबा "ई"।' },
  { a: 'full', b: 'fool', noteHi: 'छोटा "उ" बनाम लंबा "ऊ"।' },
  { a: 'thirteen', b: 'thirty', noteHi: '-teen पर ज़ोर बनाम पहले हिस्से पर ज़ोर।' },
  { a: 'fifteen', b: 'fifty', noteHi: 'fifteen में अंत पर ज़ोर; fifty में शुरुआत पर।' },
  { a: 'bat', b: 'bet', noteHi: '"ऐ" जैसी आवाज़ बनाम छोटी "ए"।' },
];

/** Sentences for dictation practice, graded by stage. */
export const DICTATION_SETS: { id: string; stage: 'pre-a1' | 'a1' | 'a2' | 'b1' | 'b2'; text: string; hi: string }[] = [
  { id: 'd1', stage: 'pre-a1', text: 'My name is Ravi.', hi: 'मेरा नाम रवि है।' },
  { id: 'd2', stage: 'pre-a1', text: 'I am fine, thank you.', hi: 'मैं ठीक हूँ, धन्यवाद।' },
  { id: 'd3', stage: 'a1', text: 'How much is this?', hi: 'यह कितने का है?' },
  { id: 'd4', stage: 'a1', text: 'She works in a bank.', hi: 'वह बैंक में काम करती है।' },
  { id: 'd5', stage: 'a2', text: 'I went to the market yesterday.', hi: 'मैं कल बाज़ार गया था।' },
  { id: 'd6', stage: 'a2', text: 'You should drink more water.', hi: 'आपको और पानी पीना चाहिए।' },
  { id: 'd7', stage: 'b1', text: 'I have lived here for five years.', hi: 'मैं पाँच साल से यहाँ रह रहा हूँ।' },
  { id: 'd8', stage: 'b2', text: 'If I had more time, I would learn French.', hi: 'अगर मेरे पास ज़्यादा समय होता, तो मैं फ़्रेंच सीखता।' },
];
