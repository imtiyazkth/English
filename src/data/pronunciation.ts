import type { PronunciationTopic } from '../types';

export const PRONUNCIATION_NOTE_HI =
  'हिंदी लिपि में दिए उच्चारण सिर्फ़ याद रखने का सहारा हैं, अंग्रेज़ी की सही ध्वनियों का पूरा विकल्प नहीं। हमेशा ऑडियो सुनें और दोहराएँ। लक्ष्य "अंग्रेज़ जैसा लहजा" नहीं, बल्कि साफ़ और समझ में आने वाली अंग्रेज़ी है — हर लहजा (भारतीय, ब्रिटिश, अमेरिकी) मान्य है।';

export const PRONUNCIATION: PronunciationTopic[] = [
  {
    id: 'v-w',
    title: 'V and W',
    titleHi: 'V और W की आवाज़ें',
    stage: 'pre-a1',
    bodyHi: [
      'कई हिंदी बोलने वालों के लिए V और W की आवाज़ें एक जैसी लगती हैं। यह कोई "ग़लती" नहीं, बस एक अलग भाषा की आदत है — और अभ्यास से आसानी से बदलती है।',
      'V: नीचे का होंठ ऊपर के दाँतों को हल्का छूता है, आवाज़ गूँजती है। W: दोनों होंठ गोल होते हैं और दाँत नहीं छूते।',
      'अभ्यास: शीशे में देखकर "vine" बोलें (नीचे का होंठ दाँतों से छूता है), फिर "wine" (होंठ गोल)।',
    ],
    examples: [
      { en: 'very', hint: 'V की आवाज़' },
      { en: 'wary', hint: 'W की आवाज़' },
      { en: 'vest / west' },
    ],
    pairs: [
      ['vine', 'wine'],
      ['very', 'wary'],
      ['vest', 'west'],
    ],
  },
  {
    id: 'th',
    title: 'The TH sounds',
    titleHi: 'TH की आवाज़ें (think, this)',
    stage: 'a1',
    bodyHi: [
      'TH की दो आवाज़ें हैं: बिना गूँज वाली (think, three) और गूँज वाली (this, that)। दोनों में जीभ की नोक हल्की-सी दाँतों के बीच या दाँतों के पीछे होती है।',
      'कई लोग इन्हें त/थ/द/ध की तरह बोलते हैं। अगर सामने वाला समझ जाए तो ठीक है, पर आप जीभ को दाँतों के बीच रखकर हवा निकालने का अभ्यास कर सकते हैं।',
    ],
    examples: [{ en: 'think' }, { en: 'three' }, { en: 'this' }, { en: 'that' }],
    pairs: [
      ['think', 'sink'],
      ['three', 'tree'],
    ],
  },
  {
    id: 'short-long-vowels',
    title: 'Short and long vowels',
    titleHi: 'छोटे और लंबे स्वर (ship / sheep)',
    stage: 'a1',
    bodyHi: [
      'अंग्रेज़ी में कई जोड़ियाँ सिर्फ़ स्वर की लंबाई/ढंग से अलग होती हैं: ship (छोटा "इ") और sheep (लंबा "ई")।',
      'छोटे स्वर को जल्दी और ढीला बोलें; लंबे स्वर को खींचकर, होंठ थोड़े फैलाकर।',
    ],
    examples: [{ en: 'ship' }, { en: 'sheep' }, { en: 'full' }, { en: 'fool' }],
    pairs: [
      ['ship', 'sheep'],
      ['full', 'fool'],
      ['sit', 'seat'],
    ],
  },
  {
    id: 's-clusters',
    title: 'Words starting with S + consonant',
    titleHi: 'S से शुरू होने वाले संयुक्त शब्द (school, speak)',
    stage: 'a1',
    bodyHi: [
      'school, speak, stop जैसे शब्दों की शुरुआत में स्वर नहीं आता। इन्हें "इस्कूल", "इस्पीक" की तरह बोलने की आदत कई लोगों में होती है; "s" के बाद तुरंत व्यंजन बोलें।',
      'अभ्यास: पहले सिर्फ़ "sss" खींचें, फिर बिना रुके "ss-school" बोलें।',
    ],
    examples: [{ en: 'school' }, { en: 'speak' }, { en: 'stop' }, { en: 'street' }],
  },
  {
    id: 'word-stress',
    title: 'Word stress',
    titleHi: 'शब्द पर ज़ोर (stress)',
    stage: 'a2',
    bodyHi: [
      'अंग्रेज़ी के लंबे शब्दों में एक हिस्से (syllable) पर ज़्यादा ज़ोर होता है: TEAcher, ho-TEL, com-PU-ter। ग़लत जगह ज़ोर देने से समझना मुश्किल हो सकता है।',
      'एक ही शब्द की स्पेलिंग कभी-कभी ज़ोर के साथ अर्थ बदलती है: REcord (संज्ञा) और reCORD (क्रिया)।',
    ],
    examples: [{ en: 'teacher' }, { en: 'hotel' }, { en: 'computer' }, { en: 'photograph' }],
  },
  {
    id: 'sentence-stress',
    title: 'Sentence stress and rhythm',
    titleHi: 'वाक्य में ज़ोर और लय',
    stage: 'a2',
    bodyHi: [
      'वाक्य में मुख्य शब्दों (संज्ञा, क्रिया, विशेषण) पर ज़ोर पड़ता है; छोटे शब्द (a, the, of, to) हल्के और तेज़ बोले जाते हैं।',
      'I WANT to GO to the MARket. — बड़े अक्षर वाले शब्द साफ़, बाक़ी हल्के।',
    ],
    examples: [{ en: 'I want to go to the market.' }, { en: 'Can you help me?' }],
  },
  {
    id: 'linking',
    title: 'Linking words together',
    titleHi: 'शब्दों को जोड़कर बोलना',
    stage: 'b1',
    bodyHi: [
      'तेज़ बोलचाल में शब्द आपस में जुड़ जाते हैं: "an apple" → "ऐन-ऐपल", "turn off" → "टर्न-ऑफ़"।',
      'शुरुआत में हर शब्द अलग-अलग साफ़ बोलें; फिर धीरे-धीरे जोड़ना सीखें।',
    ],
    examples: [{ en: 'an apple' }, { en: 'turn off the light' }, { en: 'pick it up' }],
  },
  {
    id: 'intonation',
    title: 'Intonation: questions and statements',
    titleHi: 'आवाज़ का उतार-चढ़ाव (intonation)',
    stage: 'b1',
    bodyHi: [
      'हाँ/नहीं वाले प्रश्नों के अंत में आवाज़ आम तौर पर ऊपर जाती है: Are you ready? ↗। सामान्य वाक्य के अंत में आवाज़ नीचे आती है: I am ready. ↘',
      'Wh-प्रश्नों (What, Where) में आवाज़ आम तौर पर नीचे आती है: Where do you live? ↘',
    ],
    examples: [{ en: 'Are you ready?' }, { en: 'I am ready.' }, { en: 'Where do you live?' }],
  },
  {
    id: 'endings',
    title: 'Word endings: -s and -ed',
    titleHi: 'शब्दों के अंत: -s और -ed',
    stage: 'a2',
    bodyHi: [
      '-s की तीन आवाज़ें हैं: cats (स), dogs (ज़), buses (इज़)। -ed की भी तीन: worked (ट), played (ड), wanted (इड)।',
      'अंत की आवाज़ें छोड़ देने से "He work" और "He works" में फ़र्क़ मिट जाता है, इसलिए अंत तक साफ़ बोलें।',
    ],
    examples: [{ en: 'cats' }, { en: 'dogs' }, { en: 'buses' }, { en: 'worked' }, { en: 'played' }, { en: 'wanted' }],
  },
  {
    id: 'names-numbers-dates',
    title: 'Names, numbers and dates',
    titleHi: 'नाम, संख्याएँ और तारीख़ें',
    stage: 'a1',
    bodyHi: [
      'संख्याओं में ज़ोर की जगह फ़र्क़ डालती है: thirTEEN (13) और THIRty (30) — -teen पर ज़ोर, -ty पर नहीं।',
      'तारीख़: 14 October — "the fourteenth of October" या "October the fourteenth"। फ़ोन नंबर एक-एक अंक करके बोलें।',
      'अपना नाम धीरे और साफ़ बोलें; ज़रूरत हो तो स्पेलिंग बताएँ: "R-A-V-I"।',
    ],
    examples: [{ en: 'thirteen' }, { en: 'thirty' }, { en: 'fourteen' }, { en: 'forty' }],
    pairs: [
      ['thirteen', 'thirty'],
      ['fourteen', 'forty'],
      ['fifteen', 'fifty'],
    ],
  },
];
