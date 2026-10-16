import type { Stage, StageId } from '../types';

export const STAGES: Stage[] = [
  {
    id: 'pre-a1',
    label: 'Zero English / Pre-A1',
    labelHi: 'ज़ीरो इंग्लिश — बिल्कुल शुरुआत',
    cefr: 'Pre-A1',
    descriptionHi:
      'अगर आपको अंग्रेज़ी बिल्कुल नहीं आती, तो यहीं से शुरू करें। हम अक्षर, आवाज़ें, पहले शब्द और छोटे-छोटे वाक्य सिखाएँगे।',
  },
  {
    id: 'a1',
    label: 'Beginner / A1',
    labelHi: 'शुरुआती (A1)',
    cefr: 'A1',
    descriptionHi: 'रोज़मर्रा की ज़रूरतों के आसान वाक्य: अपना परिचय, खरीदारी, खाना, रास्ता पूछना।',
  },
  {
    id: 'a2',
    label: 'Elementary / A2',
    labelHi: 'बुनियादी (A2)',
    cefr: 'A2',
    descriptionHi: 'बीती हुई बातें, सलाह और अनुमति, यात्रा, अपॉइंटमेंट और छोटे संदेश।',
  },
  {
    id: 'b1',
    label: 'Intermediate / B1',
    labelHi: 'मध्यम (B1)',
    cefr: 'B1',
    descriptionHi: 'अपने अनुभव और राय बताना, समस्या समझाना, ईमेल लिखना और बातचीत में हिस्सा लेना।',
  },
  {
    id: 'b2',
    label: 'Upper-intermediate / B2',
    labelHi: 'उच्च-मध्यम (B2)',
    cefr: 'B2',
    descriptionHi: 'मीटिंग, इंटरव्यू, प्रेज़ेंटेशन और बहस: जटिल वाक्य और सटीक अभिव्यक्ति।',
  },
  {
    id: 'c1',
    label: 'Advanced / C1',
    labelHi: 'उन्नत (C1)',
    cefr: 'C1',
    descriptionHi: 'बारीक अर्थ, लहजा, औपचारिक लेखन और पेशेवर संवाद।',
  },
];

export const STAGE_BY_ID: Record<StageId, Stage> = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<
  StageId,
  Stage
>;

export const CEFR_NOTE_HI =
  'ये स्तर CEFR (यूरोप का भाषा-स्तर ढाँचा) से मोटे तौर पर मेल खाते हैं। यह कोई आधिकारिक प्रमाणपत्र या आधिकारिक CEFR स्कोर नहीं है।';
