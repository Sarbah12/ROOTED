export const COLORS = {
  background: '#0C1210',
  surface: '#13201B',
  surfaceElevated: '#182922',
  surfaceHighlight: '#1E332B',
  border: '#294036',
  borderLight: '#20352D',
  gold: '#8A6236',
  goldLight: '#B98D49',
  goldDim: '#5F4427',
  text: '#F2F5F1',
  textSecondary: '#C0CDC6',
  textMuted: '#8A9A93',
  success: '#79C3B0',
  danger: '#C46A54',
  info: '#5D7A66',
  warning: '#B98D49',
  overlay: 'rgba(12, 18, 16, 0.85)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  round: 999,
} as const;

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

export type Testament = 'OT' | 'NT';
export type Book = {
  id: string;
  name: string;
  chapters: number;
  testament: Testament;
};

export type Verse = {
  verse: number;
  text: string;
};

export type Devotional = {
  id: number;
  date: string;
  title: string;
  verse: string;
  content: string;
  reflectionQuestions: string[];
  prayer: string;
  readingTime: string;
};

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export type Note = {
  id: number;
  title: string;
  reference: string;
  content: string;
  tags: string[];
  date: string;
  color: string;
};

export type PrayerStatus = 'unanswered' | 'answered' | 'ongoing';

export type PrayerEntry = {
  id: number;
  title: string;
  category: string;
  content: string;
  status: PrayerStatus;
  date: string;
  verse: string;
};

export const BOOKS: Book[] = [
  { id: 'gen', name: 'Genesis', chapters: 50, testament: 'OT' },
  { id: 'exo', name: 'Exodus', chapters: 40, testament: 'OT' },
  { id: 'lev', name: 'Leviticus', chapters: 27, testament: 'OT' },
  { id: 'num', name: 'Numbers', chapters: 36, testament: 'OT' },
  { id: 'deu', name: 'Deuteronomy', chapters: 34, testament: 'OT' },
  { id: 'jos', name: 'Joshua', chapters: 24, testament: 'OT' },
  { id: 'jdg', name: 'Judges', chapters: 21, testament: 'OT' },
  { id: 'rut', name: 'Ruth', chapters: 4, testament: 'OT' },
  { id: 'psa', name: 'Psalms', chapters: 150, testament: 'OT' },
  { id: 'pro', name: 'Proverbs', chapters: 31, testament: 'OT' },
  { id: 'ecc', name: 'Ecclesiastes', chapters: 12, testament: 'OT' },
  { id: 'isa', name: 'Isaiah', chapters: 66, testament: 'OT' },
  { id: 'jer', name: 'Jeremiah', chapters: 52, testament: 'OT' },
  { id: 'mat', name: 'Matthew', chapters: 28, testament: 'NT' },
  { id: 'mrk', name: 'Mark', chapters: 16, testament: 'NT' },
  { id: 'luk', name: 'Luke', chapters: 24, testament: 'NT' },
  { id: 'jhn', name: 'John', chapters: 21, testament: 'NT' },
  { id: 'act', name: 'Acts', chapters: 28, testament: 'NT' },
  { id: 'rom', name: 'Romans', chapters: 16, testament: 'NT' },
  { id: '1co', name: '1 Corinthians', chapters: 16, testament: 'NT' },
  { id: '2co', name: '2 Corinthians', chapters: 13, testament: 'NT' },
  { id: 'gal', name: 'Galatians', chapters: 6, testament: 'NT' },
  { id: 'eph', name: 'Ephesians', chapters: 6, testament: 'NT' },
  { id: 'phi', name: 'Philippians', chapters: 4, testament: 'NT' },
  { id: 'col', name: 'Colossians', chapters: 4, testament: 'NT' },
  { id: 'heb', name: 'Hebrews', chapters: 13, testament: 'NT' },
  { id: 'jas', name: 'James', chapters: 5, testament: 'NT' },
  { id: '1pe', name: '1 Peter', chapters: 5, testament: 'NT' },
  { id: 'rev', name: 'Revelation', chapters: 22, testament: 'NT' },
];

export const SAMPLE_VERSES: Record<string, Verse[]> = {
  'jhn-3': [
    {
      verse: 1,
      text: 'Now there was a Pharisee, a man named Nicodemus who was a member of the Jewish ruling council.',
    },
    {
      verse: 2,
      text: 'He came to Jesus at night and said, "Rabbi, we know that you are a teacher who has come from God. For no one could perform the signs you are doing if God were not with him."',
    },
    {
      verse: 3,
      text: 'Jesus replied, "Very truly I tell you, no one can see the kingdom of God unless they are born again."',
    },
    {
      verse: 4,
      text: '"How can someone be born when they are old?" Nicodemus asked. "Surely they cannot enter a second time into their mother\'s womb to be born!"',
    },
    {
      verse: 5,
      text: 'Jesus answered, "Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit."',
    },
    {
      verse: 6,
      text: '"Flesh gives birth to flesh, but the Spirit gives birth to spirit."',
    },
    {
      verse: 7,
      text: '"You should not be surprised at my saying, \'You must be born again.\'"',
    },
    {
      verse: 8,
      text: '"The wind blows wherever it pleases. You hear its sound, but you cannot tell where it comes from or where it is going. So it is with everyone born of the Spirit."',
    },
    {
      verse: 9,
      text: '"How can this be?" Nicodemus asked.',
    },
    {
      verse: 10,
      text: '"You are Israel\'s teacher," said Jesus, "and do you not understand these things?"',
    },
    {
      verse: 16,
      text: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."',
    },
    {
      verse: 17,
      text: '"For God did not send his Son into the world to condemn the world, but to save the world through him."',
    },
  ],
};

export const DEVOTIONALS: Devotional[] = [
  {
    id: 1,
    date: 'Today',
    title: 'Walking in His Light',
    verse: '"Your word is a lamp for my feet, a light on my path." - Psalm 119:105',
    content: `Every morning brings new choices, new paths to walk. In moments of uncertainty, God's Word serves as a dependable guide - not just for the big decisions, but for the small daily steps that shape our character.

Consider how a lamp works: it doesn't illuminate the entire road ahead at once. It gives just enough light for the next step. That is how faith often works - trusting in what is revealed now, while remaining confident that the path ahead is known by the One who placed the lamp in your hands.

Today, before making decisions, ask: what does Scripture say? What wisdom has God already provided? The answer is often closer than we think.`,
    reflectionQuestions: [
      'In what area of your life do you most need guidance today?',
      'How can you make Scripture more central to your daily decisions?',
      'What is one step of obedience you can take right now?',
    ],
    prayer:
      'Lord, illuminate my path today. When I am uncertain, draw me to Your Word. Help me trust the light You give, even when I cannot see far ahead. Amen.',
    readingTime: '4 min',
  },
  {
    id: 2,
    date: 'Yesterday',
    title: 'The Peace That Surpasses',
    verse:
      '"And the peace of God, which transcends all understanding, will guard your hearts and minds in Christ Jesus." - Philippians 4:7',
    content: `Peace is perhaps the most sought-after yet elusive of human experiences. We search for it in circumstances, relationships, and achievements - yet Paul writes from a prison cell about a peace that surpasses understanding.

This is not the peace of resolved problems or comfortable circumstances. It is the peace that comes from a settled relationship with God - the confidence that He is sovereign, that He is good, and that He holds tomorrow.

The Greek word for "guard" here is a military term - as if peace stands as a sentinel at the gates of your heart, turning away anxiety and fear. This peace is not something you manufacture; it is something you receive, as you present your requests to God with thanksgiving.`,
    reflectionQuestions: [
      'What anxieties are you carrying that you need to surrender to God?',
      'How does gratitude affect your experience of peace?',
    ],
    prayer:
      'Father, I release my worries to You. Guard my heart and mind with Your peace today. Help me trust that You hold all things in Your hands. Amen.',
    readingTime: '5 min',
  },
];

// Quiz questions now live in constants/quiz.ts, tagged by book and topic.

export const VERSE_OF_THE_DAY = {
  text: '"I can do all things through Christ who strengthens me."',
  reference: 'Philippians 4:13',
  theme: 'Strength',
} as const;

export const READING_PLANS = [
  { id: 1, name: 'Bible in a Year', duration: '365 days', progress: 0.23, color: '#2E6A5C' },
  { id: 2, name: 'New Testament in 90 Days', duration: '90 days', progress: 0.58, color: '#8A6236' },
  { id: 3, name: 'Psalms & Proverbs', duration: '60 days', progress: 0.12, color: '#5D7A66' },
] as const;

export const NOTE_COLORS = ['#2E6A5C', '#8A6236', '#5D7A66', '#B98D49', '#C46A54'] as const;

export const SAMPLE_NOTES: Note[] = [
  {
    id: 1,
    title: 'Faith Without Works',
    reference: 'James 2:14-26',
    content:
      'James argues that genuine faith is evidenced by action. This is not salvation by works but the fruit of true saving faith. A dead faith produces no fruit.',
    tags: ['Faith', 'Works', 'James'],
    date: 'Apr 7, 2026',
    color: '#2E6A5C',
  },
  {
    id: 2,
    title: 'The Armor of God',
    reference: 'Ephesians 6:10-18',
    content:
      'Paul uses Roman soldier imagery to describe spiritual readiness. Each piece of armor corresponds to a spiritual virtue: truth, righteousness, readiness, faith, salvation, the Word, and prayer.',
    tags: ['Spiritual Warfare', 'Prayer', 'Ephesians'],
    date: 'Apr 3, 2026',
    color: '#8A6236',
  },
  {
    id: 3,
    title: 'Sermon on the Mount - Beatitudes',
    reference: 'Matthew 5:1-12',
    content:
      'The Beatitudes describe the character of citizens of God\'s kingdom. Counterintuitive by worldly standards - the poor in spirit, mourning, and meek are declared "blessed." Kingdom values invert cultural expectations.',
    tags: ['Sermon', 'Kingdom', 'Matthew'],
    date: 'Mar 29, 2026',
    color: '#5D7A66',
  },
];

export const PRAYER_CATEGORIES = [
  'Praise',
  'Thanksgiving',
  'Intercession',
  'Personal',
  'Confession',
  'Guidance',
] as const;

export const PRAYER_STATUS_LABELS: Record<PrayerStatus, string> = {
  unanswered: 'Trusting',
  answered: 'Answered',
  ongoing: 'Ongoing',
};

export const PRAYER_STATUS_COLORS: Record<PrayerStatus, string> = {
  answered: COLORS.success,
  ongoing: COLORS.info,
  unanswered: COLORS.textMuted,
};

export const SAMPLE_PRAYERS: PrayerEntry[] = [
  {
    id: 1,
    title: 'Healing for a friend',
    category: 'Intercession',
    content:
      "Lord, I pray for Michael's recovery. Bring Your healing touch upon him and give his family peace during this time.",
    status: 'ongoing',
    date: 'Apr 8, 2026',
    verse: 'James 5:15',
  },
  {
    id: 2,
    title: 'Gratitude for new job',
    category: 'Thanksgiving',
    content:
      'Thank You Lord for opening this door. I see Your provision clearly and I am grateful for Your faithfulness.',
    status: 'answered',
    date: 'Apr 1, 2026',
    verse: 'Philippians 4:6',
  },
  {
    id: 3,
    title: 'Wisdom for a decision',
    category: 'Guidance',
    content:
      'Father, I need Your wisdom regarding the next steps in my career. Guide me by Your Spirit and confirm Your will.',
    status: 'unanswered',
    date: 'Mar 30, 2026',
    verse: 'James 1:5',
  },
];

export const QUIZ_DIFFICULTY_COLORS: Record<QuizDifficulty, string> = {
  Easy: COLORS.success,
  Medium: COLORS.warning,
  Hard: COLORS.danger,
};
