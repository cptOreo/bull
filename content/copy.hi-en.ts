import type { CopySchema } from "./copy.en";

export const copyHiEn: CopySchema = {
  common: {
    appName: "Bull",
    tagline: "Numbers aur clear concepts ke zariye companies ko samjhein",
    asOf: "As of",
    source: "Source",
    close: "Band karein",
    back: "Peechhe",
    continue: "Aage badhein",
    retry: "Dobara koshish karein",
    loading: "Load ho raha hai...",
  },
  nav: {
    chat: "Chat",
    shortlist: "Shortlist",
    compare: "Compare",
    academy: "Learn",
    progress: "Progress",
    method: "Bull kaise kaam karta hai",
    ariaNav: "Primary navigation",
    languageToggleAria: "Language switch karein English aur Hinglish ke beech",
  },
  onboarding: {
    welcomeTitle: "Aapke goals ke hisaab se fit baithne wali companies dhundein",
    welcomeSubtitle:
      "Apni investment preferences set karne ke liye 5 aasan sawalon ke jawab dein, ya kisi bhi covered stock ko direct dekhein.",
    getStartedButton: "Shuru Karein",
    assumedNotice: "Andaze se set kiya gaya — kabhi bhi change kar sakte hain",
    questions: {
      goal: {
        title: "Primary Goal",
        question:
          "Is paise ke liye sabse zaroori kya hai: wealth grow karna, regular dividends, stocks samajhna ya capital protect karna?",
        whyAsked: "Stability, growth, valuation aur income ke base weights tay karta hai.",
        options: {
          grow_wealth: "Lambi muddat mein wealth grow karna",
          dividends: "Regular dividend income paana",
          learn: "Companies kaise kaam karti hain sikhna",
          preserve: "Apni capital ko surakshit rakhna",
        },
      },
      horizon: {
        title: "Time Horizon",
        question: "Aapko is paise ki zaroorat kab tak pad sakti hai?",
        whyAsked: "Growth potential aur price stability ke beech balance set karta hai.",
        options: {
          "1_3y": "1 se 3 saal",
          "3_5y": "3 se 5 saal",
          "5_10y": "5 se 10 saal",
          "10y_plus": "10 saal ya usse zyada",
        },
      },
      riskComfort: {
        title: "Risk Comfort",
        question:
          "Agar stock prices mein girawat aaye, toh bina panic kiye kitna drop jhel sakte hain: lagbhag 10%, 20%, 30% ya unsure?",
        whyAsked: "Volatility aur historical drawdown ko kitna dhyan dena hai ye tay karta hai.",
        options: {
          low: "Lagbhag 10% drop",
          medium: "Lagbhag 20% drop",
          high: "30% drop ya zyada",
          unsure: "Sure nahi hain (cautious approach)",
        },
      },
      experience: {
        title: "Market Experience",
        question: "Stock market mein abhi tak aapka kitna experience raha hai?",
        whyAsked: "Aapke hisaab se concepts aur explanation ki depth decide karta hai.",
        options: {
          none: "Direct stocks mein bilkul naye hain",
          few: "Kuch companies mein invest kiya hai",
          sip: "Sirf mutual fund SIPs kiye hain",
        },
      },
      locale: {
        title: "Language Preference",
        question: "Aap explanations aur calculations kis language mein chahte hain?",
        whyAsked: "Chat, lessons aur metrics ki display bhasha set karta hai.",
        options: {
          en: "English",
          "hi-en": "Hinglish",
        },
      },
    },
  },
  chat: {
    composerPlaceholder: "Kisi company ke baare mein poochein, compare karein, ya shortlist maangein...",
    sendButton: "Bhejein",
    starterPromptsTitle: "Ye pooch kar dekhein:",
    starterPrompt1: "Mere liye stocks dhundo",
    starterPrompt2: "ITC ka debt samjhao",
    starterPrompt3: "Dividends ke liye TCS vs Infosys",
    clarificationTitle: "Kya aap thoda aur detail mein batana chahenge?",
    editProfileChip: "Preferences badlein",
    assumedChipPrefix: "Assumed: ",
    changeChip: "Badlein",
    emptyStateText:
      "Apni preferences ke mutabiq companies dekhne ya Nifty 50 ke 12 covered stocks ko explore karne ke liye conversation shuru karein.",
    resetConversation: "Naye sirey se shuru karein",
    errorCardTitle: "Jawab Banane Mein Dikkat Aayi",
    errorCardBody: "Is turn ka answer generate karne mein issue hua. Aapka data bilkul safe hai.",
  },
  shortlist: {
    title: "Aapki Shortlist",
    summarySuffix: "aapki di hui preferences ke mutabiq compare ki gayi hain.",
    thinFitBanner:
      "Aapke profile criteria par 3 se kam companies qualify hui hain. Sabse kareebi matching companies dikhai ja rahi hain.",
    diversityNoteTitle: "Alag alag sectors kyun dikhaye gaye hain",
    diversityNoteBody:
      "Mukhtalif industries ki companies dekhne se alag alag business models samajhne mein aasani hoti hai aur risk ek hi jagah nahi rehta.",
    howChosenTitle: "Ye companies kaise choose hui",
    howChosenIntro:
      "Paanch saal ke financial data aur aapke profile weights ke mathematical formula se tay ki gayi hain. Koi personal opinion nahi hai.",
    sectorCapNote: "Kisi bhi ek sector se 2 se zyada companies shortlist mein shamil nahi ki jaati.",
    factorBarsTitle: "Key Factor Contributions",
    detailsButton: "Details dekhein",
    learnRatioButton: "Iske peeche ka ratio samjhein",
    emptyState: "Abhi tak koi shortlist nahi bani. Chat mein preferences share karein taaki matching companies dikhein.",
  },
  stockDetail: {
    latestCloseLabel: "Latest Close",
    moveLabel: "1-Session Move",
    marketCapLabel: "Market Capitalisation",
    chartTitle: "5-Year Normalized Price vs Nifty 50",
    chartSubtitle: "Donon ko chart ki shuruat par 100 par index kiya gaya hai",
    corporateActionAlert:
      "Corporate action adjustment: is event se pehle aur baad ke prices direct compare nahi kiye ja sakte.",
    ratiosTitle: "Key Financial Ratios",
    riskFlagsTitle: "Dhyan dene yogya Risk Points",
    newsTitle: "Recent News aur Announcements",
    newsEmpty: "Is snapshot mein pichhle 90 dinon ki koi taza news uplabdh nahi hai.",
    conceptsTitle: "Is company ke numbers se jo concepts aap seekh sakte hain",
    nameTheRiskTitle: "Risk Pehchaniye",
    nameTheRiskSubtitle:
      "Company ke financial numbers dekh kar batayein ki sabse badi chinta kya ho sakti hai.",
    limitationsTitle: "Ye data kya nahi batata",
    depositsExcludedNote:
      "Banks aur financial institutions ke mamle mein customer deposits ko debt calculation se bahar rakha jata hai.",
  },
  compare: {
    title: "Side-by-Side Comparison",
    subtitle: "Bina kisi bias ya ranking ke do companies ko pure numbers par compare karein",
    selectCompanyA: "Pehli company",
    selectCompanyB: "Doosri company",
    identicalCompanyError: "Kripya compare karne ke liye do alag alag companies chunein.",
    profileFitHeader: "Aapke profile ke hisaab se kaisa fit hai",
    sectionValuation: "Valuation",
    sectionProfitability: "Profitability",
    sectionDebt: "Debt & Solvency",
    sectionDividends: "Dividends",
    sectionPriceHistory: "Price History",
    noWinnerNotice:
      "Bull koi winner announce nahi karta. Donon taraf ke numbers factual hain, nateeja aap khud nikaalein.",
  },
  academy: {
    title: "Academy",
    subtitle: "Real company data ke sath investing ke 8 zaroori concepts seekhein",
    xpHeaderLabel: "Total Experience Points",
    levelLabel: "Level",
    streakLabel: "Day Streak",
    streakKeepAlive: "Apna streak barkarar rakhne ke liye aaj ek check solve karein",
    dailyQuizButton: "Aaj Ka Quiz",
    quizTitle: "Daily Concept Check",
    conceptMapTitle: "Concept Map",
    lockedHintPrefix: "Kab unlock hota hai: ",
    unlockedLabel: "Unlocked",
    masteryStateLocked: "Locked",
    masteryStateSeen: "Dekha gaya",
    masteryStatePractised: "Practice kiya",
    masteryStateApplied: "Apply kiya",
    masteryStateMastered: "Master kiya",
    badgesShelfTitle: "Aapke Badges",
  },
  progress: {
    title: "Aapki Learning Progress",
    subtitle: "Aap vs aapka pehla din: dekhein aapka market understanding kaise grow hua",
    xpEarned: "XP Earned",
    conceptsMastered: "Concepts Mastered",
    bestStreak: "Best Streak",
    badgesEarned: "Badges Earned",
    activityLogTitle: "Recent Learning Activity",
    emptyActivity: "Abhi koi activity record nahi hui. Stock page kholein ya lesson complete karein.",
  },
  method: {
    title: "Bull Kaise Kaam Karta Hai",
    subtitle: "Data provenance, scoring methodology aur educational limitations",
    scoringTitle: "Deterministic Scoring",
    scoringBody:
      "Shortlists financial statements ke fixed mathematical formulas se calculate hoti hain. Koi subjective advice ya black box formula nahi hai.",
    provenanceTitle: "Data Kahan Se Aaya",
    provenanceBody:
      "Saara financial data audited annual reports, Screener.in, Google Finance aur exchange filings se manually record kiya gaya hai.",
    datedDataTitle: "Data Dated Kyun Hai",
    datedDataBody:
      "Investor education norms ke tahat, market data ek historical date par freeze rehta hai. Har number ke sath uski exact as-of date dikhai jaati hai.",
    safetyTitle: "Safety aur Educational Hadh",
    safetyBody:
      "Bull pure educational learning tool hai. Hum trading calls, price forecasts ya personal portfolio advice bilkul nahi dete.",
    coverageTitle: "Covered Companies",
    coverageBody:
      "Bull Nifty 50 index ki 12 alag alag sectors ki pramukh companies ko cover karta hai.",
  },
  disclaimers: {
    educationNote:
      "Sirf educational purpose ke liye. Bull koi financial advice ya trade recommendation nahi deta. Sabhi calculations aur metrics sirf sikhne ke liye hain.",
    sebiNotice:
      "Dhyan de: Bull SEBI ke sath investment adviser ya research analyst ke roop mein registered nahi hai. Kisi bhi output ko financial salah na samjhein.",
    generalDisclaimer:
      "Pichhla financial record aane wale samay ka nateeja tay nahi karta. Market investments mein risk rehta hai.",
  },
  limitations: {
    title: "Zaroori Limitations",
    item1: "Data snapshot date tak ke annual reports aur filings par aadharit hai.",
    item2: "Management quality, governance aur qualitative baaton ka score nahi banta.",
    item3: "Shortlists sirf factual financial numbers ke formula se tay hoti hain.",
    item4: "Prices intra-day trading ya real-time market fluctuations reflect nahi karte.",
  },
  errors: {
    compositionFailureTitle: "Jawab Banane Mein Dikkat",
    compositionFailureBody:
      "Is sawal ka jawab banane mein issue aaya. Aapka data bilkul safe aur unchange hai.",
    retryButton: "Dobara koshish karein",
    corruptDataBanner: "Saved data corrupt hone ke karan progress reset karni padi.",
    privateModeBanner:
      "Storage access na milne ke karan data sirf is session ke liye memory mein rahega.",
    notFoundTitle: "Page Nahi Mila",
    notFoundBody: "Jo page aap dhoondh rahe hain wo maujood nahi hai.",
    genericError: "Ek anjaan error hua. Kripya refresh karein ya dobara koshish karein.",
  },
};

export default copyHiEn;
