import type { VocabItem } from '../types';

const v = (
  id: string,
  en: string,
  hi: string,
  hint: string,
  theme: string,
  stage: VocabItem['stage'],
  ex?: [string, string],
): VocabItem => ({ id, en, hi, hint, theme, stage, example: ex ? { en: ex[0], hi: ex[1] } : undefined });

/** Starter vocabulary. Hindi-script hints are memory aids only, not exact English sounds. */
export const VOCAB: VocabItem[] = [
  // Greetings & courtesy
  v('hello', 'hello', 'नमस्ते / हेलो', 'हेलो', 'Greetings', 'pre-a1', ['Hello, Ravi!', 'नमस्ते, रवि!']),
  v('goodbye', 'goodbye', 'अलविदा', 'गुड-बाय', 'Greetings', 'pre-a1', ['Goodbye, see you tomorrow.', 'अलविदा, कल मिलते हैं।']),
  v('please', 'please', 'कृपया', 'प्लीज़', 'Greetings', 'pre-a1', ['Water, please.', 'कृपया पानी दीजिए।']),
  v('thank-you', 'thank you', 'धन्यवाद', 'थैंक यू', 'Greetings', 'pre-a1', ['Thank you very much.', 'बहुत धन्यवाद।']),
  v('sorry', 'sorry', 'माफ़ कीजिए', 'सॉरी', 'Greetings', 'pre-a1', ['Sorry, I am late.', 'माफ़ कीजिए, मुझे देर हो गई।']),
  v('yes', 'yes', 'हाँ', 'येस', 'Greetings', 'pre-a1'),
  v('no', 'no', 'नहीं', 'नो', 'Greetings', 'pre-a1'),
  v('morning', 'morning', 'सुबह', 'मॉर्निंग', 'Greetings', 'pre-a1', ['Good morning!', 'सुप्रभात!']),
  v('night', 'night', 'रात', 'नाइट', 'Greetings', 'pre-a1', ['Good night.', 'शुभ रात्रि।']),
  v('name', 'name', 'नाम', 'नेम', 'Greetings', 'pre-a1', ['My name is Sara.', 'मेरा नाम सारा है।']),
  // Numbers
  v('one', 'one', 'एक', 'वन', 'Numbers', 'pre-a1'),
  v('two', 'two', 'दो', 'टू', 'Numbers', 'pre-a1'),
  v('three', 'three', 'तीन', 'थ्री', 'Numbers', 'pre-a1'),
  v('four', 'four', 'चार', 'फ़ोर', 'Numbers', 'pre-a1'),
  v('five', 'five', 'पाँच', 'फ़ाइव', 'Numbers', 'pre-a1'),
  v('six', 'six', 'छह', 'सिक्स', 'Numbers', 'pre-a1'),
  v('seven', 'seven', 'सात', 'सेवन', 'Numbers', 'pre-a1'),
  v('eight', 'eight', 'आठ', 'एट', 'Numbers', 'pre-a1'),
  v('nine', 'nine', 'नौ', 'नाइन', 'Numbers', 'pre-a1'),
  v('ten', 'ten', 'दस', 'टेन', 'Numbers', 'pre-a1'),
  // Colours
  v('red', 'red', 'लाल', 'रेड', 'Colours', 'pre-a1'),
  v('blue', 'blue', 'नीला', 'ब्लू', 'Colours', 'pre-a1'),
  v('green', 'green', 'हरा', 'ग्रीन', 'Colours', 'pre-a1'),
  v('yellow', 'yellow', 'पीला', 'येलो', 'Colours', 'pre-a1'),
  v('black', 'black', 'काला', 'ब्लैक', 'Colours', 'pre-a1'),
  v('white', 'white', 'सफ़ेद', 'व्हाइट', 'Colours', 'pre-a1'),
  // Family
  v('mother', 'mother', 'माँ', 'मदर', 'Family', 'pre-a1', ['My mother is a teacher.', 'मेरी माँ शिक्षिका हैं।']),
  v('father', 'father', 'पिता', 'फ़ादर', 'Family', 'pre-a1'),
  v('brother', 'brother', 'भाई', 'ब्रदर', 'Family', 'pre-a1'),
  v('sister', 'sister', 'बहन', 'सिस्टर', 'Family', 'pre-a1', ['She is my sister.', 'वह मेरी बहन है।']),
  v('friend', 'friend', 'दोस्त', 'फ़्रेंड', 'Family', 'pre-a1', ['You are my friend.', 'तुम मेरे दोस्त हो।']),
  // Objects
  v('water', 'water', 'पानी', 'वॉटर', 'Things', 'pre-a1'),
  v('food', 'food', 'खाना', 'फ़ूड', 'Things', 'pre-a1'),
  v('book', 'book', 'किताब', 'बुक', 'Things', 'pre-a1'),
  v('phone', 'phone', 'फ़ोन', 'फ़ोन', 'Things', 'pre-a1'),
  // A1 shopping & daily life
  v('rice', 'rice', 'चावल', 'राइस', 'Food & shopping', 'a1', ['I want two kilos of rice.', 'मुझे दो किलो चावल चाहिए।']),
  v('milk', 'milk', 'दूध', 'मिल्क', 'Food & shopping', 'a1'),
  v('tea', 'tea', 'चाय', 'टी', 'Food & shopping', 'a1', ['I drink tea every morning.', 'मैं हर सुबह चाय पीता हूँ।']),
  v('price', 'price', 'दाम / कीमत', 'प्राइस', 'Food & shopping', 'a1', ['What is the price?', 'दाम क्या है?']),
  v('cheap', 'cheap', 'सस्ता', 'चीप', 'Food & shopping', 'a1'),
  v('expensive', 'expensive', 'महँगा', 'एक्सपेन्सिव', 'Food & shopping', 'a1', ['It is too expensive.', 'यह बहुत महँगा है।']),
  v('buy', 'buy', 'खरीदना', 'बाय', 'Food & shopping', 'a1'),
  v('shop', 'shop', 'दुकान', 'शॉप', 'Food & shopping', 'a1'),
  v('left', 'left', 'बायाँ', 'लेफ़्ट', 'Directions', 'a1', ['Turn left.', 'बाएँ मुड़िए।']),
  v('right', 'right', 'दायाँ', 'राइट', 'Directions', 'a1', ['Turn right.', 'दाएँ मुड़िए।']),
  v('straight', 'straight', 'सीधा', 'स्ट्रेट', 'Directions', 'a1', ['Go straight.', 'सीधे जाइए।']),
  v('ticket', 'ticket', 'टिकट', 'टिकट', 'Travel', 'a1'),
  // A2
  v('yesterday', 'yesterday', 'बीता हुआ कल', 'येस्टरडे', 'Time', 'a2'),
  v('tomorrow', 'tomorrow', 'आने वाला कल', 'टुमॉरो', 'Time', 'a2'),
  v('appointment', 'appointment', 'अपॉइंटमेंट / मिलने का समय', 'अपॉइंटमेंट', 'Services', 'a2', ['I have an appointment at ten.', 'मेरा दस बजे अपॉइंटमेंट है।']),
  v('should', 'should', 'चाहिए (सलाह)', 'शुड', 'Modals', 'a2'),
  v('must', 'must', 'ज़रूर / अनिवार्य', 'मस्ट', 'Modals', 'a2'),
  // B1
  v('experience', 'experience', 'अनुभव', 'एक्सपीरियंस', 'Work & opinion', 'b1', ['I have experience in sales.', 'मुझे बिक्री का अनुभव है।']),
  v('opinion', 'opinion', 'राय', 'ओपिनियन', 'Work & opinion', 'b1', ['In my opinion, it is a good idea.', 'मेरी राय में यह अच्छा विचार है।']),
  v('problem', 'problem', 'समस्या', 'प्रॉब्लम', 'Work & opinion', 'b1'),
  v('however', 'however', 'फिर भी / लेकिन', 'हाउएवर', 'Connectors', 'b1', ['It is cheap; however, it is slow.', 'यह सस्ता है; लेकिन धीमा है।']),
  v('although', 'although', 'हालाँकि', 'ऑल्दो', 'Connectors', 'b1'),
  // B2 / C1
  v('apply', 'apply', 'आवेदन करना', 'अप्लाई', 'Work & opinion', 'b2', ['I would apply for that job.', 'मैं उस नौकरी के लिए आवेदन करूँगा।']),
  v('request', 'request', 'अनुरोध करना', 'रिक्वेस्ट', 'Formal English', 'c1', ['I would like to request a meeting.', 'मैं मीटिंग का अनुरोध करना चाहता हूँ।']),
  v('investigate', 'investigate', 'जाँच करना', 'इन्वेस्टिगेट', 'Formal English', 'c1'),
  v('obtain', 'obtain', 'प्राप्त करना', 'ऑब्टेन', 'Formal English', 'c1'),
  v('grateful', 'grateful', 'आभारी', 'ग्रेटफ़ुल', 'Formal English', 'c1', ['I would be grateful for your help.', 'आपकी मदद के लिए मैं आभारी रहूँगा।']),
];

export const VOCAB_BY_ID: Record<string, VocabItem> = Object.fromEntries(VOCAB.map((x) => [x.id, x]));
export const VOCAB_THEMES = [...new Set(VOCAB.map((x) => x.theme))];
