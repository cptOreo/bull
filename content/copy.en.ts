export const copyEn = {
  common: {
    appName: "Bull",
    tagline: "Understand companies through numbers and clear concepts",
    asOf: "As of",
    source: "Source",
    close: "Close",
    back: "Back",
    continue: "Continue",
    retry: "Try again",
    loading: "Loading...",
  },
  nav: {
    chat: "Chat",
    shortlist: "Shortlist",
    academy: "Learn",
    progress: "Progress",
    method: "How Bull works",
    ariaNav: "Primary navigation",
    languageToggleAria: "Switch language between English and Hinglish",
  },
  onboarding: {
    welcomeTitle: "Find companies that match what matters to you",
    welcomeSubtitle:
      "Answer five quick questions to set your investment preferences, or explore any covered stock directly.",
    getStartedButton: "Get Started",
    assumedNotice: "Assumed preference — tap to adjust anytime",
    questions: {
      goal: {
        title: "Primary Goal",
        question:
          "What matters most for this money: growing wealth, regular dividends, learning how stocks work, or protecting capital?",
        whyAsked: "Sets the baseline weights for stability, growth, valuation, and income.",
        options: {
          grow_wealth: "Grow wealth over time",
          dividends: "Regular dividend income",
          learn: "Learn how companies work",
          preserve: "Protect what I have",
        },
      },
      horizon: {
        title: "Time Horizon",
        question: "When might you need this money?",
        whyAsked: "Adjusts the balance between growth potential and price stability.",
        options: {
          "1_3y": "1 to 3 years",
          "3_5y": "3 to 5 years",
          "5_10y": "5 to 10 years",
          "10y_plus": "10 years or more",
        },
      },
      riskComfort: {
        title: "Risk Comfort",
        question:
          "If stock prices dipped, what drop could you live with comfortably without exiting: about 10%, about 20%, about 30%, or not sure?",
        whyAsked: "Determines how heavily volatility and historical drawdowns are weighted.",
        options: {
          low: "Around 10% drop",
          medium: "Around 20% drop",
          high: "30% drop or more",
          unsure: "Not sure (cautious)",
        },
      },
      experience: {
        title: "Market Experience",
        question: "How much experience do you have with the stock market so far?",
        whyAsked: "Tailors educational starting points and explanation depth.",
        options: {
          none: "Completely new to individual stocks",
          few: "Have invested in a few companies",
          sip: "Only invested via mutual fund SIPs",
        },
      },
      locale: {
        title: "Language Preference",
        question: "How would you prefer explanations and numbers delivered?",
        whyAsked: "Sets the interface language across chat, lessons, and metrics.",
        options: {
          en: "English",
          "hi-en": "Hinglish",
        },
      },
    },
  },
  chat: {
    composerPlaceholder: "Ask about a company, compare two stocks, or request a shortlist...",
    sendButton: "Send",
    starterPromptsTitle: "Try asking:",
    starterPrompt1: "Find stocks for me",
    starterPrompt2: "Explain ITC's debt",
    starterPrompt3: "TCS vs Infosys for dividends",
    clarificationTitle: "Could you clarify what you would like to explore?",
    editProfileChip: "Edit preferences",
    assumedChipPrefix: "Assumed: ",
    changeChip: "Change",
    emptyStateText:
      "Start a conversation to discover companies aligned with your goals or inspect any of the 12 covered Nifty 50 stocks.",
    resetConversation: "Start fresh",
    errorCardTitle: "Response Generation Issue",
    errorCardBody: "Something went wrong building that answer. Your data is unchanged.",
  },
  shortlist: {
    title: "Your Shortlist",
    summarySuffix: "compared with the preferences you provided.",
    thinFitBanner:
      "Fewer than three companies cleared the matching threshold for your current profile. Showing closest available matches.",
    diversityNoteTitle: "Why multiple sectors are represented",
    diversityNoteBody:
      "Presenting companies from distinct industries lets you compare differing business models without concentrating attention in a single economic sector.",
    howChosenTitle: "How these companies were selected",
    howChosenIntro:
      "Calculated deterministically from five-year financial data and your profile weights. No discretionary ranking.",
    sectorCapNote: "No single sector contributes more than two companies to any shortlist.",
    factorBarsTitle: "Top Factor Contributions",
    detailsButton: "See details",
    learnRatioButton: "Learn the ratio behind this",
    emptyState: "No shortlist generated yet. Complete intake in Chat to see matching companies.",
  },
  stockDetail: {
    latestCloseLabel: "Latest Close",
    moveLabel: "1-Session Move",
    marketCapLabel: "Market Capitalisation",
    chartTitle: "5-Year Normalized Price vs Nifty 50",
    chartSubtitle: "Both indexed to 100 at window start",
    corporateActionAlert:
      "Corporate action adjustment: prices before and after this event are not directly continuous.",
    ratiosTitle: "Key Financial Ratios",
    riskFlagsTitle: "Risk Points to Consider",
    newsTitle: "Recent News & Announcements",
    newsEmpty: "No recent news items within the 90-day window in this snapshot.",
    conceptsTitle: "Concepts you can learn from this company",
    nameTheRiskTitle: "Name the Risk",
    nameTheRiskSubtitle:
      "Review this company's financial indicators and identify the primary concern.",
    limitationsTitle: "What this data does not show",
    depositsExcludedNote:
      "For banks and lending institutions, customer deposits are excluded from debt calculations.",
  },
  compare: {
    title: "Side-by-Side Comparison",
    subtitle: "Compare two companies factually on the numbers without opinions",
    selectCompanyA: "First company",
    selectCompanyB: "Second company",
    identicalCompanyError: "Please choose two distinct companies to compare.",
    profileFitHeader: "How this relates to your profile",
    sectionValuation: "Valuation",
    sectionProfitability: "Profitability",
    sectionDebt: "Debt & Solvency",
    sectionDividends: "Dividends",
    sectionPriceHistory: "Price History",
    noWinnerNotice:
      "Bull presents side-by-side data without selecting a winner. Use these comparative metrics to inform your own study.",
  },
  academy: {
    title: "Academy",
    subtitle: "Master 8 fundamental investing concepts using real company figures",
    xpHeaderLabel: "Total Experience Points",
    levelLabel: "Level",
    streakLabel: "Day Streak",
    streakKeepAlive: "Answer one check today to keep your streak active",
    dailyQuizButton: "Today's Quiz",
    quizTitle: "Daily Concept Check",
    conceptMapTitle: "Concept Map",
    lockedHintPrefix: "Unlocks when: ",
    unlockedLabel: "Unlocked",
    masteryStateLocked: "Locked",
    masteryStateSeen: "Seen",
    masteryStatePractised: "Practised",
    masteryStateApplied: "Applied",
    masteryStateMastered: "Mastered",
    badgesShelfTitle: "Earned Badges",
  },
  progress: {
    title: "Your Learning Progress",
    subtitle: "Trace your conceptual understanding and milestones over time",
    xpEarned: "XP Earned",
    conceptsMastered: "Concepts Mastered",
    bestStreak: "Best Streak",
    badgesEarned: "Badges Earned",
    activityLogTitle: "Recent Learning Activity",
    emptyActivity: "No events recorded yet. Open a stock page or complete a lesson to begin.",
  },
  method: {
    title: "How Bull Works",
    subtitle: "Data provenance, calculation methodology, and educational boundaries",
    scoringTitle: "Deterministic Scoring",
    scoringBody:
      "Shortlists are calculated using fixed mathematical formulas from financial statements. No black boxes, subjective scores, or opaque algorithms.",
    provenanceTitle: "Data Provenance",
    provenanceBody:
      "All financial figures are manually transcribed from audited annual reports, Screener.in, Google Finance, and exchange filings.",
    datedDataTitle: "Why Data is Dated",
    datedDataBody:
      "In accordance with educational guidelines, market data is frozen as on a specific historical snapshot. Every number displays its exact as-of date.",
    safetyTitle: "Safety & Educational Purpose",
    safetyBody:
      "Bull is strictly an educational tool. We do not provide trading recommendations, price predictions, or personalised portfolio instructions.",
    coverageTitle: "Covered Companies",
    coverageBody:
      "Bull covers 12 constituent companies from the Nifty 50 across diverse economic sectors.",
  },
  disclaimers: {
    educationNote:
      "Educational simulator only. Bull does not advise on transactions or recommend securities. All calculations and metrics are provided strictly for educational purposes.",
    sebiNotice:
      "Notice: Bull is not registered with SEBI as an investment adviser or research analyst. Do not treat any output as financial counsel.",
    generalDisclaimer:
      "Past financial performance does not indicate future results. Investments are subject to market risks.",
  },
  limitations: {
    title: "Important Limitations",
    item1: "Data reflects annual reports and exchange filings up to the snapshot date.",
    item2: "Management quality, governance, and qualitative factors are not scored.",
    item3: "Shortlists are calculated deterministically from financial numbers alone.",
    item4: "Prices do not reflect intra-day swings or real-time trading sessions.",
  },
  errors: {
    compositionFailureTitle: "Answer Generation Issue",
    compositionFailureBody:
      "Something went wrong building that answer. Your data is unchanged.",
    retryButton: "Try again",
    corruptDataBanner: "Progress reset because saved data was unreadable.",
    privateModeBanner:
      "Storage unavailable. Progress is kept in memory for this session only.",
    notFoundTitle: "Page Not Found",
    notFoundBody: "The requested route does not exist.",
    genericError: "An unexpected error occurred. Please refresh or retry.",
  },
};

export type CopySchema = typeof copyEn;
export default copyEn;
