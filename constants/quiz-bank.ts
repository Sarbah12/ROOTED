import { q } from '@/constants/quiz-helpers';
import type { QuizQuestion } from '@/constants/quiz';

/**
 * Questions for all 66 books.
 *
 * Written as one line each through `q()` rather than as object literals. Three
 * hundred questions in longhand is a three-thousand-line wall nobody will ever
 * proofread; like this, a book's whole quiz fits on a screen and a wrong answer
 * is visible at a glance.
 *
 * `answer` is taken from `options` by index, so the answer is always one of the
 * choices offered. Writing them separately makes it possible to ship a question
 * with no correct answer, which is exactly the sort of thing that survives
 * review and then embarrasses you in front of a user.
 *
 * Every reference is checked against the bundled KJV by
 * scripts/check-quiz.mjs — run it after editing.
 */

export const QUIZ_BANK: QuizQuestion[] = [
  // ------------------------------------------------------------ Genesis
  q('gen-b1', 'Who was sold by his brothers and taken to Egypt?', ['Joseph', 'Benjamin', 'Judah', 'Reuben'], 0, 'Genesis 37:28', 'Easy', 'gen', ['faith']),
  q('gen-b2', 'What did Abraham offer in place of his son Isaac?', ['A lamb', 'A ram', 'A dove', 'A bullock'], 1, 'Genesis 22:13', 'Medium', 'gen', ['faith']),
  q('gen-b3', 'How many days and nights did the rain fall in the flood?', ['Seven', 'Twelve', 'Forty', 'Fifty'], 2, 'Genesis 7:12', 'Easy', 'gen', ['creation']),
  q('gen-b4', 'What was the name of the tower whose builders were scattered?', ['Bethel', 'Babel', 'Nineveh', 'Ur'], 1, 'Genesis 11:9', 'Medium', 'gen'),
  q('gen-b5', 'After wrestling until daybreak, Jacob was given what new name?', ['Israel', 'Isaac', 'Ishmael', 'Joseph'], 0, 'Genesis 32:28', 'Medium', 'gen', ['faith']),

  // ------------------------------------------------------------ Exodus
  q('exo-b1', 'What led Israel by night out of Egypt?', ['A pillar of cloud', 'A pillar of fire', 'A star', 'An angel'], 1, 'Exodus 13:21', 'Medium', 'exo'),
  q('exo-b2', 'On which mountain did Moses receive the commandments?', ['Mount Carmel', 'Mount Nebo', 'Mount Sinai', 'Mount Zion'], 2, 'Exodus 19:20', 'Easy', 'exo', ['law']),
  q('exo-b3', 'What was the final plague upon Egypt?', ['Locusts', 'Darkness', 'Hail', 'Death of the firstborn'], 3, 'Exodus 12:29', 'Medium', 'exo'),
  q('exo-b4', 'What did Aaron’s rod become before Pharaoh?', ['A serpent', 'A flame', 'A river', 'A tree'], 0, 'Exodus 7:10', 'Medium', 'exo', ['miracles']),
  q('exo-b5', 'What did God tell Moses to put inside the ark?', ['Manna only', 'The testimony', 'Aaron’s garments', 'Incense'], 1, 'Exodus 25:16', 'Hard', 'exo', ['law']),

  // ------------------------------------------------------------ Leviticus
  q('lev-b1', 'On the Day of Atonement, what carried the people’s sins into the wilderness?', ['A bullock', 'A dove', 'The scapegoat', 'A lamb'], 2, 'Leviticus 16:22', 'Hard', 'lev', ['law']),
  q('lev-b2', 'Complete the command: “Ye shall be holy: for I the LORD your God am ___.”', ['Holy', 'Mighty', 'Righteous', 'Faithful'], 0, 'Leviticus 19:2', 'Easy', 'lev', ['law']),
  q('lev-b3', 'Which two sons of Aaron offered strange fire before the LORD?', ['Nadab and Abihu', 'Eleazar and Ithamar', 'Korah and Dathan', 'Hophni and Phinehas'], 0, 'Leviticus 10:1', 'Hard', 'lev'),
  q('lev-b4', 'How often was the year of jubilee to be proclaimed?', ['Every seven years', 'Every ten years', 'Every fifty years', 'Every hundred years'], 2, 'Leviticus 25:10', 'Hard', 'lev', ['law']),
  q('lev-b5', 'Which command from Leviticus did Jesus call like the greatest one?', ['Keep the sabbath', 'Love thy neighbour as thyself', 'Honour thy father', 'Offer sacrifice'], 1, 'Leviticus 19:18', 'Medium', 'lev', ['law']),

  // ------------------------------------------------------------ Numbers
  q('num-b1', 'How many spies were sent to search out the land of Canaan?', ['Two', 'Seven', 'Ten', 'Twelve'], 3, 'Numbers 13:2', 'Medium', 'num'),
  q('num-b2', 'Which two spies urged Israel to go up and take the land?', ['Joshua and Caleb', 'Aaron and Hur', 'Nadab and Abihu', 'Dathan and Abiram'], 0, 'Numbers 14:6', 'Medium', 'num', ['faith']),
  q('num-b3', 'Whose donkey spoke to him on the road?', ['Balak', 'Balaam', 'Korah', 'Eleazar'], 1, 'Numbers 22:28', 'Medium', 'num'),
  q('num-b4', 'What did Moses lift up so the bitten might live?', ['A brasen serpent', 'A staff', 'A banner', 'A golden calf'], 0, 'Numbers 21:9', 'Medium', 'num', ['salvation']),
  q('num-b5', 'How many years did Israel wander for their unbelief?', ['Twelve', 'Twenty', 'Forty', 'Seventy'], 2, 'Numbers 14:33', 'Easy', 'num'),

  // ------------------------------------------------------------ Deuteronomy
  q('deu-b1', 'Complete the Shema: “Hear, O Israel: The LORD our God is ___ LORD.”', ['One', 'Our', 'The', 'A great'], 0, 'Deuteronomy 6:4', 'Medium', 'deu', ['law']),
  q('deu-b2', 'Who was charged to lead Israel after Moses?', ['Caleb', 'Aaron', 'Joshua', 'Eleazar'], 2, 'Deuteronomy 31:7', 'Easy', 'deu'),
  q('deu-b3', 'From which mountain did Moses view the promised land?', ['Sinai', 'Nebo', 'Hermon', 'Carmel'], 1, 'Deuteronomy 34:1', 'Hard', 'deu'),
  q('deu-b4', 'How old was Moses when he died?', ['Eighty', 'A hundred', 'A hundred and twenty', 'A hundred and forty'], 2, 'Deuteronomy 34:7', 'Medium', 'deu'),
  q('deu-b5', 'Complete: “Man doth not live by bread only, but by every ___ of the LORD.”', ['Word that proceedeth out of the mouth', 'Promise', 'Command', 'Blessing'], 0, 'Deuteronomy 8:3', 'Medium', 'deu'),

  // ------------------------------------------------------------ Joshua
  q('jos-b1', 'What fell after Israel compassed the city?', ['The walls of Jericho', 'The gates of Ai', 'The towers of Gibeon', 'The house of Rahab'], 0, 'Joshua 6:20', 'Easy', 'jos', ['faith']),
  q('jos-b2', 'Who hid the two spies sent to Jericho?', ['Deborah', 'Rahab', 'Ruth', 'Jael'], 1, 'Joshua 2:4', 'Medium', 'jos', ['faith']),
  q('jos-b3', 'What stood still at Joshua’s word?', ['The river', 'The wind', 'The sun', 'The sea'], 2, 'Joshua 10:13', 'Medium', 'jos', ['miracles']),
  q('jos-b4', 'Which river did Israel cross into the promised land?', ['Nile', 'Euphrates', 'Kishon', 'Jordan'], 3, 'Joshua 3:17', 'Easy', 'jos'),
  q('jos-b5', 'Complete Joshua’s charge: “As for me and my house, we will ___ the LORD.”', ['Serve', 'Fear', 'Follow', 'Praise'], 0, 'Joshua 24:15', 'Easy', 'jos', ['faith']),

  // ------------------------------------------------------------ Judges
  q('jdg-b1', 'In what did Samson’s great strength lie?', ['His sword', 'His hair', 'His shield', 'His name'], 1, 'Judges 16:17', 'Easy', 'jdg'),
  q('jdg-b2', 'Which woman judged Israel and went to battle with Barak?', ['Jael', 'Deborah', 'Hannah', 'Miriam'], 1, 'Judges 4:4', 'Medium', 'jdg'),
  q('jdg-b3', 'How many men remained with Gideon for the battle?', ['Three hundred', 'Three thousand', 'Ten thousand', 'Twelve'], 0, 'Judges 7:7', 'Medium', 'jdg', ['faith']),
  q('jdg-b4', 'Who killed Sisera with a tent peg?', ['Deborah', 'Jael', 'Ruth', 'Abigail'], 1, 'Judges 4:21', 'Hard', 'jdg'),
  q('jdg-b5', 'How does Judges describe Israel when there was no king?', ['Every man did that which was right in his own eyes', 'They cried unto the LORD', 'They served Baal', 'They were scattered'], 0, 'Judges 21:25', 'Medium', 'jdg'),

  // ------------------------------------------------------------ Ruth
  q('rut-b1', 'Who said “whither thou goest, I will go”?', ['Naomi', 'Orpah', 'Ruth', 'Rachel'], 2, 'Ruth 1:16', 'Easy', 'rut', ['faith']),
  q('rut-b2', 'Whom did Ruth marry?', ['Boaz', 'Mahlon', 'Chilion', 'Elimelech'], 0, 'Ruth 4:13', 'Easy', 'rut'),
  q('rut-b3', 'Ruth came from which country?', ['Egypt', 'Moab', 'Edom', 'Syria'], 1, 'Ruth 1:4', 'Medium', 'rut'),
  q('rut-b4', 'What was the name of Ruth’s mother in law?', ['Naomi', 'Hannah', 'Leah', 'Sarah'], 0, 'Ruth 1:14', 'Easy', 'rut'),
  q('rut-b5', 'Ruth became the great grandmother of which king?', ['Saul', 'Solomon', 'David', 'Hezekiah'], 2, 'Ruth 4:17', 'Medium', 'rut'),

  // ------------------------------------------------------------ 1 Samuel
  q('1sa-b1', 'Who anointed Saul as the first king of Israel?', ['Samuel', 'Eli', 'Nathan', 'David'], 0, '1 Samuel 10:1', 'Medium', '1sa'),
  q('1sa-b2', 'With what did David strike Goliath?', ['A sword', 'A spear', 'A sling and a stone', 'A bow'], 2, '1 Samuel 17:49', 'Easy', '1sa', ['faith']),
  q('1sa-b3', 'Who prayed for a son and was given Samuel?', ['Hannah', 'Peninnah', 'Abigail', 'Michal'], 0, '1 Samuel 1:20', 'Medium', '1sa', ['prayer']),
  q('1sa-b4', 'How did Samuel answer the LORD’s call in the night?', ['Here am I', 'Speak; for thy servant heareth', 'Who art thou?', 'Send another'], 1, '1 Samuel 3:10', 'Medium', '1sa', ['prayer']),
  q('1sa-b5', 'Which son of Saul loved David as his own soul?', ['Ishbosheth', 'Abinadab', 'Jonathan', 'Melchishua'], 2, '1 Samuel 18:1', 'Medium', '1sa'),

  // ------------------------------------------------------------ 2 Samuel
  q('2sa-b1', 'What was David dancing before when Michal despised him?', ['The ark of the LORD', 'The tabernacle', 'The altar', 'The temple'], 0, '2 Samuel 6:14', 'Medium', '2sa'),
  q('2sa-b2', 'Which prophet said to David, “Thou art the man”?', ['Gad', 'Samuel', 'Nathan', 'Elijah'], 2, '2 Samuel 12:7', 'Medium', '2sa'),
  q('2sa-b3', 'Which son of David rebelled and made himself king?', ['Amnon', 'Absalom', 'Adonijah', 'Solomon'], 1, '2 Samuel 15:10', 'Medium', '2sa'),
  q('2sa-b4', 'Where was David anointed king over all Israel?', ['Jerusalem', 'Bethlehem', 'Hebron', 'Gilgal'], 2, '2 Samuel 5:3', 'Hard', '2sa'),
  q('2sa-b5', 'Who was the husband of Bathsheba?', ['Uriah', 'Joab', 'Abner', 'Ahithophel'], 0, '2 Samuel 11:3', 'Medium', '2sa'),

  // ------------------------------------------------------------ 1 Kings
  q('1ki-b1', 'What did Solomon ask God to give him?', ['Riches', 'Long life', 'An understanding heart', 'Victory'], 2, '1 Kings 3:9', 'Easy', '1ki', ['wisdom', 'prayer']),
  q('1ki-b2', 'Which queen came to prove Solomon with hard questions?', ['The queen of Egypt', 'The queen of Sheba', 'Jezebel', 'Esther'], 1, '1 Kings 10:1', 'Medium', '1ki', ['wisdom']),
  q('1ki-b3', 'On which mount did Elijah confront the prophets of Baal?', ['Sinai', 'Horeb', 'Carmel', 'Nebo'], 2, '1 Kings 18:20', 'Medium', '1ki', ['warfare']),
  q('1ki-b4', 'What fed Elijah at the brook Cherith?', ['Ravens', 'A widow', 'An angel', 'Doves'], 0, '1 Kings 17:6', 'Medium', '1ki', ['miracles']),
  q('1ki-b5', 'How did the LORD come to Elijah after the wind, earthquake and fire?', ['In thunder', 'In a still small voice', 'In a cloud', 'In a dream'], 1, '1 Kings 19:12', 'Medium', '1ki'),

  // ------------------------------------------------------------ 2 Kings
  q('2ki-b1', 'How did Elijah go up into heaven?', ['By a whirlwind', 'By a cloud', 'In sleep', 'By a ladder'], 0, '2 Kings 2:11', 'Medium', '2ki', ['miracles']),
  q('2ki-b2', 'Who asked for a double portion of Elijah’s spirit?', ['Gehazi', 'Elisha', 'Obadiah', 'Jehu'], 1, '2 Kings 2:9', 'Medium', '2ki'),
  q('2ki-b3', 'Which Syrian captain was cleansed of leprosy?', ['Ben-hadad', 'Hazael', 'Naaman', 'Rezin'], 2, '2 Kings 5:14', 'Medium', '2ki', ['miracles']),
  q('2ki-b4', 'How many times did Naaman dip in Jordan?', ['Three', 'Five', 'Seven', 'Ten'], 2, '2 Kings 5:14', 'Medium', '2ki', ['faith']),
  q('2ki-b5', 'Which king was told the book of the law had been found?', ['Hezekiah', 'Josiah', 'Manasseh', 'Ahaz'], 1, '2 Kings 22:8', 'Hard', '2ki'),

  // ------------------------------------------------------------ 1 Chronicles
  q('1ch-b1', 'Whom did all Israel anoint king in Hebron?', ['Saul', 'David', 'Solomon', 'Absalom'], 1, '1 Chronicles 11:3', 'Medium', '1ch'),
  q('1ch-b2', 'Who did David say would build the house of the LORD?', ['Nathan', 'Zadok', 'Solomon', 'Joab'], 2, '1 Chronicles 22:6', 'Medium', '1ch'),
  q('1ch-b3', 'Who prayed “Oh that thou wouldest bless me indeed”?', ['Jabez', 'Jehu', 'Jesse', 'Joash'], 0, '1 Chronicles 4:10', 'Hard', '1ch', ['prayer']),
  q('1ch-b4', 'Who died when he put forth his hand to the ark?', ['Uzza', 'Ahio', 'Obed-edom', 'Zadok'], 0, '1 Chronicles 13:10', 'Hard', '1ch'),
  q('1ch-b5', 'What did David prepare abundantly before his death?', ['An army', 'Materials for the house of God', 'A new city', 'A fleet of ships'], 1, '1 Chronicles 22:5', 'Medium', '1ch'),

  // ------------------------------------------------------------ 2 Chronicles
  q('2ch-b1', 'Who began to build the house of the LORD in Jerusalem?', ['David', 'Solomon', 'Hezekiah', 'Zerubbabel'], 1, '2 Chronicles 3:1', 'Easy', '2ch'),
  q('2ch-b2', 'Complete: “If my people, which are called by my name, shall ___ themselves.”', ['Humble', 'Gather', 'Cleanse', 'Prepare'], 0, '2 Chronicles 7:14', 'Medium', '2ch', ['prayer']),
  q('2ch-b3', 'Which king was struck with leprosy for burning incense?', ['Uzziah', 'Jotham', 'Ahaz', 'Amaziah'], 0, '2 Chronicles 26:19', 'Hard', '2ch'),
  q('2ch-b4', 'How old was Joash when he began to reign?', ['Seven', 'Twelve', 'Sixteen', 'Twenty'], 0, '2 Chronicles 24:1', 'Hard', '2ch'),
  q('2ch-b5', 'What did Jehoshaphat appoint to go out before the army?', ['Chariots', 'Singers praising the LORD', 'Archers', 'Priests with trumpets'], 1, '2 Chronicles 20:21', 'Hard', '2ch', ['faith']),

  // ------------------------------------------------------------ Ezra
  q('ezr-b1', 'Which king proclaimed that the house of the LORD be built?', ['Darius', 'Cyrus', 'Artaxerxes', 'Nebuchadnezzar'], 1, 'Ezra 1:1', 'Medium', 'ezr'),
  q('ezr-b2', 'What was finished in the sixth year of Darius?', ['The wall', 'The house of God', 'The palace', 'The gates'], 1, 'Ezra 6:15', 'Medium', 'ezr'),
  q('ezr-b3', 'Ezra was a ready scribe in what?', ['The law of Moses', 'The songs of David', 'The proverbs', 'The prophets'], 0, 'Ezra 7:6', 'Medium', 'ezr', ['law']),
  q('ezr-b4', 'Who began the work on the foundation of the temple?', ['Nehemiah', 'Zerubbabel', 'Haggai', 'Ezra'], 1, 'Ezra 3:8', 'Hard', 'ezr'),
  q('ezr-b5', 'What did the ancient men do when they saw the foundation laid?', ['Wept with a loud voice', 'Danced', 'Fled', 'Kept silence'], 0, 'Ezra 3:12', 'Hard', 'ezr'),

  // ------------------------------------------------------------ Nehemiah
  q('neh-b1', 'What did Nehemiah set out to rebuild?', ['The temple', 'The wall of Jerusalem', 'The palace', 'The altar'], 1, 'Nehemiah 2:17', 'Easy', 'neh'),
  q('neh-b2', 'What office did Nehemiah hold before the king?', ['Cupbearer', 'Scribe', 'Captain', 'Steward'], 0, 'Nehemiah 1:11', 'Medium', 'neh'),
  q('neh-b3', 'In how many days was the wall finished?', ['Seven', 'Forty', 'Fifty and two', 'Seventy'], 2, 'Nehemiah 6:15', 'Hard', 'neh'),
  q('neh-b4', 'Who read the book of the law before the congregation?', ['Nehemiah', 'Ezra', 'Zerubbabel', 'Hanani'], 1, 'Nehemiah 8:2', 'Medium', 'neh', ['law']),
  q('neh-b5', 'Complete: “The joy of the LORD is your ___.”', ['Portion', 'Refuge', 'Strength', 'Reward'], 2, 'Nehemiah 8:10', 'Easy', 'neh'),

  // ------------------------------------------------------------ Esther
  q('est-b1', 'Who was made queen in the place of Vashti?', ['Esther', 'Zeresh', 'Abigail', 'Michal'], 0, 'Esther 2:17', 'Easy', 'est'),
  q('est-b2', 'Who sought to destroy all the Jews in the kingdom?', ['Mordecai', 'Haman', 'Ahasuerus', 'Memucan'], 1, 'Esther 3:6', 'Medium', 'est'),
  q('est-b3', 'Who raised Esther as his own daughter?', ['Mordecai', 'Hegai', 'Hatach', 'Abihail'], 0, 'Esther 2:7', 'Medium', 'est'),
  q('est-b4', 'Complete: “Who knoweth whether thou art come to the kingdom for such a time as ___?”', ['This', 'That', 'Now', 'Then'], 0, 'Esther 4:14', 'Medium', 'est', ['faith']),
  q('est-b5', 'What feast was appointed to remember the deliverance?', ['Passover', 'Purim', 'Tabernacles', 'Pentecost'], 1, 'Esther 9:26', 'Hard', 'est'),

  // ------------------------------------------------------------ Job
  q('job-b1', 'After losing everything, what did Job not do?', ['Sin, nor charge God foolishly', 'Speak at all', 'Leave his house', 'Send for his friends'], 0, 'Job 1:22', 'Medium', 'job', ['faith']),
  q('job-b2', 'Complete: “The LORD gave, and the LORD hath ___ away.”', ['Called', 'Taken', 'Turned', 'Put'], 1, 'Job 1:21', 'Easy', 'job', ['faith']),
  q('job-b3', 'How many friends came to mourn with Job?', ['Two', 'Three', 'Four', 'Seven'], 1, 'Job 2:11', 'Medium', 'job'),
  q('job-b4', 'Out of what did the LORD answer Job?', ['A whirlwind', 'A cloud', 'A fire', 'A dream'], 0, 'Job 38:1', 'Medium', 'job'),
  q('job-b5', 'Complete Job’s confession: “I know that my ___ liveth.”', ['Father', 'Redeemer', 'Master', 'Witness'], 1, 'Job 19:25', 'Medium', 'job', ['salvation']),

  // ------------------------------------------------------------ Psalms
  q('psa-b1', 'Complete: “The LORD is my shepherd; I shall not ___.”', ['Fear', 'Fall', 'Want', 'Faint'], 2, 'Psalms 23:1', 'Easy', 'psa', ['faith']),
  q('psa-b2', 'Complete: “Thy word is a ___ unto my feet.”', ['Lamp', 'Light', 'Guide', 'Path'], 0, 'Psalms 119:105', 'Easy', 'psa', ['wisdom']),
  q('psa-b3', 'What do the heavens declare?', ['The glory of God', 'The works of men', 'The end of days', 'The law'], 0, 'Psalms 19:1', 'Easy', 'psa', ['creation']),
  q('psa-b4', 'Complete David’s prayer: “Create in me a ___ heart, O God.”', ['New', 'Clean', 'Whole', 'Willing'], 1, 'Psalms 51:10', 'Medium', 'psa', ['prayer']),
  q('psa-b5', 'The blessed man does not walk in the counsel of whom?', ['The ungodly', 'The proud', 'The stranger', 'The foolish'], 0, 'Psalms 1:1', 'Medium', 'psa', ['wisdom']),

  // ------------------------------------------------------------ Proverbs
  q('pro-b1', 'The fear of the LORD is the beginning of what?', ['Wisdom', 'Knowledge', 'Understanding', 'Life'], 1, 'Proverbs 1:7', 'Medium', 'pro', ['wisdom']),
  q('pro-b2', 'Complete: “Trust in the LORD with all thine heart; and lean not unto thine own ___.”', ['Strength', 'Riches', 'Understanding', 'Counsel'], 2, 'Proverbs 3:5', 'Easy', 'pro', ['wisdom', 'faith']),
  q('pro-b3', 'What does a soft answer turn away?', ['Wrath', 'Shame', 'Folly', 'Strife'], 0, 'Proverbs 15:1', 'Easy', 'pro', ['wisdom']),
  q('pro-b4', 'Complete: “Train up a child in the way he should ___.”', ['Learn', 'Go', 'Live', 'Walk'], 1, 'Proverbs 22:6', 'Easy', 'pro', ['wisdom']),
  q('pro-b5', 'In which chapter is the virtuous woman described?', ['Chapter 10', 'Chapter 20', 'Chapter 31', 'Chapter 15'], 2, 'Proverbs 31:10', 'Medium', 'pro', ['wisdom']),

  // ------------------------------------------------------------ Ecclesiastes
  q('ecc-b1', 'How does the Preacher open the book?', ['Vanity of vanities', 'Hear my words', 'Blessed is the man', 'Remember thy Creator'], 0, 'Ecclesiastes 1:2', 'Medium', 'ecc', ['wisdom']),
  q('ecc-b2', 'Complete: “To every thing there is a ___.”', ['Reason', 'Season', 'Purpose', 'Measure'], 1, 'Ecclesiastes 3:1', 'Easy', 'ecc', ['wisdom']),
  q('ecc-b3', 'When are we told to remember our Creator?', ['In the days of thy youth', 'In old age', 'In time of trouble', 'On the sabbath'], 0, 'Ecclesiastes 12:1', 'Medium', 'ecc', ['wisdom']),
  q('ecc-b4', 'What is called the whole duty of man?', ['To labour and rest', 'To fear God, and keep his commandments', 'To seek wisdom', 'To do justly'], 1, 'Ecclesiastes 12:13', 'Medium', 'ecc', ['wisdom', 'law']),
  q('ecc-b5', 'How does the Preacher describe himself in the opening verse?', ['A shepherd of Israel', 'The son of David, king in Jerusalem', 'A servant of the LORD', 'A man of sorrows'], 1, 'Ecclesiastes 1:1', 'Hard', 'ecc'),

  // ------------------------------------------------------------ Song of Solomon
  q('sng-b1', 'Complete: “I am the rose of ___.”', ['Sharon', 'Lebanon', 'Carmel', 'Gilead'], 0, 'Song of Solomon 2:1', 'Medium', 'sng'),
  q('sng-b2', 'Complete: “I am my beloved’s, and my beloved is ___.”', ['Near', 'Mine', 'Fair', 'Gone'], 1, 'Song of Solomon 6:3', 'Medium', 'sng'),
  q('sng-b3', 'Love is said to be strong as what?', ['Fire', 'Death', 'The sea', 'The morning'], 1, 'Song of Solomon 8:6', 'Medium', 'sng'),
  q('sng-b4', 'Whose voice is heard in the land when the flowers appear?', ['The turtle', 'The shepherd', 'The bridegroom', 'The watchman'], 0, 'Song of Solomon 2:12', 'Hard', 'sng'),
  q('sng-b5', 'To whom is the song attributed in the first verse?', ['David', 'Solomon', 'Asaph', 'Hezekiah'], 1, 'Song of Solomon 1:1', 'Easy', 'sng'),

  // ------------------------------------------------------------ Isaiah
  q('isa-b1', 'What did the seraphim cry one to another?', ['Holy, holy, holy', 'Glory to God', 'Peace on earth', 'Woe is me'], 0, 'Isaiah 6:3', 'Medium', 'isa', ['prophecy']),
  q('isa-b2', 'Complete: “For unto us a child is born, unto us a ___ is given.”', ['Saviour', 'Son', 'King', 'Light'], 1, 'Isaiah 9:6', 'Easy', 'isa', ['prophecy']),
  q('isa-b3', 'Complete: “He was wounded for our ___.”', ['Healing', 'Transgressions', 'Sorrows', 'Peace'], 1, 'Isaiah 53:5', 'Medium', 'isa', ['cross', 'salvation']),
  q('isa-b4', 'How did Isaiah answer the LORD’s question, “Whom shall I send?”', ['Here am I; send me', 'I am but a child', 'Send another', 'Who am I?'], 0, 'Isaiah 6:8', 'Medium', 'isa', ['prophecy']),
  q('isa-b5', 'They that wait upon the LORD shall do what?', ['Renew their strength', 'Inherit the land', 'See his face', 'Be comforted'], 0, 'Isaiah 40:31', 'Easy', 'isa', ['faith']),

  // ------------------------------------------------------------ Jeremiah
  q('jer-b1', 'When did the LORD say he knew Jeremiah?', ['Before he formed him in the belly', 'From his youth', 'From the day of his call', 'From his fathers'], 0, 'Jeremiah 1:5', 'Medium', 'jer', ['prophecy']),
  q('jer-b2', 'Where was Jeremiah sent to see a lesson in the making?', ['The potter’s house', 'The threshing floor', 'The city gate', 'The vineyard'], 0, 'Jeremiah 18:2', 'Medium', 'jer', ['prophecy']),
  q('jer-b3', 'Complete: “I know the thoughts that I think toward you, saith the LORD, thoughts of ___.”', ['Peace', 'Mercy', 'Judgment', 'Love'], 0, 'Jeremiah 29:11', 'Medium', 'jer', ['faith']),
  q('jer-b4', 'Where would the LORD write his law in the new covenant?', ['In their hearts', 'On tables of stone', 'In a book', 'On the doorposts'], 0, 'Jeremiah 31:33', 'Hard', 'jer', ['prophecy', 'salvation']),
  q('jer-b5', 'Into what was Jeremiah cast, where he sank in the mire?', ['A prison', 'A dungeon', 'A pit of lions', 'A furnace'], 1, 'Jeremiah 38:6', 'Hard', 'jer'),

  // ------------------------------------------------------------ Lamentations
  q('lam-b1', 'Which city is mourned as sitting solitary?', ['Babylon', 'Samaria', 'Jerusalem', 'Nineveh'], 2, 'Lamentations 1:1', 'Medium', 'lam'),
  q('lam-b2', 'How often are the LORD’s mercies said to be new?', ['Every morning', 'Every sabbath', 'Every year', 'Every evening'], 0, 'Lamentations 3:23', 'Medium', 'lam', ['faith']),
  q('lam-b3', 'Complete: “Great is thy ___.”', ['Mercy', 'Faithfulness', 'Kindness', 'Glory'], 1, 'Lamentations 3:23', 'Easy', 'lam', ['faith']),
  q('lam-b4', 'What is it good for a man to do, according to Lamentations?', ['Hope and quietly wait for the salvation of the LORD', 'Cry aloud', 'Flee the city', 'Keep silence always'], 0, 'Lamentations 3:26', 'Hard', 'lam', ['faith']),
  q('lam-b5', 'Complete the closing plea: “Turn thou us unto thee, O LORD, and we shall be ___.”', ['Saved', 'Turned', 'Healed', 'Gathered'], 1, 'Lamentations 5:21', 'Hard', 'lam', ['prayer']),

  // ------------------------------------------------------------ Ezekiel
  q('ezk-b1', 'What did Ezekiel see filling the valley?', ['Dry bones', 'Chariots', 'Waters', 'Trees'], 0, 'Ezekiel 37:1', 'Medium', 'ezk', ['prophecy']),
  q('ezk-b2', 'What would God give in place of the stony heart?', ['A new spirit only', 'An heart of flesh', 'A crown', 'A new name'], 1, 'Ezekiel 36:26', 'Medium', 'ezk', ['salvation']),
  q('ezk-b3', 'By which river was Ezekiel when the heavens opened?', ['Jordan', 'Chebar', 'Euphrates', 'Kishon'], 1, 'Ezekiel 1:1', 'Hard', 'ezk'),
  q('ezk-b4', 'How does the LORD address Ezekiel throughout the book?', ['Son of man', 'My servant', 'Watchman', 'Prophet of Israel'], 0, 'Ezekiel 2:1', 'Medium', 'ezk', ['prophecy']),
  q('ezk-b5', 'What office was Ezekiel given over the house of Israel?', ['A watchman', 'A judge', 'A priest', 'A captain'], 0, 'Ezekiel 33:7', 'Hard', 'ezk', ['prophecy']),

  // ------------------------------------------------------------ Daniel
  q('dan-b1', 'Into what was Daniel cast for praying?', ['A furnace', 'A den of lions', 'A dungeon', 'A pit'], 1, 'Daniel 6:16', 'Easy', 'dan', ['prayer', 'faith']),
  q('dan-b2', 'Who were cast into the burning fiery furnace?', ['Shadrach, Meshach, and Abednego', 'Daniel and his servants', 'Hananiah alone', 'The wise men'], 0, 'Daniel 3:20', 'Easy', 'dan', ['faith']),
  q('dan-b3', 'For which king did Daniel read the writing on the wall?', ['Nebuchadnezzar', 'Darius', 'Belshazzar', 'Cyrus'], 2, 'Daniel 5:5', 'Medium', 'dan', ['prophecy']),
  q('dan-b4', 'What did Daniel purpose in his heart in Babylon?', ['Not to defile himself with the king’s meat', 'To flee the city', 'To keep silence', 'To serve in the army'], 0, 'Daniel 1:8', 'Medium', 'dan', ['faith']),
  q('dan-b5', 'What did Nebuchadnezzar see in the dream Daniel interpreted?', ['A great image', 'A tree', 'A river', 'Four beasts'], 0, 'Daniel 2:31', 'Medium', 'dan', ['prophecy']),

  // ------------------------------------------------------------ Hosea
  q('hos-b1', 'Whom did Hosea take to wife at the LORD’s word?', ['Gomer', 'Rahab', 'Zilpah', 'Keturah'], 0, 'Hosea 1:3', 'Hard', 'hos', ['prophecy']),
  q('hos-b2', 'What did Hosea’s marriage picture?', ['Israel’s unfaithfulness', 'The coming exile', 'The temple', 'The famine'], 0, 'Hosea 1:2', 'Hard', 'hos', ['prophecy']),
  q('hos-b3', 'Complete: “My people are destroyed for lack of ___.”', ['Bread', 'Knowledge', 'Rain', 'Leaders'], 1, 'Hosea 4:6', 'Medium', 'hos'),
  q('hos-b4', 'Complete: “I desired mercy, and not ___.”', ['Sacrifice', 'Judgment', 'Offering', 'Praise'], 0, 'Hosea 6:6', 'Medium', 'hos'),
  q('hos-b5', 'They that sow the wind shall reap what?', ['The whirlwind', 'The harvest', 'The famine', 'The fire'], 0, 'Hosea 8:7', 'Medium', 'hos'),

  // ------------------------------------------------------------ Joel
  q('jol-b1', 'What devouring army opens the book of Joel?', ['Locusts', 'Chaldeans', 'Assyrians', 'Horsemen'], 0, 'Joel 1:4', 'Hard', 'jol', ['prophecy']),
  q('jol-b2', 'Complete: “I will pour out my spirit upon all ___.”', ['Israel', 'Flesh', 'Nations', 'The earth'], 1, 'Joel 2:28', 'Medium', 'jol', ['prophecy', 'church']),
  q('jol-b3', 'What are the people told to rend?', ['Their garments', 'Their heart', 'Their banners', 'The veil'], 1, 'Joel 2:13', 'Medium', 'jol'),
  q('jol-b4', 'What valley holds multitudes in Joel’s vision?', ['The valley of decision', 'The valley of bones', 'The valley of Achor', 'The valley of Hinnom'], 0, 'Joel 3:14', 'Hard', 'jol', ['prophecy']),
  q('jol-b5', 'Who prophesied the outpouring Peter quoted at Pentecost?', ['Joel', 'Amos', 'Micah', 'Malachi'], 0, 'Joel 2:28', 'Medium', 'jol', ['church', 'prophecy']),

  // ------------------------------------------------------------ Amos
  q('amo-b1', 'What was Amos before the LORD took him?', ['A herdman', 'A priest', 'A scribe', 'A soldier'], 0, 'Amos 7:14', 'Hard', 'amo'),
  q('amo-b2', 'Complete: “Let judgment run down as waters, and righteousness as a mighty ___.”', ['River', 'Stream', 'Sea', 'Wind'], 1, 'Amos 5:24', 'Medium', 'amo'),
  q('amo-b3', 'What did the LORD show Amos standing upon a wall?', ['A plumbline', 'A basket', 'A rod', 'A sword'], 0, 'Amos 7:8', 'Hard', 'amo', ['prophecy']),
  q('amo-b4', 'Amos was among the herdmen of which town?', ['Tekoa', 'Bethel', 'Gilgal', 'Samaria'], 0, 'Amos 1:1', 'Hard', 'amo'),
  q('amo-b5', 'What famine did Amos foretell?', ['Of bread', 'Of water', 'Of hearing the words of the LORD', 'Of oil'], 2, 'Amos 8:11', 'Hard', 'amo', ['prophecy']),

  // ------------------------------------------------------------ Obadiah
  q('oba-b1', 'Against which nation is Obadiah’s vision?', ['Moab', 'Edom', 'Ammon', 'Philistia'], 1, 'Obadiah 1:1', 'Hard', 'oba', ['prophecy']),
  q('oba-b2', 'What had deceived Edom?', ['The pride of thine heart', 'The counsel of strangers', 'Their riches', 'Their prophets'], 0, 'Obadiah 1:3', 'Hard', 'oba'),
  q('oba-b3', 'Where did Edom dwell, according to Obadiah?', ['In the clefts of the rock', 'By the great sea', 'In the plains', 'Among the reeds'], 0, 'Obadiah 1:3', 'Hard', 'oba'),
  q('oba-b4', 'Whose descendants does Obadiah name in the judgment?', ['Esau', 'Lot', 'Ishmael', 'Cain'], 0, 'Obadiah 1:6', 'Hard', 'oba'),
  q('oba-b5', 'Complete the closing line: “And the kingdom shall be the ___.”', ['LORD’s', 'King’s', 'People’s', 'Lord of hosts’'], 0, 'Obadiah 1:21', 'Hard', 'oba', ['prophecy']),

  // ------------------------------------------------------------ Jonah
  q('jon-b1', 'What did the LORD prepare to swallow Jonah?', ['A whale', 'A great fish', 'A serpent', 'A storm'], 1, 'Jonah 1:17', 'Easy', 'jon', ['miracles']),
  q('jon-b2', 'To which city was Jonah sent to cry against?', ['Babylon', 'Tarshish', 'Nineveh', 'Joppa'], 2, 'Jonah 1:2', 'Easy', 'jon'),
  q('jon-b3', 'Where did Jonah flee instead?', ['Tarshish', 'Egypt', 'Edom', 'Damascus'], 0, 'Jonah 1:3', 'Medium', 'jon'),
  q('jon-b4', 'How long was Jonah in the belly of the fish?', ['One day and night', 'Two days', 'Three days and three nights', 'Seven days'], 2, 'Jonah 1:17', 'Easy', 'jon'),
  q('jon-b5', 'What did God prepare to shade Jonah, then wither?', ['A gourd', 'A fig tree', 'A vine of grapes', 'A palm'], 0, 'Jonah 4:6', 'Medium', 'jon'),

  // ------------------------------------------------------------ Micah
  q('mic-b1', 'Which town did Micah name as the birthplace of the ruler?', ['Bethlehem Ephratah', 'Nazareth', 'Jerusalem', 'Hebron'], 0, 'Micah 5:2', 'Medium', 'mic', ['prophecy']),
  q('mic-b2', 'What does the LORD require: to do justly, to love mercy, and to do what?', ['Walk humbly with thy God', 'Offer sacrifice', 'Keep the feasts', 'Build the temple'], 0, 'Micah 6:8', 'Medium', 'mic', ['wisdom']),
  q('mic-b3', 'Into what would swords be beaten?', ['Plowshares', 'Chains', 'Pillars', 'Crowns'], 0, 'Micah 4:3', 'Medium', 'mic', ['prophecy']),
  q('mic-b4', 'Against which two cities did Micah’s word come?', ['Samaria and Jerusalem', 'Nineveh and Babylon', 'Tyre and Sidon', 'Bethel and Dan'], 0, 'Micah 1:1', 'Hard', 'mic', ['prophecy']),
  q('mic-b5', 'Complete: “Who is a God like unto thee, that pardoneth ___?”', ['Iniquity', 'The proud', 'All men', 'The nations'], 0, 'Micah 7:18', 'Hard', 'mic', ['salvation']),

  // ------------------------------------------------------------ Nahum
  q('nam-b1', 'Nahum’s burden concerns which city?', ['Babylon', 'Nineveh', 'Damascus', 'Tyre'], 1, 'Nahum 1:1', 'Hard', 'nam', ['prophecy']),
  q('nam-b2', 'Complete: “The LORD is good, a strong hold in the day of ___.”', ['Battle', 'Trouble', 'Wrath', 'Darkness'], 1, 'Nahum 1:7', 'Medium', 'nam', ['faith']),
  q('nam-b3', 'How is the LORD described in Nahum 1:3?', ['Slow to anger, and great in power', 'Swift to judge', 'Silent and hidden', 'A man of war only'], 0, 'Nahum 1:3', 'Hard', 'nam'),
  q('nam-b4', 'Whose feet are beautiful upon the mountains in Nahum?', ['Him that bringeth good tidings', 'The watchman', 'The king', 'The priest'], 0, 'Nahum 1:15', 'Hard', 'nam', ['prophecy']),
  q('nam-b5', 'Whose shepherds are said to slumber in the closing chapter?', ['The king of Assyria', 'The king of Egypt', 'The princes of Judah', 'The elders of Israel'], 0, 'Nahum 3:18', 'Hard', 'nam'),

  // ------------------------------------------------------------ Habakkuk
  q('hab-b1', 'Complete: “The just shall live by his ___.”', ['Works', 'Faith', 'Word', 'Hope'], 1, 'Habakkuk 2:4', 'Medium', 'hab', ['faith', 'salvation']),
  q('hab-b2', 'Which nation did God say he would raise up?', ['The Chaldeans', 'The Assyrians', 'The Egyptians', 'The Medes'], 0, 'Habakkuk 1:6', 'Hard', 'hab', ['prophecy']),
  q('hab-b3', 'What was Habakkuk told to do with the vision?', ['Write it, and make it plain upon tables', 'Seal it up', 'Speak it only', 'Bury it'], 0, 'Habakkuk 2:2', 'Hard', 'hab', ['prophecy']),
  q('hab-b4', 'Though the fig tree does not blossom, what does the prophet resolve?', ['Yet I will rejoice in the LORD', 'Yet I will be silent', 'Yet I will flee', 'Yet I will mourn'], 0, 'Habakkuk 3:18', 'Medium', 'hab', ['faith']),
  q('hab-b5', 'With what shall the earth be filled?', ['The knowledge of the glory of the LORD', 'Peace', 'Songs', 'Justice'], 0, 'Habakkuk 2:14', 'Medium', 'hab', ['prophecy']),

  // ------------------------------------------------------------ Zephaniah
  q('zep-b1', 'What is said to be at hand?', ['The day of the LORD', 'The harvest', 'The exile', 'The famine'], 0, 'Zephaniah 1:7', 'Medium', 'zep', ['prophecy']),
  q('zep-b2', 'What will the LORD do over his people with singing?', ['Rejoice', 'Mourn', 'Reason', 'Contend'], 0, 'Zephaniah 3:17', 'Medium', 'zep'),
  q('zep-b3', 'In whose reign did the word come to Zephaniah?', ['Josiah', 'Hezekiah', 'Manasseh', 'Jehoiakim'], 0, 'Zephaniah 1:1', 'Hard', 'zep'),
  q('zep-b4', 'Whom does Zephaniah call to seek the LORD?', ['All ye meek of the earth', 'The princes', 'The priests', 'The strangers'], 0, 'Zephaniah 2:3', 'Hard', 'zep'),
  q('zep-b5', 'How is the LORD in the midst of his people described?', ['Mighty', 'Silent', 'Far off', 'Hidden'], 0, 'Zephaniah 3:17', 'Medium', 'zep', ['faith']),

  // ------------------------------------------------------------ Haggai
  q('hag-b1', 'What did Haggai call the people to build?', ['The house of the LORD', 'The wall', 'Their own houses', 'A tower'], 0, 'Haggai 1:8', 'Medium', 'hag'),
  q('hag-b2', 'Complete the rebuke: “Ye have sown much, and bring in ___.”', ['Much', 'Little', 'Nothing', 'Enough'], 1, 'Haggai 1:6', 'Hard', 'hag'),
  q('hag-b3', 'Which governor of Judah did Haggai address?', ['Zerubbabel', 'Nehemiah', 'Ezra', 'Sheshbazzar'], 0, 'Haggai 1:1', 'Hard', 'hag'),
  q('hag-b4', 'Which high priest did Haggai address?', ['Joshua', 'Zadok', 'Eliashib', 'Hilkiah'], 0, 'Haggai 1:1', 'Hard', 'hag'),
  q('hag-b5', 'What was promised concerning the glory of the latter house?', ['It shall be greater than of the former', 'It shall be equal', 'It shall be hidden', 'It shall depart'], 0, 'Haggai 2:9', 'Medium', 'hag', ['prophecy']),

  // ------------------------------------------------------------ Zechariah
  q('zec-b1', 'Complete: “Not by might, nor by power, but by my ___.”', ['Word', 'Spirit', 'Hand', 'Name'], 1, 'Zechariah 4:6', 'Medium', 'zec'),
  q('zec-b2', 'How was the king to come to Jerusalem?', ['Lowly, and riding upon an ass', 'In a chariot', 'Upon the clouds', 'With an army'], 0, 'Zechariah 9:9', 'Medium', 'zec', ['prophecy']),
  q('zec-b3', 'How many pieces of silver were weighed for the price?', ['Twenty', 'Thirty', 'Forty', 'Fifty'], 1, 'Zechariah 11:12', 'Hard', 'zec', ['prophecy']),
  q('zec-b4', 'Complete: “They shall look upon me whom they have ___.”', ['Forsaken', 'Pierced', 'Sought', 'Denied'], 1, 'Zechariah 12:10', 'Hard', 'zec', ['prophecy', 'cross']),
  q('zec-b5', 'What stood beside the golden candlestick in the vision?', ['Two olive trees', 'Two angels', 'Seven lamps only', 'Four horns'], 0, 'Zechariah 4:3', 'Hard', 'zec', ['prophecy']),

  // ------------------------------------------------------------ Malachi
  q('mal-b1', 'In what did Malachi say the people had robbed God?', ['In tithes and offerings', 'In sabbaths', 'In vows', 'In prayers'], 0, 'Malachi 3:8', 'Medium', 'mal'),
  q('mal-b2', 'Where were the tithes to be brought?', ['Into the storehouse', 'To the priests’ homes', 'To the city gate', 'Into the field'], 0, 'Malachi 3:10', 'Medium', 'mal'),
  q('mal-b3', 'Who was to be sent to prepare the way before the LORD?', ['My messenger', 'A king', 'A priest', 'An angel of judgment'], 0, 'Malachi 3:1', 'Medium', 'mal', ['prophecy']),
  q('mal-b4', 'Which prophet was promised before the great and dreadful day?', ['Elijah', 'Moses', 'Isaiah', 'Enoch'], 0, 'Malachi 4:5', 'Medium', 'mal', ['prophecy']),
  q('mal-b5', 'Complete: “For I am the LORD, I ___ not.”', ['Slumber', 'Change', 'Forget', 'Fail'], 1, 'Malachi 3:6', 'Medium', 'mal', ['faith']),

  // ------------------------------------------------------------ Matthew
  q('mat-b1', 'Where did Jesus deliver the Beatitudes?', ['Into a mountain', 'By the sea', 'In the temple', 'In a boat'], 0, 'Matthew 5:1', 'Medium', 'mat'),
  q('mat-b2', 'How does the Lord’s prayer begin in Matthew?', ['Our Father which art in heaven', 'Almighty God', 'O LORD my strength', 'Hear me, O God'], 0, 'Matthew 6:9', 'Easy', 'mat', ['prayer']),
  q('mat-b3', 'What did Peter answer when asked, “Whom say ye that I am?”', ['Thou art the Christ, the Son of the living God', 'Thou art a prophet', 'Thou art Elias', 'Thou art the teacher'], 0, 'Matthew 16:16', 'Medium', 'mat', ['faith']),
  q('mat-b4', 'What did the wise men bring to the young child?', ['Gold, frankincense, and myrrh', 'Silver and spices', 'Oil and wine', 'Bread and salt'], 0, 'Matthew 2:11', 'Easy', 'mat'),
  q('mat-b5', 'What does the Great Commission send disciples to do?', ['Teach all nations, baptizing them', 'Wait in Jerusalem', 'Build the church', 'Keep the law'], 0, 'Matthew 28:19', 'Medium', 'mat', ['church']),

  // ------------------------------------------------------------ Mark
  q('mrk-b1', 'How does Mark open his gospel?', ['The beginning of the gospel of Jesus Christ', 'In the beginning was the Word', 'The book of the generation', 'Many have taken in hand'], 0, 'Mark 1:1', 'Medium', 'mrk'),
  q('mrk-b2', 'What did Jesus say to the wind and the sea?', ['Peace, be still', 'Be thou clean', 'Rise, take up thy bed', 'Talitha cumi'], 0, 'Mark 4:39', 'Medium', 'mrk', ['miracles']),
  q('mrk-b3', 'How many loaves fed the five thousand in Mark?', ['Two', 'Five', 'Seven', 'Twelve'], 1, 'Mark 6:38', 'Medium', 'mrk', ['miracles']),
  q('mrk-b4', 'What did the poor widow cast into the treasury?', ['Two mites', 'A piece of silver', 'A talent', 'A penny'], 0, 'Mark 12:42', 'Medium', 'mrk'),
  q('mrk-b5', 'Who was compelled to bear the cross of Jesus?', ['Simon of Cyrene', 'Joseph of Arimathaea', 'Nicodemus', 'Barabbas'], 0, 'Mark 15:21', 'Medium', 'mrk', ['cross']),

  // ------------------------------------------------------------ Luke
  q('luk-b1', 'Which angel came to Mary?', ['Gabriel', 'Michael', 'Raphael', 'An angel of the LORD unnamed'], 0, 'Luke 1:26', 'Easy', 'luk'),
  q('luk-b2', 'Where was Jesus laid at his birth?', ['In a manger', 'In a house', 'In the inn', 'In the temple'], 0, 'Luke 2:7', 'Easy', 'luk'),
  q('luk-b3', 'To whom did the angel first announce the birth?', ['Shepherds abiding in the field', 'Wise men', 'The priests', 'Herod'], 0, 'Luke 2:8', 'Easy', 'luk'),
  q('luk-b4', 'In the parable, who showed mercy to the wounded man?', ['A Samaritan', 'A priest', 'A Levite', 'A lawyer'], 0, 'Luke 10:33', 'Easy', 'luk', ['parables']),
  q('luk-b5', 'What did the father do when the prodigal son was yet a great way off?', ['Ran, and fell on his neck', 'Sent a servant', 'Shut the door', 'Called the elder son'], 0, 'Luke 15:20', 'Medium', 'luk', ['parables', 'salvation']),

  // ------------------------------------------------------------ John
  q('jhn-b1', 'How does John’s gospel begin?', ['In the beginning was the Word', 'The book of the generation', 'The beginning of the gospel', 'There was a man sent from God'], 0, 'John 1:1', 'Easy', 'jhn'),
  q('jhn-b2', 'What was Jesus’ first miracle at Cana?', ['Turning water into wine', 'Healing a nobleman’s son', 'Feeding the multitude', 'Walking on water'], 0, 'John 2:11', 'Medium', 'jhn', ['miracles']),
  q('jhn-b3', 'Complete: “I am the way, the truth, and the ___.”', ['Light', 'Life', 'Door', 'Vine'], 1, 'John 14:6', 'Easy', 'jhn', ['salvation']),
  q('jhn-b4', 'What is the shortest verse, spoken at Lazarus’ tomb?', ['Jesus wept', 'It is finished', 'He is risen', 'Come and see'], 0, 'John 11:35', 'Medium', 'jhn'),
  q('jhn-b5', 'Complete: “I am the true ___, and my Father is the husbandman.”', ['Shepherd', 'Vine', 'Bread', 'Light'], 1, 'John 15:1', 'Medium', 'jhn'),

  // ------------------------------------------------------------ Acts
  q('act-b1', 'What appeared upon them at Pentecost?', ['Cloven tongues like as of fire', 'A bright cloud', 'A rushing river', 'A star'], 0, 'Acts 2:3', 'Medium', 'act', ['church']),
  q('act-b2', 'Who was stoned, and saw the heavens opened?', ['Stephen', 'Philip', 'Barnabas', 'James'], 0, 'Acts 7:59', 'Medium', 'act', ['church']),
  q('act-b3', 'On the road to which city was Saul struck down?', ['Damascus', 'Antioch', 'Joppa', 'Ephesus'], 0, 'Acts 9:3', 'Easy', 'act', ['salvation']),
  q('act-b4', 'Where were the disciples first called Christians?', ['Antioch', 'Jerusalem', 'Rome', 'Corinth'], 0, 'Acts 11:26', 'Medium', 'act', ['church']),
  q('act-b5', 'What happened while Paul and Silas sang in prison?', ['A great earthquake', 'A fire', 'A vision', 'A storm'], 0, 'Acts 16:26', 'Medium', 'act', ['prayer', 'church']),

  // ------------------------------------------------------------ Romans
  q('rom-b1', 'Complete: “For all have sinned, and come short of the ___ of God.”', ['Law', 'Glory', 'Grace', 'Kingdom'], 1, 'Romans 3:23', 'Easy', 'rom', ['salvation']),
  q('rom-b2', 'Complete: “The wages of sin is ___.”', ['Death', 'Sorrow', 'Bondage', 'Judgment'], 0, 'Romans 6:23', 'Easy', 'rom', ['salvation']),
  q('rom-b3', 'What works together for good to them that love God?', ['All things', 'Some things', 'Trials only', 'The law'], 0, 'Romans 8:28', 'Easy', 'rom', ['faith']),
  q('rom-b4', 'By what does faith come?', ['Hearing, and hearing by the word of God', 'Works', 'Prayer alone', 'Signs'], 0, 'Romans 10:17', 'Medium', 'rom', ['faith']),
  q('rom-b5', 'What are believers urged to present as a living sacrifice?', ['Their bodies', 'Their goods', 'Their offerings', 'Their households'], 0, 'Romans 12:1', 'Medium', 'rom'),

  // ------------------------------------------------------------ 1 Corinthians
  q('1co-b1', 'Which chapter is known as the chapter on charity?', ['Chapter 11', 'Chapter 12', 'Chapter 13', 'Chapter 15'], 2, '1 Corinthians 13:1', 'Medium', '1co'),
  q('1co-b2', 'Which of faith, hope and charity is called the greatest?', ['Faith', 'Hope', 'Charity', 'They are equal'], 2, '1 Corinthians 13:13', 'Easy', '1co'),
  q('1co-b3', 'What did Paul say the body of believers is?', ['The temple of God', 'A city', 'A field only', 'A flock'], 0, '1 Corinthians 3:16', 'Medium', '1co', ['church']),
  q('1co-b4', 'What did Paul deliver first of all concerning the gospel?', ['That Christ died for our sins', 'That the law is holy', 'That we must be baptized', 'That God is love'], 0, '1 Corinthians 15:3', 'Medium', '1co', ['cross', 'salvation']),
  q('1co-b5', 'What is to be done in remembrance of him?', ['Eat this bread, and drink this cup', 'Keep the sabbath', 'Wash one another’s feet', 'Sing psalms'], 0, '1 Corinthians 11:24', 'Medium', '1co', ['church']),

  // ------------------------------------------------------------ 2 Corinthians
  q('2co-b1', 'Complete: “My grace is sufficient for thee: for my strength is made perfect in ___.”', ['Trial', 'Weakness', 'Patience', 'Silence'], 1, '2 Corinthians 12:9', 'Medium', '2co', ['faith']),
  q('2co-b2', 'If any man be in Christ, he is what?', ['A new creature', 'A servant', 'A son of the law', 'An heir only'], 0, '2 Corinthians 5:17', 'Easy', '2co', ['salvation']),
  q('2co-b3', 'How does God love a giver?', ['A cheerful giver', 'A generous giver', 'A quiet giver', 'A willing giver'], 0, '2 Corinthians 9:7', 'Medium', '2co'),
  q('2co-b4', 'We walk by faith, not by what?', ['Sight', 'Works', 'Law', 'Wisdom'], 0, '2 Corinthians 5:7', 'Easy', '2co', ['faith']),
  q('2co-b5', 'What was given to Paul lest he be exalted above measure?', ['A thorn in the flesh', 'A charge to keep', 'A vision', 'A companion'], 0, '2 Corinthians 12:7', 'Medium', '2co'),

  // ------------------------------------------------------------ Galatians
  q('gal-b1', 'What is the first named fruit of the Spirit?', ['Love', 'Joy', 'Peace', 'Faith'], 0, 'Galatians 5:22', 'Medium', 'gal'),
  q('gal-b2', 'Complete: “I am crucified with Christ: nevertheless I ___.”', ['Live', 'Die daily', 'Labour', 'Rejoice'], 0, 'Galatians 2:20', 'Medium', 'gal', ['cross']),
  q('gal-b3', 'What does a man reap?', ['Whatsoever he soweth', 'What he is given', 'What he asks', 'What he keeps'], 0, 'Galatians 6:7', 'Easy', 'gal'),
  q('gal-b4', 'In Christ, what distinction does Paul say is removed?', ['Neither Jew nor Greek, bond nor free', 'Neither rich nor poor only', 'Neither young nor old', 'Neither near nor far'], 0, 'Galatians 3:28', 'Medium', 'gal', ['church']),
  q('gal-b5', 'What was the law described as, to bring us unto Christ?', ['A schoolmaster', 'A burden', 'A shadow only', 'A witness'], 0, 'Galatians 3:24', 'Hard', 'gal', ['law', 'salvation']),

  // ------------------------------------------------------------ Ephesians
  q('eph-b1', 'By what are we saved, through faith?', ['Grace', 'Works', 'The law', 'Baptism'], 0, 'Ephesians 2:8', 'Easy', 'eph', ['salvation']),
  q('eph-b2', 'What are believers told to put on?', ['The whole armour of God', 'A new name', 'The yoke', 'A crown'], 0, 'Ephesians 6:11', 'Easy', 'eph', ['warfare']),
  q('eph-b3', 'Which piece of armour is the word of God?', ['The sword of the Spirit', 'The shield of faith', 'The helmet', 'The breastplate'], 0, 'Ephesians 6:17', 'Medium', 'eph', ['warfare']),
  q('eph-b4', 'Against whom do we wrestle, if not flesh and blood?', ['Principalities and powers', 'Kings of the earth', 'False brethren', 'Our own hearts'], 0, 'Ephesians 6:12', 'Medium', 'eph', ['warfare']),
  q('eph-b5', 'How are husbands told to love their wives?', ['As Christ loved the church', 'As their own fathers', 'As the law requires', 'As their neighbours'], 0, 'Ephesians 5:25', 'Medium', 'eph'),

  // ------------------------------------------------------------ Philippians
  q('phi-b1', 'Complete: “I can do all things through Christ which ___ me.”', ['Strengtheneth', 'Calleth', 'Loveth', 'Sendeth'], 0, 'Philippians 4:13', 'Easy', 'phi', ['faith']),
  q('phi-b2', 'What are we told to be careful for nothing, but do instead?', ['By prayer and supplication let requests be known', 'Keep silence', 'Labour more', 'Ask counsel'], 0, 'Philippians 4:6', 'Medium', 'phi', ['prayer']),
  q('phi-b3', 'At the name of Jesus, what shall every knee do?', ['Bow', 'Tremble', 'Rise', 'Turn'], 0, 'Philippians 2:10', 'Medium', 'phi'),
  q('phi-b4', 'Complete: “For to me to live is Christ, and to die is ___.”', ['Rest', 'Gain', 'Peace', 'Glory'], 1, 'Philippians 1:21', 'Medium', 'phi', ['faith']),
  q('phi-b5', 'What peace passes all understanding?', ['The peace of God', 'The peace of men', 'The peace of the law', 'The peace of the world'], 0, 'Philippians 4:7', 'Easy', 'phi', ['prayer']),

  // ------------------------------------------------------------ Colossians
  q('col-b1', 'If ye then be risen with Christ, what should you seek?', ['Those things which are above', 'The praise of men', 'The wisdom of the world', 'A quiet life'], 0, 'Colossians 3:1', 'Medium', 'col'),
  q('col-b2', 'What is Christ called, in relation to the church?', ['The head of the body', 'The cornerstone only', 'The first apostle', 'The teacher'], 0, 'Colossians 1:18', 'Medium', 'col', ['church']),
  q('col-b3', 'Whatsoever ye do, how are you to do it?', ['Heartily, as to the Lord', 'Quickly', 'In secret', 'With counsel'], 0, 'Colossians 3:23', 'Medium', 'col'),
  q('col-b4', 'What are believers told to put on above all things?', ['Charity', 'Meekness', 'Patience', 'Knowledge'], 0, 'Colossians 3:14', 'Medium', 'col'),
  q('col-b5', 'In whom are hid all the treasures of wisdom and knowledge?', ['Christ', 'The law', 'The prophets', 'The church'], 0, 'Colossians 2:3', 'Hard', 'col', ['wisdom']),

  // ------------------------------------------------------------ 1 Thessalonians
  q('1th-b1', 'How does Paul say the Lord shall descend from heaven?', ['With a shout, and the trump of God', 'In silence', 'As a thief only', 'Upon a throne'], 0, '1 Thessalonians 4:16', 'Medium', '1th', ['prophecy']),
  q('1th-b2', 'Complete the threefold charge: “Rejoice evermore. Pray without ___.”', ['Ceasing', 'Doubting', 'Fainting', 'Measure'], 0, '1 Thessalonians 5:17', 'Easy', '1th', ['prayer']),
  q('1th-b3', 'In what are we to give thanks?', ['In every thing', 'In good times', 'In the assembly', 'In secret'], 0, '1 Thessalonians 5:18', 'Easy', '1th', ['prayer']),
  q('1th-b4', 'How does the day of the Lord come?', ['As a thief in the night', 'With warning', 'At the feast', 'At noon'], 0, '1 Thessalonians 5:2', 'Medium', '1th', ['prophecy']),
  q('1th-b5', 'What are believers told to do with all things?', ['Prove all things; hold fast that which is good', 'Refuse all things', 'Question nothing', 'Share all things'], 0, '1 Thessalonians 5:21', 'Hard', '1th', ['wisdom']),

  // ------------------------------------------------------------ 2 Thessalonians
  q('2th-b1', 'What did Paul command concerning any who would not work?', ['Neither should he eat', 'He should be cast out', 'He should be silent', 'He should be taught'], 0, '2 Thessalonians 3:10', 'Medium', '2th'),
  q('2th-b2', 'Complete: “Be not weary in ___.”', ['Well doing', 'The way', 'Prayer', 'Waiting'], 0, '2 Thessalonians 3:13', 'Medium', '2th'),
  q('2th-b3', 'Who is faithful to stablish and keep from evil?', ['The Lord', 'The church', 'The apostles', 'The brethren'], 0, '2 Thessalonians 3:3', 'Medium', '2th', ['faith']),
  q('2th-b4', 'What must come before the day of Christ?', ['A falling away first', 'A great revival', 'A famine', 'A new temple'], 0, '2 Thessalonians 2:3', 'Hard', '2th', ['prophecy']),
  q('2th-b5', 'What did Paul ask the brethren to do for him?', ['Pray for us', 'Send provisions', 'Write to him', 'Come quickly'], 0, '2 Thessalonians 3:1', 'Medium', '2th', ['prayer']),

  // ------------------------------------------------------------ 1 Timothy
  q('1ti-b1', 'What is called the root of all evil?', ['The love of money', 'Pride', 'Idleness', 'Anger'], 0, '1 Timothy 6:10', 'Easy', '1ti', ['wisdom']),
  q('1ti-b2', 'What was Timothy told not to let men despise?', ['His youth', 'His teaching', 'His journey', 'His weakness'], 0, '1 Timothy 4:12', 'Medium', '1ti'),
  q('1ti-b3', 'How many mediators are there between God and men?', ['One', 'Two', 'Many', 'Seven'], 0, '1 Timothy 2:5', 'Medium', '1ti', ['salvation']),
  q('1ti-b4', 'For whom does Paul urge that prayers be made?', ['All men, for kings and all in authority', 'The brethren only', 'The poor only', 'The elders'], 0, '1 Timothy 2:1', 'Medium', '1ti', ['prayer']),
  q('1ti-b5', 'What did Christ Jesus come into the world to do?', ['Save sinners', 'Judge the nations', 'Establish the law', 'Build the temple'], 0, '1 Timothy 1:15', 'Easy', '1ti', ['salvation']),

  // ------------------------------------------------------------ 2 Timothy
  q('2ti-b1', 'All scripture is given by what?', ['Inspiration of God', 'The counsel of men', 'The prophets alone', 'The church'], 0, '2 Timothy 3:16', 'Easy', '2ti'),
  q('2ti-b2', 'Complete Paul’s testimony: “I have fought a good fight, I have finished my ___.”', ['Work', 'Course', 'Race', 'Labour'], 1, '2 Timothy 4:7', 'Medium', '2ti', ['faith']),
  q('2ti-b3', 'What spirit has God not given us?', ['The spirit of fear', 'The spirit of truth', 'The spirit of adoption', 'The spirit of grace'], 0, '2 Timothy 1:7', 'Easy', '2ti', ['faith']),
  q('2ti-b4', 'What was Timothy urged to do with the word of truth?', ['Rightly divide it', 'Keep it hidden', 'Read it only', 'Debate it'], 0, '2 Timothy 2:15', 'Medium', '2ti'),
  q('2ti-b5', 'What did Paul say all that live godly in Christ shall suffer?', ['Persecution', 'Poverty', 'Sickness', 'Loneliness'], 0, '2 Timothy 3:12', 'Medium', '2ti'),

  // ------------------------------------------------------------ Titus
  q('tit-b1', 'Why did Paul leave Titus in Crete?', ['To set in order things wanting, and ordain elders', 'To build a temple', 'To collect an offering', 'To carry a letter'], 0, 'Titus 1:5', 'Hard', 'tit', ['church']),
  q('tit-b2', 'By what did God save us, and not by works of righteousness?', ['His mercy', 'Our faithfulness', 'The law', 'Our giving'], 0, 'Titus 3:5', 'Medium', 'tit', ['salvation']),
  q('tit-b3', 'What has appeared to all men, teaching us?', ['The grace of God', 'The law of Moses', 'The day of judgment', 'The wisdom of God'], 0, 'Titus 2:11', 'Medium', 'tit', ['salvation']),
  q('tit-b4', 'What are the aged women told to teach?', ['The young women', 'The elders', 'The children only', 'The strangers'], 0, 'Titus 2:4', 'Hard', 'tit'),
  q('tit-b5', 'What blessed hope are believers told to look for?', ['The glorious appearing of the great God and our Saviour', 'A new temple', 'Deliverance from Rome', 'An abundant harvest'], 0, 'Titus 2:13', 'Medium', 'tit', ['prophecy']),

  // ------------------------------------------------------------ Philemon
  q('phm-b1', 'On whose behalf did Paul write to Philemon?', ['Onesimus', 'Timothy', 'Tychicus', 'Epaphras'], 0, 'Philemon 1:10', 'Hard', 'phm'),
  q('phm-b2', 'What was Onesimus to Philemon before?', ['A servant', 'A son', 'A brother', 'A partner'], 0, 'Philemon 1:16', 'Hard', 'phm'),
  q('phm-b3', 'How did Paul ask Philemon to receive him?', ['As a brother beloved', 'As a stranger', 'As a debtor', 'As a servant only'], 0, 'Philemon 1:16', 'Hard', 'phm'),
  q('phm-b4', 'What did Paul offer concerning any wrong or debt?', ['Put that on mine account', 'Forget it', 'Let the church judge', 'Send him away'], 0, 'Philemon 1:18', 'Hard', 'phm'),
  q('phm-b5', 'How did Paul describe himself as he wrote?', ['A prisoner of Jesus Christ', 'An apostle', 'A servant of the church', 'A teacher'], 0, 'Philemon 1:1', 'Medium', 'phm'),

  // ------------------------------------------------------------ Hebrews
  q('heb-b1', 'How is faith defined in Hebrews?', ['The substance of things hoped for', 'A gift of the law', 'The work of men', 'A hidden mystery'], 0, 'Hebrews 11:1', 'Easy', 'heb', ['faith']),
  q('heb-b2', 'Without what is it impossible to please God?', ['Faith', 'Works', 'Sacrifice', 'Wisdom'], 0, 'Hebrews 11:6', 'Easy', 'heb', ['faith']),
  q('heb-b3', 'What surrounds us, so that we should run with patience?', ['So great a cloud of witnesses', 'A host of angels', 'The nations', 'The elders'], 0, 'Hebrews 12:1', 'Medium', 'heb', ['faith']),
  q('heb-b4', 'Jesus Christ is the same when?', ['Yesterday, and to day, and for ever', 'In this age only', 'From the beginning', 'Until the end'], 0, 'Hebrews 13:8', 'Easy', 'heb'),
  q('heb-b5', 'How is the word of God described?', ['Quick, and powerful, and sharper than any twoedged sword', 'A lamp only', 'A hidden treasure', 'A hard saying'], 0, 'Hebrews 4:12', 'Medium', 'heb'),

  // ------------------------------------------------------------ James
  q('jas-b1', 'What is faith without works?', ['Dead', 'Weak', 'Hidden', 'Enough'], 0, 'James 2:20', 'Easy', 'jas', ['faith']),
  q('jas-b2', 'If any lack wisdom, what should he do?', ['Ask of God', 'Seek counsel of men', 'Wait quietly', 'Study the law'], 0, 'James 1:5', 'Easy', 'jas', ['wisdom', 'prayer']),
  q('jas-b3', 'What small member boasts great things?', ['The tongue', 'The hand', 'The eye', 'The heart'], 0, 'James 3:5', 'Medium', 'jas'),
  q('jas-b4', 'Complete: “Resist the devil, and he will ___ from you.”', ['Flee', 'Turn', 'Depart in time', 'Be silent'], 0, 'James 4:7', 'Easy', 'jas', ['warfare']),
  q('jas-b5', 'What does the effectual fervent prayer of a righteous man do?', ['Availeth much', 'Is heard in secret', 'Is answered at once', 'Covers sin'], 0, 'James 5:16', 'Medium', 'jas', ['prayer']),

  // ------------------------------------------------------------ 1 Peter
  q('1pe-b1', 'What are believers told to cast upon him?', ['All your care', 'Your burdens only', 'Your gifts', 'Your fears of men'], 0, '1 Peter 5:7', 'Easy', '1pe', ['prayer', 'faith']),
  q('1pe-b2', 'How does Peter describe the adversary?', ['As a roaring lion', 'As a serpent', 'As a shadow', 'As a thief'], 0, '1 Peter 5:8', 'Medium', '1pe', ['warfare']),
  q('1pe-b3', 'What does charity cover?', ['The multitude of sins', 'The faults of few', 'All debts', 'Every shame'], 0, '1 Peter 4:8', 'Medium', '1pe'),
  q('1pe-b4', 'What are believers called in 1 Peter 2:9?', ['A chosen generation, a royal priesthood', 'A holy remnant', 'A scattered flock', 'A new Israel only'], 0, '1 Peter 2:9', 'Medium', '1pe', ['church']),
  q('1pe-b5', 'What should believers be ready to give?', ['An answer for the hope that is in you', 'An offering', 'A sign', 'A defence before kings'], 0, '1 Peter 3:15', 'Medium', '1pe', ['faith']),

  // ------------------------------------------------------------ 2 Peter
  q('2pe-b1', 'Why is the Lord longsuffering, not willing that any should perish?', ['That all should come to repentance', 'That the law be kept', 'That the church grow', 'That the nations be judged'], 0, '2 Peter 3:9', 'Medium', '2pe', ['salvation']),
  q('2pe-b2', 'How is one day with the Lord described?', ['As a thousand years', 'As a moment', 'As a watch', 'As an age'], 0, '2 Peter 3:8', 'Medium', '2pe'),
  q('2pe-b3', 'How did holy men of God speak?', ['As they were moved by the Holy Ghost', 'By their own counsel', 'By dreams only', 'By the elders'], 0, '2 Peter 1:21', 'Medium', '2pe', ['prophecy']),
  q('2pe-b4', 'How will the day of the Lord come?', ['As a thief in the night', 'With a sign', 'At the feast', 'After warning'], 0, '2 Peter 3:10', 'Medium', '2pe', ['prophecy']),
  q('2pe-b5', 'In what are believers told to grow?', ['Grace, and in the knowledge of our Lord', 'Numbers', 'Riches', 'Learning of men'], 0, '2 Peter 3:18', 'Medium', '2pe'),

  // ------------------------------------------------------------ 1 John
  q('1jn-b1', 'Complete: “God is ___.”', ['Love', 'Near', 'Just only', 'Silent'], 0, '1 John 4:8', 'Easy', '1jn'),
  q('1jn-b2', 'If we confess our sins, he is faithful and just to do what?', ['Forgive us our sins', 'Remember them no more only', 'Restore our place', 'Hear us again'], 0, '1 John 1:9', 'Easy', '1jn', ['salvation']),
  q('1jn-b3', 'What casts out fear?', ['Perfect love', 'Strong faith', 'Right doing', 'Knowledge'], 0, '1 John 4:18', 'Medium', '1jn'),
  q('1jn-b4', 'Greater is he that is in you than who?', ['He that is in the world', 'The accuser', 'The kings of earth', 'The false prophets'], 0, '1 John 4:4', 'Medium', '1jn', ['warfare']),
  q('1jn-b5', 'Why were these things written, according to 1 John 5:13?', ['That ye may know that ye have eternal life', 'That ye may fear', 'That ye may teach', 'That ye may be gathered'], 0, '1 John 5:13', 'Medium', '1jn', ['salvation']),

  // ------------------------------------------------------------ 2 John
  q('2jn-b1', 'To whom is the second epistle of John addressed?', ['The elect lady and her children', 'The church at Ephesus', 'Gaius', 'The brethren at Rome'], 0, '2 John 1:1', 'Hard', '2jn'),
  q('2jn-b2', 'What commandment does John say we had from the beginning?', ['That we love one another', 'That we keep the sabbath', 'That we watch', 'That we give'], 0, '2 John 1:5', 'Medium', '2jn'),
  q('2jn-b3', 'How does John define love in this letter?', ['That we walk after his commandments', 'That we give alms', 'That we speak well', 'That we gather often'], 0, '2 John 1:6', 'Hard', '2jn'),
  q('2jn-b4', 'Who is called a deceiver and an antichrist?', ['Whoso confesseth not that Jesus Christ is come in the flesh', 'Whoso teacheth the law', 'Whoso doubteth', 'Whoso departeth'], 0, '2 John 1:7', 'Hard', '2jn'),
  q('2jn-b5', 'How did John say he would rather speak with them?', ['Face to face', 'By messenger', 'In the assembly', 'By another letter'], 0, '2 John 1:12', 'Hard', '2jn'),

  // ------------------------------------------------------------ 3 John
  q('3jn-b1', 'To whom is the third epistle of John written?', ['Gaius', 'Diotrephes', 'Demetrius', 'The elect lady'], 0, '3 John 1:1', 'Hard', '3jn'),
  q('3jn-b2', 'What gave John no greater joy?', ['To hear that his children walk in truth', 'To receive gifts', 'To see the church grow', 'To be welcomed'], 0, '3 John 1:4', 'Medium', '3jn'),
  q('3jn-b3', 'Who loved to have the preeminence among them?', ['Diotrephes', 'Gaius', 'Demetrius', 'Onesimus'], 0, '3 John 1:9', 'Hard', '3jn'),
  q('3jn-b4', 'Who had a good report of all men?', ['Demetrius', 'Diotrephes', 'Gaius only', 'The elders'], 0, '3 John 1:12', 'Hard', '3jn'),
  q('3jn-b5', 'What does John urge: follow not that which is evil, but what?', ['That which is good', 'That which is written', 'That which is taught', 'That which is old'], 0, '3 John 1:11', 'Medium', '3jn'),

  // ------------------------------------------------------------ Jude
  q('jud-b1', 'What did Jude exhort believers to contend for?', ['The faith once delivered unto the saints', 'The temple', 'Their inheritance', 'The law'], 0, 'Jude 1:3', 'Medium', 'jud', ['faith']),
  q('jud-b2', 'How does Jude describe himself in the opening?', ['The servant of Jesus Christ, and brother of James', 'An apostle', 'An elder', 'A prophet'], 0, 'Jude 1:1', 'Hard', 'jud'),
  q('jud-b3', 'Who is able to keep you from falling?', ['Him that is able to keep you from falling', 'The elders', 'The angels', 'The church'], 0, 'Jude 1:24', 'Medium', 'jud', ['salvation']),
  q('jud-b4', 'Which archangel is named contending with the devil?', ['Michael', 'Gabriel', 'Raphael', 'Uriel'], 0, 'Jude 1:9', 'Hard', 'jud', ['warfare']),
  q('jud-b5', 'What are believers told to build themselves up on?', ['Your most holy faith', 'The counsel of elders', 'Good works', 'The prophets'], 0, 'Jude 1:20', 'Medium', 'jud', ['faith', 'prayer']),

  // ------------------------------------------------------------ Revelation
  q('rev-b1', 'To how many churches was the Revelation written?', ['Three', 'Five', 'Seven', 'Twelve'], 2, 'Revelation 1:11', 'Medium', 'rev', ['prophecy']),
  q('rev-b2', 'Complete: “Behold, I stand at the door, and ___.”', ['Wait', 'Knock', 'Call', 'Watch'], 1, 'Revelation 3:20', 'Easy', 'rev'),
  q('rev-b3', 'What will God wipe away from their eyes?', ['All tears', 'All shame', 'All fear', 'All sorrowful memory'], 0, 'Revelation 21:4', 'Easy', 'rev', ['prophecy']),
  q('rev-b4', 'What did John see coming down from God out of heaven?', ['A new Jerusalem', 'A great mountain', 'A white throne', 'An open book'], 0, 'Revelation 21:2', 'Medium', 'rev', ['prophecy']),
  q('rev-b5', 'Who is called Alpha and Omega?', ['The Lord', 'The angel', 'The elder', 'The witness'], 0, 'Revelation 1:8', 'Easy', 'rev'),
];
