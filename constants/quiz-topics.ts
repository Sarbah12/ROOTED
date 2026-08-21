import { q } from '@/constants/quiz-helpers';
import type { QuizQuestion } from '@/constants/quiz';

/**
 * Questions organised by subject rather than by book.
 *
 * The book bank covers all 66 evenly, which is the right shape for "study a
 * book, then quiz on it". It leaves the topic quizzes lopsided: Parables of
 * Jesus had five questions and Creation seven, because those subjects are
 * spread thinly across many books and no single book's five questions could
 * carry them.
 *
 * Everything here is tagged with a book too, so it still counts toward that
 * book's quiz. A question belongs to a passage and a subject at once.
 */

export const QUIZ_TOPIC_BANK: QuizQuestion[] = [
  // ------------------------------------------------------------- parables
  q('t-par1', 'In the parable of the sower, what choked the seed sown among thorns?', ['The care of this world and deceitfulness of riches', 'The heat of the sun', 'Birds of the air', 'Stony ground'], 0, 'Matthew 13:22', 'Medium', 'mat', ['parables']),
  q('t-par2', 'What did the wise virgins take with their lamps?', ['Oil in their vessels', 'Spare wicks', 'Bread for the night', 'A lantern each'], 0, 'Matthew 25:4', 'Medium', 'mat', ['parables']),
  q('t-par3', 'How many sheep did the shepherd leave to seek the one that was lost?', ['Ninety and nine', 'Forty and nine', 'Seventy', 'A hundred'], 0, 'Luke 15:4', 'Easy', 'luk', ['parables']),
  q('t-par4', 'How much did the unforgiving servant owe his lord?', ['Ten thousand talents', 'A hundred pence', 'Thirty pieces of silver', 'Two mites'], 0, 'Matthew 18:24', 'Medium', 'mat', ['parables', 'forgiveness']),
  q('t-par5', 'What did the rich fool decide to do with his abundant harvest?', ['Build greater barns', 'Give it to the poor', 'Sell it at the gate', 'Offer it in the temple'], 0, 'Luke 12:18', 'Medium', 'luk', ['parables', 'money']),
  q('t-par6', 'The kingdom of heaven is likened to which seed, the least of all seeds?', ['A grain of mustard seed', 'A grain of wheat', 'A fig seed', 'A vine cutting'], 0, 'Matthew 13:31', 'Medium', 'mat', ['parables']),
  q('t-par7', 'In the parable of the wheat and the tares, who sowed the tares?', ['An enemy', 'A servant', 'The householder', 'A stranger passing by'], 0, 'Matthew 13:25', 'Medium', 'mat', ['parables']),
  q('t-par8', 'What did every labourer in the vineyard receive, whatever hour he began?', ['A penny', 'A talent', 'A measure of corn', 'Nothing until the harvest'], 0, 'Matthew 20:9', 'Medium', 'mat', ['parables']),
  q('t-par9', 'In the parable of the Pharisee and the publican, who went home justified?', ['The publican', 'The Pharisee', 'Both of them', 'Neither of them'], 0, 'Luke 18:14', 'Medium', 'luk', ['parables', 'prayer']),
  q('t-par10', 'On what did the wise man build his house?', ['A rock', 'The sand', 'A hill', 'The old foundation'], 0, 'Matthew 7:24', 'Easy', 'mat', ['parables', 'wisdom']),
  q('t-par11', 'What did the servant who received one talent do with it?', ['Hid it in the earth', 'Traded and gained one more', 'Gave it to the poor', 'Returned it at once'], 0, 'Matthew 25:18', 'Medium', 'mat', ['parables']),
  q('t-par12', 'What did the woman do when she found the piece of silver she had lost?', ['Called her friends and neighbours together', 'Kept it quietly', 'Took it to the temple', 'Gave it away'], 0, 'Luke 15:9', 'Hard', 'luk', ['parables']),

  // ------------------------------------------------------------- creation
  q('t-cre1', 'What did God make on the second day to divide the waters?', ['A firmament', 'Dry land', 'The great deep', 'A mist'], 0, 'Genesis 1:7', 'Medium', 'gen', ['creation']),
  q('t-cre2', 'On which day did God make the sun, moon and stars?', ['The third', 'The fourth', 'The fifth', 'The sixth'], 1, 'Genesis 1:16', 'Medium', 'gen', ['creation']),
  q('t-cre3', 'What did God create on the fifth day?', ['Great whales and every winged fowl', 'Cattle and creeping things', 'Grass and herbs', 'Man and woman'], 0, 'Genesis 1:21', 'Medium', 'gen', ['creation']),
  q('t-cre4', 'In whose image was man created?', ['In the image of God', 'In the image of angels', 'In the image of the earth', 'In the image of the beasts'], 0, 'Genesis 1:27', 'Easy', 'gen', ['creation']),
  q('t-cre5', 'What did God do on the seventh day?', ['Rested from all his work', 'Made the seas', 'Planted a garden', 'Named the animals'], 0, 'Genesis 2:2', 'Easy', 'gen', ['creation']),
  q('t-cre6', 'From what was the man formed?', ['The dust of the ground', 'The waters', 'A rib', 'The breath of heaven'], 0, 'Genesis 2:7', 'Easy', 'gen', ['creation']),
  q('t-cre7', 'Where did God plant the garden?', ['Eastward in Eden', 'Beyond the river', 'Upon a mountain', 'By the great sea'], 0, 'Genesis 2:8', 'Medium', 'gen', ['creation']),
  q('t-cre8', 'Complete: “All things were made by him; and without him was not any thing made that ___.”', ['Was made', 'Endureth', 'He spake', 'Liveth'], 0, 'John 1:3', 'Medium', 'jhn', ['creation']),
  q('t-cre9', 'According to Colossians, by whom were all things created?', ['By him', 'By the angels', 'By the word of the prophets', 'By wisdom alone'], 0, 'Colossians 1:16', 'Hard', 'col', ['creation']),

  // ---------------------------------------------------------- forgiveness
  q('t-for1', 'How often did Jesus say to forgive a brother who sins against you?', ['Until seventy times seven', 'Until seven times', 'Three times', 'As often as he asks once'], 0, 'Matthew 18:22', 'Medium', 'mat', ['forgiveness']),
  q('t-for2', 'What did Jesus say from the cross about those who crucified him?', ['Father, forgive them; for they know not what they do', 'It is finished', 'Why hast thou forsaken me?', 'Into thy hands I commend my spirit'], 0, 'Luke 23:34', 'Easy', 'luk', ['forgiveness', 'cross']),
  q('t-for3', 'Complete: “Forgive us our debts, as we ___ our debtors.”', ['Forgive', 'Remember', 'Repay', 'Release'], 0, 'Matthew 6:12', 'Easy', 'mat', ['forgiveness', 'prayer']),
  q('t-for4', 'What did Joseph tell his brothers about the evil they intended?', ['God meant it unto good', 'It is forgotten', 'I will repay it', 'Speak of it no more'], 0, 'Genesis 50:20', 'Medium', 'gen', ['forgiveness']),
  q('t-for5', 'How far has God removed our transgressions from us?', ['As far as the east is from the west', 'As high as the heavens', 'As deep as the sea', 'Beyond the mountains'], 0, 'Psalms 103:12', 'Medium', 'psa', ['forgiveness', 'salvation']),
  q('t-for6', 'What did Stephen pray as he was being stoned?', ['Lord, lay not this sin to their charge', 'Remember me, O Lord', 'How long, O Lord?', 'Let this cup pass'], 0, 'Acts 7:60', 'Hard', 'act', ['forgiveness']),
  q('t-for7', 'Complete: “Be ye kind one to another, tenderhearted, ___ one another.”', ['Forgiving', 'Bearing', 'Teaching', 'Comforting'], 0, 'Ephesians 4:32', 'Medium', 'eph', ['forgiveness']),
  q('t-for8', 'What follows if you do not forgive others their trespasses?', ['Neither will your Father forgive yours', 'You will be cast out', 'Your prayers will be delayed', 'You must offer a sacrifice'], 0, 'Matthew 6:15', 'Medium', 'mat', ['forgiveness']),

  // ----------------------------------------------------------------- love
  q('t-lov1', 'Complete: “Greater love hath no man than this, that a man lay down his ___ for his friends.”', ['Life', 'Riches', 'Name', 'Burden'], 0, 'John 15:13', 'Easy', 'jhn', ['love', 'cross']),
  q('t-lov2', 'Complete: “Charity suffereth long, and is ___.”', ['Kind', 'Patient', 'Gentle', 'Faithful'], 0, '1 Corinthians 13:4', 'Easy', '1co', ['love']),
  q('t-lov3', 'By what will all men know we are his disciples?', ['If ye have love one to another', 'If ye keep the law', 'If ye preach boldly', 'If ye fast often'], 0, 'John 13:35', 'Medium', 'jhn', ['love', 'church']),
  q('t-lov4', 'What did Jesus command concerning enemies?', ['Love your enemies', 'Avoid your enemies', 'Rebuke your enemies', 'Leave them to God'], 0, 'Matthew 5:44', 'Easy', 'mat', ['love']),
  q('t-lov5', 'Why do we love him?', ['Because he first loved us', 'Because he is mighty', 'Because he commands it', 'Because he made us'], 0, '1 John 4:19', 'Easy', '1jn', ['love']),
  q('t-lov6', 'Complete: “Love worketh no ill to his neighbour: therefore love is the ___ of the law.”', ['Fulfilling', 'Beginning', 'End', 'Measure'], 0, 'Romans 13:10', 'Medium', 'rom', ['love', 'law']),
  q('t-lov7', 'Which is the first and great commandment?', ['Love the Lord thy God with all thy heart', 'Love thy neighbour as thyself', 'Keep the sabbath day', 'Honour thy father and mother'], 0, 'Matthew 22:37', 'Easy', 'mat', ['love', 'law']),
  q('t-lov8', 'What did Jesus say the second commandment is, like unto the first?', ['Thou shalt love thy neighbour as thyself', 'Thou shalt not kill', 'Thou shalt give alms', 'Thou shalt forgive'], 0, 'Matthew 22:39', 'Easy', 'mat', ['love', 'law']),

  // ---------------------------------------------------------------- money
  q('t-mon1', 'Complete: “Ye cannot serve God and ___.”', ['Mammon', 'Men', 'The world', 'Two masters'], 0, 'Matthew 6:24', 'Easy', 'mat', ['money']),
  q('t-mon2', 'What did Jesus say the poor widow had cast in, compared to the rest?', ['All that she had', 'A worthy portion', 'More than was asked', 'What she could spare'], 0, 'Mark 12:44', 'Medium', 'mrk', ['money']),
  q('t-mon3', 'Complete: “It is more blessed to ___ than to receive.”', ['Give', 'Serve', 'Labour', 'Forgive'], 0, 'Acts 20:35', 'Easy', 'act', ['money']),
  q('t-mon4', 'What did Jesus tell the rich young man to do?', ['Sell that thou hast, and give to the poor', 'Keep the commandments only', 'Build a synagogue', 'Fast and pray'], 0, 'Matthew 19:21', 'Medium', 'mat', ['money']),
  q('t-mon5', 'Where are we told not to lay up treasures?', ['Upon earth', 'In the temple', 'In another’s hand', 'In the field'], 0, 'Matthew 6:19', 'Easy', 'mat', ['money']),
  q('t-mon6', 'How much of his goods did Zacchaeus give to the poor?', ['Half', 'A tenth', 'A quarter', 'All'], 0, 'Luke 19:8', 'Medium', 'luk', ['money']),
  q('t-mon7', 'What kind of giver does God love?', ['A cheerful giver', 'A generous giver', 'A quiet giver', 'A faithful giver'], 0, '2 Corinthians 9:7', 'Easy', '2co', ['money']),
  q('t-mon8', 'Complete: “The love of money is the root of all ___.”', ['Evil', 'Sorrow', 'Folly', 'Strife'], 0, '1 Timothy 6:10', 'Easy', '1ti', ['money', 'wisdom']),

  // --------------------------------------------------------------- family
  q('t-fam1', 'What promise is attached to honouring your father and mother?', ['That thy days may be long upon the land', 'That thou shalt prosper', 'That thou shalt be blessed above all', 'That thy house shall stand'], 0, 'Exodus 20:12', 'Medium', 'exo', ['family', 'law']),
  q('t-fam2', 'Why did God say he would make a help meet for the man?', ['It is not good that the man should be alone', 'The garden was too large', 'The animals had names', 'He was without a keeper'], 0, 'Genesis 2:18', 'Easy', 'gen', ['family', 'creation']),
  q('t-fam3', 'Complete: “Therefore shall a man leave his father and his mother, and shall ___ unto his wife.”', ['Cleave', 'Return', 'Listen', 'Give'], 0, 'Genesis 2:24', 'Medium', 'gen', ['family']),
  q('t-fam4', 'How are husbands told to love their wives?', ['As Christ also loved the church', 'As they love their own fathers', 'As the law requires', 'As their neighbours'], 0, 'Ephesians 5:25', 'Medium', 'eph', ['family', 'love']),
  q('t-fam5', 'Complete: “Children, obey your parents in the Lord: for this is ___.”', ['Right', 'A hard saying', 'The whole law', 'A small thing'], 0, 'Ephesians 6:1', 'Easy', 'eph', ['family']),
  q('t-fam6', 'What are fathers told not to do to their children?', ['Provoke them to wrath', 'Leave them untaught', 'Send them away', 'Withhold bread'], 0, 'Ephesians 6:4', 'Medium', 'eph', ['family']),
  q('t-fam7', 'What did Ruth say to Naomi?', ['Whither thou goest, I will go', 'Let me return to my people', 'The LORD hath dealt bitterly', 'I will wait for thee here'], 0, 'Ruth 1:16', 'Easy', 'rut', ['family', 'faith']),
  q('t-fam8', 'What did Joshua declare for himself and his house?', ['We will serve the LORD', 'We will possess the land', 'We will keep silence', 'We will build an altar'], 0, 'Joshua 24:15', 'Easy', 'jos', ['family', 'faith']),

  // ------------------------------------------------------------ suffering
  q('t-suf1', 'What does tribulation work, according to Romans?', ['Patience', 'Sorrow', 'Wisdom', 'Silence'], 0, 'Romans 5:3', 'Medium', 'rom', ['suffering']),
  q('t-suf2', 'Complete: “My grace is sufficient for thee: for my strength is made perfect in ___.”', ['Weakness', 'Suffering', 'Patience', 'Trial'], 0, '2 Corinthians 12:9', 'Medium', '2co', ['suffering', 'faith']),
  q('t-suf3', 'How are we told to count it when we fall into divers temptations?', ['All joy', 'All sorrow', 'A light thing', 'A judgment'], 0, 'James 1:2', 'Medium', 'jas', ['suffering']),
  q('t-suf4', 'Who did Paul say shall suffer persecution?', ['All that will live godly in Christ Jesus', 'The apostles only', 'Those who preach', 'The weak in faith'], 0, '2 Timothy 3:12', 'Medium', '2ti', ['suffering']),
  q('t-suf5', 'Who are called blessed in the Beatitudes for being persecuted?', ['They which are persecuted for righteousness’ sake', 'They that mourn only', 'They that are rich in faith', 'They that fast'], 0, 'Matthew 5:10', 'Medium', 'mat', ['suffering']),
  q('t-suf6', 'How do present sufferings compare with the glory to be revealed?', ['They are not worthy to be compared', 'They are equal to it', 'They outweigh it', 'They hasten it'], 0, 'Romans 8:18', 'Medium', 'rom', ['suffering', 'heaven']),
  q('t-suf7', 'What did the three men say before the furnace?', ['Our God whom we serve is able to deliver us', 'Spare us, O king', 'Let the fire be tried', 'We will bow this once'], 0, 'Daniel 3:17', 'Medium', 'dan', ['suffering', 'faith']),
  q('t-suf8', 'What did Job say when he lost everything?', ['Blessed be the name of the LORD', 'Why hast thou made me?', 'I will curse the day', 'Let me die'], 0, 'Job 1:21', 'Easy', 'job', ['suffering', 'faith']),

  // ----------------------------------------------------- the Holy Spirit
  q('t-spi1', 'What did Jesus call the Holy Ghost, whom the Father would send?', ['The Comforter', 'The Advocate of the law', 'The Messenger', 'The Witness'], 0, 'John 14:26', 'Medium', 'jhn', ['spirit']),
  q('t-spi2', 'What descended like a dove at the baptism of Jesus?', ['The Spirit of God', 'A cloud', 'A flame', 'An angel'], 0, 'Matthew 3:16', 'Easy', 'mat', ['spirit']),
  q('t-spi3', 'What will believers receive after the Holy Ghost is come upon them?', ['Power', 'Riches', 'Rest', 'Long life'], 0, 'Acts 1:8', 'Medium', 'act', ['spirit', 'church']),
  q('t-spi4', 'How does the Spirit help us in prayer?', ['Maketh intercession for us', 'Speaks in our stead to men', 'Keeps us silent', 'Delays the answer'], 0, 'Romans 8:26', 'Hard', 'rom', ['spirit', 'prayer']),
  q('t-spi5', 'What are believers told not to do to the Holy Spirit of God?', ['Grieve him', 'Question him', 'Forget him', 'Hasten him'], 0, 'Ephesians 4:30', 'Medium', 'eph', ['spirit']),
  q('t-spi6', 'Complete: “Not by might, nor by power, but by my ___, saith the LORD.”', ['Spirit', 'Word', 'Hand', 'Counsel'], 0, 'Zechariah 4:6', 'Medium', 'zec', ['spirit']),
  q('t-spi7', 'What is the first fruit of the Spirit named in Galatians?', ['Love', 'Joy', 'Peace', 'Longsuffering'], 0, 'Galatians 5:22', 'Easy', 'gal', ['spirit']),
  q('t-spi8', 'What sat upon each of them at Pentecost?', ['Cloven tongues like as of fire', 'A bright cloud', 'A crown', 'A dove'], 0, 'Acts 2:3', 'Medium', 'act', ['spirit', 'church']),

  // -------------------------------------------------------------- justice
  q('t-jus1', 'What three things does the LORD require, according to Micah?', ['To do justly, love mercy, and walk humbly', 'To fast, pray, and give', 'To offer, obey, and rest', 'To build, keep, and teach'], 0, 'Micah 6:8', 'Medium', 'mic', ['justice', 'wisdom']),
  q('t-jus2', 'What is pure religion before God, according to James?', ['To visit the fatherless and widows in their affliction', 'To keep the feasts', 'To teach the law', 'To give a tenth'], 0, 'James 1:27', 'Medium', 'jas', ['justice']),
  q('t-jus3', 'To whom was Jesus anointed to preach the gospel?', ['The poor', 'The rulers', 'The priests', 'The strangers'], 0, 'Luke 4:18', 'Medium', 'luk', ['justice']),
  q('t-jus4', 'Complete: “Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto ___.”', ['Me', 'God only', 'Your own', 'The law'], 0, 'Matthew 25:40', 'Medium', 'mat', ['justice', 'love']),
  q('t-jus5', 'What does he do who has pity upon the poor?', ['Lendeth unto the LORD', 'Storeth up for himself', 'Findeth favour with men', 'Fulfilleth a vow'], 0, 'Proverbs 19:17', 'Medium', 'pro', ['justice', 'money']),
  q('t-jus6', 'Whom does Psalm 82 call us to defend?', ['The poor and fatherless', 'The mighty', 'The elders', 'The stranger only'], 0, 'Psalms 82:3', 'Hard', 'psa', ['justice']),
  q('t-jus7', 'For whom are we told to open our mouth, in Proverbs 31?', ['The dumb', 'The wise', 'The king', 'The merchant'], 0, 'Proverbs 31:8', 'Hard', 'pro', ['justice']),
  q('t-jus8', 'What fast has God chosen, according to Isaiah 58?', ['To loose the bands of wickedness', 'To abstain from bread', 'To keep silence', 'To sit in ashes'], 0, 'Isaiah 58:6', 'Hard', 'isa', ['justice']),

  // --------------------------------------------------------------- heaven
  q('t-hea1', 'Complete: “In my Father’s house are many ___.”', ['Mansions', 'Chambers', 'Gates', 'Rooms of gold'], 0, 'John 14:2', 'Easy', 'jhn', ['heaven']),
  q('t-hea2', 'What did John see coming down from God out of heaven?', ['The holy city, new Jerusalem', 'A white throne', 'A great mountain', 'An open book'], 0, 'Revelation 21:2', 'Medium', 'rev', ['heaven', 'prophecy']),
  q('t-hea3', 'Complete: “Our conversation is in ___.”', ['Heaven', 'Truth', 'The Spirit', 'Righteousness'], 0, 'Philippians 3:20', 'Hard', 'phi', ['heaven']),
  q('t-hea4', 'What has eye not seen nor ear heard?', ['The things God hath prepared for them that love him', 'The day of his coming', 'The counsel of the Almighty', 'The number of his years'], 0, '1 Corinthians 2:9', 'Medium', '1co', ['heaven']),
  q('t-hea5', 'Complete: “Absent from the body, and to be present with the ___.”', ['Lord', 'Saints', 'Angels', 'Father'], 0, '2 Corinthians 5:8', 'Medium', '2co', ['heaven']),
  q('t-hea6', 'Where are we told to lay up treasures instead?', ['In heaven', 'In the temple', 'With the poor', 'In a good field'], 0, 'Matthew 6:20', 'Easy', 'mat', ['heaven', 'money']),
  q('t-hea7', 'What will there be no more of, in the new heaven and earth?', ['Death, sorrow, crying, nor pain', 'Night only', 'Labour', 'The sea alone'], 0, 'Revelation 21:4', 'Easy', 'rev', ['heaven', 'prophecy']),
  q('t-hea8', 'How did Enoch leave the earth?', ['God took him', 'By a chariot', 'In a whirlwind', 'He was buried in Canaan'], 0, 'Genesis 5:24', 'Hard', 'gen', ['heaven']),
];
