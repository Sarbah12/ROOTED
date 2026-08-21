/**
 * Quiz bank.
 *
 * Every question is tagged with the book it comes from and one or more topics,
 * so the same bank powers both quiz modes: study John, then quiz on John — or
 * study the parables across the gospels, then quiz on Parables.
 */

import { BIBLE_BOOKS_BY_ID } from '@/constants/bible-books';
import { QUIZ_BANK } from '@/constants/quiz-bank';
import { QUIZ_TOPIC_BANK } from '@/constants/quiz-topics';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  reference: string;
  difficulty: QuizDifficulty;
  /** Book id from BIBLE_BOOKS, e.g. 'jhn'. */
  bookId: string;
  topics: string[];
};

export type QuizSubject = {
  id: string;
  kind: 'book' | 'topic';
  name: string;
  blurb: string;
  questionCount: number;
};

export const QUIZ_TOPICS = [
  { id: 'creation', name: 'Creation & Beginnings', blurb: 'The first things God made and said.' },
  { id: 'faith', name: 'Faith & Trust', blurb: 'Believing God before you see the outcome.' },
  { id: 'prayer', name: 'Prayer', blurb: 'How Scripture teaches us to pray.' },
  { id: 'parables', name: 'Parables of Jesus', blurb: 'The stories Jesus told, and what they mean.' },
  { id: 'miracles', name: 'Miracles of Jesus', blurb: 'Signs that pointed to who He is.' },
  { id: 'cross', name: 'The Cross & Resurrection', blurb: 'The death and rising of Jesus.' },
  { id: 'law', name: 'The Law & Commandments', blurb: 'What God required of His people.' },
  { id: 'wisdom', name: 'Wisdom', blurb: 'Proverbs, Ecclesiastes, and living well.' },
  { id: 'prophecy', name: 'Prophecy', blurb: 'What the prophets foretold.' },
  { id: 'church', name: 'The Early Church', blurb: 'How the first believers lived and grew.' },
  { id: 'salvation', name: 'Salvation & Grace', blurb: 'How God rescues people.' },
  { id: 'warfare', name: 'Spiritual Warfare', blurb: 'Standing firm against the enemy.' },
  { id: 'forgiveness', name: 'Forgiveness', blurb: 'Being forgiven, and forgiving others.' },
  { id: 'love', name: 'Love', blurb: 'The command Jesus called the greatest.' },
  { id: 'money', name: 'Money & Giving', blurb: 'What Scripture says about what you own.' },
  { id: 'family', name: 'Marriage & Family', blurb: 'Households, parents and children.' },
  { id: 'suffering', name: 'Suffering & Endurance', blurb: 'Holding on when it is hard.' },
  { id: 'spirit', name: 'The Holy Spirit', blurb: 'The Comforter, and what He does.' },
  { id: 'justice', name: 'Justice & the Poor', blurb: 'What God requires toward the vulnerable.' },
  { id: 'heaven', name: 'Heaven & Eternity', blurb: 'What is promised beyond this life.' },
] as const;

export const QUIZ_TOPICS_BY_ID = Object.fromEntries(
  QUIZ_TOPICS.map((topic) => [topic.id, topic]),
);

/** The original hand-written set. New books live in quiz-bank.ts. */
const CORE_QUESTIONS: QuizQuestion[] = [
  // ---------------- Genesis ----------------
  {
    id: 'gen-1',
    question: 'What did God create on the first day?',
    options: ['The sun and moon', 'Light', 'Dry land', 'Birds and fish'],
    answer: 'Light',
    reference: 'Genesis 1:3',
    difficulty: 'Easy',
    bookId: 'gen',
    topics: ['creation'],
  },
  {
    id: 'gen-2',
    question: 'Who was the first man created?',
    options: ['Abraham', 'Noah', 'Adam', 'Moses'],
    answer: 'Adam',
    reference: 'Genesis 2:7',
    difficulty: 'Easy',
    bookId: 'gen',
    topics: ['creation'],
  },
  {
    id: 'gen-3',
    question: 'What sign did God give Noah as a promise never to flood the earth again?',
    options: ['A rainbow', 'A dove', 'An olive branch', 'A star'],
    answer: 'A rainbow',
    reference: 'Genesis 9:13',
    difficulty: 'Easy',
    bookId: 'gen',
    topics: ['creation', 'faith'],
  },
  {
    id: 'gen-4',
    question: 'Whom did God ask Abraham to offer as a sacrifice?',
    options: ['Ishmael', 'Isaac', 'Jacob', 'Lot'],
    answer: 'Isaac',
    reference: 'Genesis 22:2',
    difficulty: 'Easy',
    bookId: 'gen',
    topics: ['faith'],
  },
  {
    id: 'gen-5',
    question: 'What did Jacob see in his dream at Bethel?',
    options: ['A burning bush', 'A ladder reaching to heaven', 'Seven cows', 'A chariot of fire'],
    answer: 'A ladder reaching to heaven',
    reference: 'Genesis 28:12',
    difficulty: 'Medium',
    bookId: 'gen',
    topics: ['faith'],
  },
  {
    id: 'gen-6',
    question: 'Who was sold into slavery by his brothers?',
    options: ['Benjamin', 'Judah', 'Joseph', 'Reuben'],
    answer: 'Joseph',
    reference: 'Genesis 37:28',
    difficulty: 'Easy',
    bookId: 'gen',
    topics: ['faith'],
  },
  {
    id: 'gen-7',
    question: 'How many days and nights did it rain during the flood?',
    options: ['7', '40', '100', '150'],
    answer: '40',
    reference: 'Genesis 7:12',
    difficulty: 'Easy',
    bookId: 'gen',
    topics: ['creation'],
  },

  // ---------------- Exodus ----------------
  {
    id: 'exo-1',
    question: 'From what did God speak to Moses when He called him?',
    options: ['A whirlwind', 'A burning bush', 'A cloud', 'A still small voice'],
    answer: 'A burning bush',
    reference: 'Exodus 3:2',
    difficulty: 'Easy',
    bookId: 'exo',
    topics: ['faith'],
  },
  {
    id: 'exo-2',
    question: 'How many plagues did God send on Egypt?',
    options: ['7', '10', '12', '3'],
    answer: '10',
    reference: 'Exodus 7-12',
    difficulty: 'Easy',
    bookId: 'exo',
    topics: ['law'],
  },
  {
    id: 'exo-3',
    question: 'What sea did God part for the Israelites?',
    options: ['The Dead Sea', 'The Sea of Galilee', 'The Red Sea', 'The Mediterranean'],
    answer: 'The Red Sea',
    reference: 'Exodus 14:21',
    difficulty: 'Easy',
    bookId: 'exo',
    topics: ['miracles', 'faith'],
  },
  {
    id: 'exo-4',
    question: 'On what mountain did Moses receive the Ten Commandments?',
    options: ['Mount Carmel', 'Mount Zion', 'Mount Sinai', 'Mount Nebo'],
    answer: 'Mount Sinai',
    reference: 'Exodus 19:20',
    difficulty: 'Easy',
    bookId: 'exo',
    topics: ['law'],
  },
  {
    id: 'exo-5',
    question: 'What food did God provide daily in the wilderness?',
    options: ['Manna', 'Barley', 'Figs', 'Honey'],
    answer: 'Manna',
    reference: 'Exodus 16:15',
    difficulty: 'Easy',
    bookId: 'exo',
    topics: ['miracles'],
  },
  {
    id: 'exo-6',
    question: 'What did the Israelites make while Moses was on the mountain?',
    options: ['A bronze serpent', 'A golden calf', 'An ark', 'A tower'],
    answer: 'A golden calf',
    reference: 'Exodus 32:4',
    difficulty: 'Easy',
    bookId: 'exo',
    topics: ['law'],
  },

  // ---------------- Psalms ----------------
  {
    id: 'psa-1',
    question: 'How does Psalm 23 begin?',
    options: [
      'Blessed is the man',
      'The Lord is my shepherd',
      'God is our refuge',
      'Praise the Lord',
    ],
    answer: 'The Lord is my shepherd',
    reference: 'Psalm 23:1',
    difficulty: 'Easy',
    bookId: 'psa',
    topics: ['faith', 'prayer'],
  },
  {
    id: 'psa-2',
    question: 'According to Psalm 119:105, what is God’s word to our feet?',
    options: ['A lamp', 'A shield', 'A sword', 'A rock'],
    answer: 'A lamp',
    reference: 'Psalm 119:105',
    difficulty: 'Easy',
    bookId: 'psa',
    topics: ['wisdom'],
  },
  {
    id: 'psa-3',
    question: 'Which psalm is a prayer of repentance after David’s sin with Bathsheba?',
    options: ['Psalm 51', 'Psalm 100', 'Psalm 1', 'Psalm 150'],
    answer: 'Psalm 51',
    reference: 'Psalm 51',
    difficulty: 'Medium',
    bookId: 'psa',
    topics: ['prayer', 'salvation'],
  },
  {
    id: 'psa-4',
    question: 'Psalm 1 compares the blessed person to what?',
    options: [
      'A tree planted by streams of water',
      'A lion',
      'A city on a hill',
      'A refined silver',
    ],
    answer: 'A tree planted by streams of water',
    reference: 'Psalm 1:3',
    difficulty: 'Medium',
    bookId: 'psa',
    topics: ['wisdom'],
  },
  {
    id: 'psa-5',
    question: 'According to Psalm 46:1, God is our refuge and strength, a very present help in what?',
    options: ['Trouble', 'Battle', 'Sorrow', 'Darkness'],
    answer: 'Trouble',
    reference: 'Psalm 46:1',
    difficulty: 'Easy',
    bookId: 'psa',
    topics: ['faith', 'prayer'],
  },

  // ---------------- Proverbs ----------------
  {
    id: 'pro-1',
    question: 'According to Proverbs 9:10, what is the beginning of wisdom?',
    options: ['Study', 'The fear of the Lord', 'Obedience', 'Humility'],
    answer: 'The fear of the Lord',
    reference: 'Proverbs 9:10',
    difficulty: 'Easy',
    bookId: 'pro',
    topics: ['wisdom'],
  },
  {
    id: 'pro-2',
    question: 'Proverbs 3:5 says to trust in the Lord with all your heart and lean not on what?',
    options: [
      'Your own understanding',
      'The counsel of men',
      'Earthly riches',
      'Your own strength',
    ],
    answer: 'Your own understanding',
    reference: 'Proverbs 3:5',
    difficulty: 'Easy',
    bookId: 'pro',
    topics: ['wisdom', 'faith'],
  },
  {
    id: 'pro-3',
    question: 'According to Proverbs 15:1, what turns away wrath?',
    options: ['A soft answer', 'Silence', 'A wise rebuke', 'A gift'],
    answer: 'A soft answer',
    reference: 'Proverbs 15:1',
    difficulty: 'Medium',
    bookId: 'pro',
    topics: ['wisdom'],
  },
  {
    id: 'pro-4',
    question: 'Which king is credited with most of the Proverbs?',
    options: ['David', 'Solomon', 'Hezekiah', 'Josiah'],
    answer: 'Solomon',
    reference: 'Proverbs 1:1',
    difficulty: 'Easy',
    bookId: 'pro',
    topics: ['wisdom'],
  },

  // ---------------- Daniel ----------------
  {
    id: 'dan-1',
    question: 'Who was thrown into the lions’ den?',
    options: ['Elijah', 'Daniel', 'Jeremiah', 'Ezekiel'],
    answer: 'Daniel',
    reference: 'Daniel 6:16',
    difficulty: 'Easy',
    bookId: 'dan',
    topics: ['faith', 'prayer'],
  },
  {
    id: 'dan-2',
    question: 'How many times a day did Daniel pray?',
    options: ['Once', 'Twice', 'Three times', 'Seven times'],
    answer: 'Three times',
    reference: 'Daniel 6:10',
    difficulty: 'Medium',
    bookId: 'dan',
    topics: ['prayer'],
  },
  {
    id: 'dan-3',
    question: 'Who were thrown into the fiery furnace?',
    options: [
      'Shadrach, Meshach and Abednego',
      'Daniel and Ezekiel',
      'Peter, James and John',
      'Job and his friends',
    ],
    answer: 'Shadrach, Meshach and Abednego',
    reference: 'Daniel 3:20',
    difficulty: 'Easy',
    bookId: 'dan',
    topics: ['faith'],
  },
  {
    id: 'dan-4',
    question: 'What appeared and wrote on the wall at Belshazzar’s feast?',
    options: ['A hand', 'An angel', 'A pillar of fire', 'A scroll'],
    answer: 'A hand',
    reference: 'Daniel 5:5',
    difficulty: 'Medium',
    bookId: 'dan',
    topics: ['prophecy'],
  },

  // ---------------- Isaiah ----------------
  {
    id: 'isa-1',
    question: 'Isaiah 9:6 says the government will be upon whose shoulder?',
    options: ['His', 'The kings of Israel', 'The priests', 'The prophets'],
    answer: 'His',
    reference: 'Isaiah 9:6',
    difficulty: 'Medium',
    bookId: 'isa',
    topics: ['prophecy'],
  },
  {
    id: 'isa-2',
    question: 'In Isaiah 6, what did Isaiah see the Lord seated upon?',
    options: ['A cloud', 'A throne, high and lifted up', 'A mountain', 'A chariot'],
    answer: 'A throne, high and lifted up',
    reference: 'Isaiah 6:1',
    difficulty: 'Medium',
    bookId: 'isa',
    topics: ['prophecy'],
  },
  {
    id: 'isa-3',
    question: 'According to Isaiah 40:31, those who wait on the Lord shall mount up with wings as what?',
    options: ['Doves', 'Eagles', 'Angels', 'The wind'],
    answer: 'Eagles',
    reference: 'Isaiah 40:31',
    difficulty: 'Easy',
    bookId: 'isa',
    topics: ['faith'],
  },
  {
    id: 'isa-4',
    question: 'Isaiah 53 describes the suffering servant as wounded for what?',
    options: ['Our transgressions', 'His own sin', 'Israel’s wars', 'The nations’ pride'],
    answer: 'Our transgressions',
    reference: 'Isaiah 53:5',
    difficulty: 'Medium',
    bookId: 'isa',
    topics: ['prophecy', 'cross', 'salvation'],
  },

  // ---------------- Matthew ----------------
  {
    id: 'mat-1',
    question: 'How many days did Jesus fast in the wilderness?',
    options: ['20 days', '40 days', '30 days', '50 days'],
    answer: '40 days',
    reference: 'Matthew 4:2',
    difficulty: 'Easy',
    bookId: 'mat',
    topics: ['faith', 'warfare'],
  },
  {
    id: 'mat-2',
    question: 'Which apostle denied Jesus three times?',
    options: ['John', 'James', 'Thomas', 'Peter'],
    answer: 'Peter',
    reference: 'Matthew 26:75',
    difficulty: 'Easy',
    bookId: 'mat',
    topics: ['cross'],
  },
  {
    id: 'mat-3',
    question: 'What is the first Beatitude?',
    options: [
      'Blessed are the meek',
      'Blessed are the poor in spirit',
      'Blessed are the merciful',
      'Blessed are the peacemakers',
    ],
    answer: 'Blessed are the poor in spirit',
    reference: 'Matthew 5:3',
    difficulty: 'Medium',
    bookId: 'mat',
    topics: ['wisdom'],
  },
  {
    id: 'mat-4',
    question: 'What prayer did Jesus teach His disciples?',
    options: ['The Lord’s Prayer', 'The Prayer of Jabez', 'The Shema', 'The Magnificat'],
    answer: 'The Lord’s Prayer',
    reference: 'Matthew 6:9-13',
    difficulty: 'Easy',
    bookId: 'mat',
    topics: ['prayer'],
  },
  {
    id: 'mat-5',
    question: 'In the Great Commission, Jesus told the disciples to make disciples of whom?',
    options: ['All nations', 'Israel only', 'The Gentiles only', 'Their households'],
    answer: 'All nations',
    reference: 'Matthew 28:19',
    difficulty: 'Easy',
    bookId: 'mat',
    topics: ['church'],
  },
  {
    id: 'mat-6',
    question: 'In the parable of the sower, what does the seed represent?',
    options: ['The word', 'Money', 'Faith', 'The harvest'],
    answer: 'The word',
    reference: 'Matthew 13:19',
    difficulty: 'Medium',
    bookId: 'mat',
    topics: ['parables'],
  },
  {
    id: 'mat-7',
    question: 'What did Jesus say are the two greatest commandments?',
    options: [
      'Love God and love your neighbour',
      'Pray and fast',
      'Give and forgive',
      'Believe and be baptised',
    ],
    answer: 'Love God and love your neighbour',
    reference: 'Matthew 22:37-39',
    difficulty: 'Easy',
    bookId: 'mat',
    topics: ['law'],
  },

  // ---------------- Mark ----------------
  {
    id: 'mrk-1',
    question: 'How many loaves and fish did Jesus use to feed the five thousand?',
    options: ['5 loaves and 2 fish', '2 loaves and 5 fish', '7 loaves and 3 fish', '12 loaves'],
    answer: '5 loaves and 2 fish',
    reference: 'Mark 6:41',
    difficulty: 'Easy',
    bookId: 'mrk',
    topics: ['miracles'],
  },
  {
    id: 'mrk-2',
    question: 'What did Jesus say to the storm on the Sea of Galilee?',
    options: ['Peace, be still', 'Rise up', 'Be gone', 'It is finished'],
    answer: 'Peace, be still',
    reference: 'Mark 4:39',
    difficulty: 'Medium',
    bookId: 'mrk',
    topics: ['miracles', 'faith'],
  },
  {
    id: 'mrk-3',
    question: 'Who carried Jesus’ cross to Golgotha?',
    options: ['Simon of Cyrene', 'Peter', 'Joseph of Arimathea', 'Nicodemus'],
    answer: 'Simon of Cyrene',
    reference: 'Mark 15:21',
    difficulty: 'Medium',
    bookId: 'mrk',
    topics: ['cross'],
  },

  // ---------------- Luke ----------------
  {
    id: 'luk-1',
    question: 'Which angel announced the birth of Jesus to Mary?',
    options: ['Michael', 'Gabriel', 'Raphael', 'Uriel'],
    answer: 'Gabriel',
    reference: 'Luke 1:26-31',
    difficulty: 'Easy',
    bookId: 'luk',
    topics: ['prophecy'],
  },
  {
    id: 'luk-2',
    question: 'In the parable of the prodigal son, what did the father do when he saw his son returning?',
    options: [
      'Ran to him and embraced him',
      'Sent a servant',
      'Waited at the gate',
      'Refused to see him',
    ],
    answer: 'Ran to him and embraced him',
    reference: 'Luke 15:20',
    difficulty: 'Medium',
    bookId: 'luk',
    topics: ['parables', 'salvation'],
  },
  {
    id: 'luk-3',
    question: 'Who helped the wounded man in the parable of the Good Samaritan?',
    options: ['A priest', 'A Levite', 'A Samaritan', 'A merchant'],
    answer: 'A Samaritan',
    reference: 'Luke 10:33',
    difficulty: 'Easy',
    bookId: 'luk',
    topics: ['parables'],
  },
  {
    id: 'luk-4',
    question: 'Where was Jesus born?',
    options: ['Nazareth', 'Bethlehem', 'Jerusalem', 'Capernaum'],
    answer: 'Bethlehem',
    reference: 'Luke 2:4-7',
    difficulty: 'Easy',
    bookId: 'luk',
    topics: ['prophecy'],
  },
  {
    id: 'luk-5',
    question: 'Which tax collector climbed a sycamore tree to see Jesus?',
    options: ['Matthew', 'Zacchaeus', 'Levi', 'Simon'],
    answer: 'Zacchaeus',
    reference: 'Luke 19:4',
    difficulty: 'Easy',
    bookId: 'luk',
    topics: ['salvation'],
  },

  // ---------------- John ----------------
  {
    id: 'jhn-1',
    question: 'How does the Gospel of John begin?',
    options: [
      'In the beginning was the Word',
      'The book of the generations',
      'In the days of Herod',
      'Many have undertaken',
    ],
    answer: 'In the beginning was the Word',
    reference: 'John 1:1',
    difficulty: 'Easy',
    bookId: 'jhn',
    topics: ['creation', 'salvation'],
  },
  {
    id: 'jhn-2',
    question: 'Who came to Jesus at night and was told he must be born again?',
    options: ['Nicodemus', 'Joseph of Arimathea', 'Lazarus', 'Zacchaeus'],
    answer: 'Nicodemus',
    reference: 'John 3:1-3',
    difficulty: 'Easy',
    bookId: 'jhn',
    topics: ['salvation'],
  },
  {
    id: 'jhn-3',
    question: 'What was Jesus’ first recorded miracle?',
    options: [
      'Healing a blind man',
      'Turning water into wine',
      'Walking on water',
      'Raising Lazarus',
    ],
    answer: 'Turning water into wine',
    reference: 'John 2:1-11',
    difficulty: 'Easy',
    bookId: 'jhn',
    topics: ['miracles'],
  },
  {
    id: 'jhn-4',
    question: 'Whom did Jesus raise from the dead after four days in the tomb?',
    options: ['Jairus’ daughter', 'Lazarus', 'The widow’s son', 'Tabitha'],
    answer: 'Lazarus',
    reference: 'John 11:43-44',
    difficulty: 'Easy',
    bookId: 'jhn',
    topics: ['miracles'],
  },
  {
    id: 'jhn-5',
    question: 'In John 14:6, Jesus says: I am the way, the truth, and the...?',
    options: ['Life', 'Light', 'Door', 'Vine'],
    answer: 'Life',
    reference: 'John 14:6',
    difficulty: 'Easy',
    bookId: 'jhn',
    topics: ['salvation'],
  },
  {
    id: 'jhn-6',
    question: 'What did Jesus say from the cross in John 19:30?',
    options: ['It is finished', 'Father, forgive them', 'Into your hands', 'I thirst'],
    answer: 'It is finished',
    reference: 'John 19:30',
    difficulty: 'Medium',
    bookId: 'jhn',
    topics: ['cross'],
  },
  {
    id: 'jhn-7',
    question: 'Which disciple doubted the resurrection until he saw Jesus?',
    options: ['Peter', 'Thomas', 'Philip', 'Andrew'],
    answer: 'Thomas',
    reference: 'John 20:25',
    difficulty: 'Easy',
    bookId: 'jhn',
    topics: ['cross', 'faith'],
  },
  {
    id: 'jhn-8',
    question: 'In John 15, Jesus says: I am the vine, you are the...?',
    options: ['Branches', 'Fruit', 'Vinedresser', 'Harvest'],
    answer: 'Branches',
    reference: 'John 15:5',
    difficulty: 'Easy',
    bookId: 'jhn',
    topics: ['faith'],
  },

  // ---------------- Acts ----------------
  {
    id: 'act-1',
    question: 'On what day did the Holy Spirit come upon the believers?',
    options: ['Passover', 'Pentecost', 'Tabernacles', 'Sabbath'],
    answer: 'Pentecost',
    reference: 'Acts 2:1-4',
    difficulty: 'Easy',
    bookId: 'act',
    topics: ['church'],
  },
  {
    id: 'act-2',
    question: 'Who was the first Christian martyr?',
    options: ['Stephen', 'James', 'Peter', 'Paul'],
    answer: 'Stephen',
    reference: 'Acts 7:59-60',
    difficulty: 'Medium',
    bookId: 'act',
    topics: ['church'],
  },
  {
    id: 'act-3',
    question: 'On the road to which city was Saul converted?',
    options: ['Damascus', 'Antioch', 'Jerusalem', 'Ephesus'],
    answer: 'Damascus',
    reference: 'Acts 9:3',
    difficulty: 'Easy',
    bookId: 'act',
    topics: ['salvation', 'church'],
  },
  {
    id: 'act-4',
    question: 'In which city were the disciples first called Christians?',
    options: ['Jerusalem', 'Antioch', 'Rome', 'Corinth'],
    answer: 'Antioch',
    reference: 'Acts 11:26',
    difficulty: 'Medium',
    bookId: 'act',
    topics: ['church'],
  },
  {
    id: 'act-5',
    question: 'What happened when Paul and Silas praised God in prison?',
    options: [
      'An earthquake opened the doors',
      'An angel carried them out',
      'The guards released them',
      'A fire broke out',
    ],
    answer: 'An earthquake opened the doors',
    reference: 'Acts 16:26',
    difficulty: 'Medium',
    bookId: 'act',
    topics: ['prayer', 'church'],
  },

  // ---------------- Romans ----------------
  {
    id: 'rom-1',
    question: 'According to Romans 3:23, who has sinned and fallen short of God’s glory?',
    options: ['All', 'The Gentiles', 'The unbelieving', 'The lawless'],
    answer: 'All',
    reference: 'Romans 3:23',
    difficulty: 'Easy',
    bookId: 'rom',
    topics: ['salvation'],
  },
  {
    id: 'rom-2',
    question: 'Romans 6:23 says the wages of sin is death, but the gift of God is what?',
    options: ['Eternal life', 'Peace', 'Forgiveness', 'Righteousness'],
    answer: 'Eternal life',
    reference: 'Romans 6:23',
    difficulty: 'Easy',
    bookId: 'rom',
    topics: ['salvation'],
  },
  {
    id: 'rom-3',
    question: 'According to Romans 10:17, faith comes by hearing, and hearing by what?',
    options: ['The word of God', 'Preaching', 'Prayer', 'The Spirit'],
    answer: 'The word of God',
    reference: 'Romans 10:17',
    difficulty: 'Medium',
    bookId: 'rom',
    topics: ['faith'],
  },
  {
    id: 'rom-4',
    question: 'Romans 8:28 says all things work together for good to those who do what?',
    options: ['Love God', 'Obey the law', 'Give generously', 'Fast and pray'],
    answer: 'Love God',
    reference: 'Romans 8:28',
    difficulty: 'Easy',
    bookId: 'rom',
    topics: ['faith'],
  },

  // ---------------- 1 Corinthians ----------------
  {
    id: '1co-1',
    question: 'According to 1 Corinthians 13, which is the greatest of faith, hope and love?',
    options: ['Faith', 'Hope', 'Love', 'They are equal'],
    answer: 'Love',
    reference: '1 Corinthians 13:13',
    difficulty: 'Easy',
    bookId: '1co',
    topics: ['wisdom'],
  },
  {
    id: '1co-2',
    question: '1 Corinthians 12 compares the church to what?',
    options: ['A body', 'A building', 'A vineyard', 'An army'],
    answer: 'A body',
    reference: '1 Corinthians 12:12',
    difficulty: 'Medium',
    bookId: '1co',
    topics: ['church'],
  },

  // ---------------- Ephesians ----------------
  {
    id: 'eph-1',
    question: 'According to Ephesians 2:8, we are saved by grace through what?',
    options: ['Faith', 'Works', 'Baptism', 'The law'],
    answer: 'Faith',
    reference: 'Ephesians 2:8',
    difficulty: 'Easy',
    bookId: 'eph',
    topics: ['salvation', 'faith'],
  },
  {
    id: 'eph-2',
    question: 'In the armour of God, what is the sword of the Spirit?',
    options: ['The word of God', 'Prayer', 'Faith', 'Truth'],
    answer: 'The word of God',
    reference: 'Ephesians 6:17',
    difficulty: 'Medium',
    bookId: 'eph',
    topics: ['warfare'],
  },
  {
    id: 'eph-3',
    question: 'What piece of armour is described as the breastplate?',
    options: ['Righteousness', 'Truth', 'Salvation', 'Peace'],
    answer: 'Righteousness',
    reference: 'Ephesians 6:14',
    difficulty: 'Medium',
    bookId: 'eph',
    topics: ['warfare'],
  },
  {
    id: 'eph-4',
    question: 'According to Ephesians 6:12, our struggle is not against what?',
    options: ['Flesh and blood', 'The world', 'Temptation', 'Ourselves'],
    answer: 'Flesh and blood',
    reference: 'Ephesians 6:12',
    difficulty: 'Medium',
    bookId: 'eph',
    topics: ['warfare'],
  },

  // ---------------- James ----------------
  {
    id: 'jas-1',
    question: 'According to James 2:17, faith without works is what?',
    options: ['Dead', 'Weak', 'Incomplete', 'Vain'],
    answer: 'Dead',
    reference: 'James 2:17',
    difficulty: 'Easy',
    bookId: 'jas',
    topics: ['faith'],
  },
  {
    id: 'jas-2',
    question: 'James 1:5 says if anyone lacks wisdom, they should do what?',
    options: ['Ask God', 'Study harder', 'Seek elders', 'Wait patiently'],
    answer: 'Ask God',
    reference: 'James 1:5',
    difficulty: 'Easy',
    bookId: 'jas',
    topics: ['wisdom', 'prayer'],
  },
  {
    id: 'jas-3',
    question: 'James 1:19 says to be quick to listen and slow to do what?',
    options: ['Speak', 'Judge', 'Act', 'Give'],
    answer: 'Speak',
    reference: 'James 1:19',
    difficulty: 'Medium',
    bookId: 'jas',
    topics: ['wisdom'],
  },

  // ---------------- Revelation ----------------
  {
    id: 'rev-1',
    question: 'How many churches are addressed in Revelation 2-3?',
    options: ['5', '7', '10', '12'],
    answer: '7',
    reference: 'Revelation 1:11',
    difficulty: 'Medium',
    bookId: 'rev',
    topics: ['prophecy', 'church'],
  },
  {
    id: 'rev-2',
    question: 'Who wrote Revelation while exiled on Patmos?',
    options: ['Paul', 'Peter', 'John', 'Luke'],
    answer: 'John',
    reference: 'Revelation 1:9',
    difficulty: 'Easy',
    bookId: 'rev',
    topics: ['prophecy'],
  },
  {
    id: 'rev-3',
    question: 'In Revelation 21, what does God make new?',
    options: [
      'A new heaven and a new earth',
      'A new covenant',
      'A new temple',
      'A new priesthood',
    ],
    answer: 'A new heaven and a new earth',
    reference: 'Revelation 21:1',
    difficulty: 'Medium',
    bookId: 'rev',
    topics: ['prophecy'],
  },
  {
    id: 'rev-4',
    question: 'In Revelation 3:20, Jesus says He stands at the door and does what?',
    options: ['Knocks', 'Waits', 'Calls', 'Enters'],
    answer: 'Knocks',
    reference: 'Revelation 3:20',
    difficulty: 'Easy',
    bookId: 'rev',
    topics: ['salvation'],
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  ...CORE_QUESTIONS,
  ...QUIZ_BANK,
  ...QUIZ_TOPIC_BANK,
];

const MIN_QUESTIONS_PER_SUBJECT = 3;

/** Books that have enough questions to make a worthwhile quiz. */
export function getBookSubjects(): QuizSubject[] {
  const counts = new Map<string, number>();
  for (const question of QUIZ_QUESTIONS) {
    counts.set(question.bookId, (counts.get(question.bookId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_QUESTIONS_PER_SUBJECT)
    .map(([bookId, count]) => {
      const book = BIBLE_BOOKS_BY_ID[bookId];
      return {
        id: bookId,
        kind: 'book' as const,
        name: book?.name ?? bookId,
        blurb: book ? `${book.chapters} chapters · ${book.testament === 'OT' ? 'Old' : 'New'} Testament` : '',
        questionCount: count,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTopicSubjects(): QuizSubject[] {
  return QUIZ_TOPICS.map((topic) => ({
    id: topic.id,
    kind: 'topic' as const,
    name: topic.name,
    blurb: topic.blurb,
    questionCount: QUIZ_QUESTIONS.filter((question) => question.topics.includes(topic.id)).length,
  })).filter((subject) => subject.questionCount >= MIN_QUESTIONS_PER_SUBJECT);
}

export function getQuestionsForSubject(kind: 'book' | 'topic', id: string): QuizQuestion[] {
  return kind === 'book'
    ? QUIZ_QUESTIONS.filter((question) => question.bookId === id)
    : QUIZ_QUESTIONS.filter((question) => question.topics.includes(id));
}

/** Fisher-Yates, so a retake does not present the same order. */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
