import type { GameId, SkillId } from './types';

/* ------------------------------------------------------------------------
   CARDS  (English MVP)
   - `emoji` is a placeholder. When you have a real photo, put it in
     public/images/<id>.jpg|png|webp and set `image: 'cat.jpg'` – every game
     picks it up automatically.
   - Word audio: public/audio/words/<id>.mp3 (or .wav / .m4a …) – found automatically.
   ------------------------------------------------------------------------ */

export type CatId = 'animals' | 'transport' | 'food' | 'clothes' | 'home' | 'toys' | 'body' | 'nature' | 'people';

export interface Card {
  id: string;
  word: string;
  emoji: string;
  cat: CatId;
  image?: string;
}

const c = (id: string, word: string, emoji: string, cat: CatId, image?: string): Card => ({ id, word, emoji, cat, image });

export const CARDS: Card[] = [
  // animals
  c('cow', 'cow', '🐮', 'animals', 'cow.png'),
  c('cat', 'cat', '🐱', 'animals'),
  c('dog', 'dog', '🐶', 'animals', 'dog.png'),
  c('horse', 'horse', '🐴', 'animals', 'horse.png'),
  c('sheep', 'sheep', '🐑', 'animals', 'sheep.png'),
  c('goat', 'goat', '🐐', 'animals', 'goat.png'),
  c('duck', 'duck', '🦆', 'animals'),
  c('lion', 'lion', '🦁', 'animals'),
  c('monkey', 'monkey', '🐒', 'animals'),
  c('elephant', 'elephant', '🐘', 'animals'),
  c('frog', 'frog', '🐸', 'animals'),
  c('rabbit', 'rabbit', '🐰', 'animals'),
  c('bear', 'bear', '🐻', 'animals'),
  // transport
  c('car', 'car', '🚗', 'transport'),
  c('bus', 'bus', '🚌', 'transport'),
  c('airplane', 'airplane', '✈️', 'transport'),
  c('bicycle', 'bicycle', '🚲', 'transport'),
  c('rocket', 'rocket', '🚀', 'transport'),
  c('train', 'train', '🚂', 'transport'),
  // food
  c('apple', 'apple', '🍎', 'food'),
  c('banana', 'banana', '🍌', 'food'),
  c('orange', 'orange', '🍊', 'food'),
  c('pear', 'pear', '🍐', 'food'),
  c('watermelon', 'watermelon', '🍉', 'food'),
  c('bread', 'bread', '🍞', 'food'),
  c('cheese', 'cheese', '🧀', 'food'),
  c('egg', 'egg', '🥚', 'food'),
  c('carrot', 'carrot', '🥕', 'food'),
  c('tomato', 'tomato', '🍅', 'food'),
  c('cucumber', 'cucumber', '🥒', 'food'),
  c('milk', 'milk', '🥛', 'food'),
  // clothes
  c('t-shirt', 't-shirt', '👕', 'clothes'),
  c('pants', 'pants', '👖', 'clothes'),
  c('socks', 'socks', '🧦', 'clothes'),
  c('hat', 'hat', '👒', 'clothes'),
  c('shoes', 'shoes', '👟', 'clothes'),
  // home
  c('chair', 'chair', '🪑', 'home'),
  c('bed', 'bed', '🛏️', 'home'),
  c('door', 'door', '🚪', 'home'),
  c('spoon', 'spoon', '🥄', 'home'),
  c('cup', 'cup', '🥤', 'home'),
  // toys
  c('ball', 'ball', '⚽', 'toys'),
  c('balloon', 'balloon', '🎈', 'toys'),
  c('drum', 'drum', '🥁', 'toys'),
  c('doll', 'doll', '🪆', 'toys'),
  c('teddy', 'teddy', '🧸', 'toys'),
  // nature
  c('sun', 'sun', '🌞', 'nature'),
  c('moon', 'moon', '🌙', 'nature'),
  c('star', 'star', '⭐', 'nature'),
  c('tree', 'tree', '🌳', 'nature'),
  // body
  c('nose', 'nose', '👃', 'body'),
  c('eyes', 'eyes', '👀', 'body'),
  c('mouth', 'mouth', '👄', 'body'),
  c('ears', 'ears', '👂', 'body'),
  c('hand', 'hand', '✋', 'body'),
  c('foot', 'foot', '🦶', 'body'),
  // people
  c('mom', 'mom', '👩', 'people'),
  c('dad', 'dad', '👨', 'people'),
  c('baby', 'baby', '👶', 'people'),
];

export const CARD_BY_ID: Record<string, Card> = Object.fromEntries(CARDS.map((x) => [x.id, x]));
export const card = (id: string): Card => {
  const found = CARD_BY_ID[id];
  if (!found) throw new Error(`Unknown card "${id}"`);
  return found;
};
export const cardsIn = (...cats: CatId[]): Card[] => CARDS.filter((x) => cats.includes(x.cat));

/* ------------------------------------------------------------------------
   SOUND TOYS (game 1)   audio: public/audio/sounds/<id>.mp3
   ------------------------------------------------------------------------ */
export interface Toy {
  id: string;
  emoji: string;
  name: string;
  say: string; // the sound as text, shown in the speech bubble
}
export const TOY_PACKS: Record<string, Toy[]> = {
  animals: [
    { id: 'cow', emoji: '🐮', name: 'cow', say: 'Moo!' },
    { id: 'cat', emoji: '🐱', name: 'cat', say: 'Meow!' },
    { id: 'dog', emoji: '🐶', name: 'dog', say: 'Woof woof!' },
    { id: 'duck', emoji: '🦆', name: 'duck', say: 'Quack quack!' },
    { id: 'sheep', emoji: '🐑', name: 'sheep', say: 'Baa!' },
    { id: 'horse', emoji: '🐴', name: 'horse', say: 'Neigh!' },
  ],
  vehicles: [
    { id: 'car', emoji: '🚗', name: 'car', say: 'Beep beep!' },
    { id: 'train', emoji: '🚂', name: 'train', say: 'Choo choo!' },
    { id: 'bus', emoji: '🚌', name: 'bus', say: 'Honk honk!' },
    { id: 'airplane', emoji: '✈️', name: 'airplane', say: 'Vroom!' },
    { id: 'rocket', emoji: '🚀', name: 'rocket', say: 'Whoosh!' },
    { id: 'bicycle', emoji: '🚲', name: 'bicycle', say: 'Ring ring!' },
  ],
  things: [
    { id: 'drum', emoji: '🥁', name: 'drum', say: 'Boom boom!' },
    { id: 'door', emoji: '🚪', name: 'door', say: 'Knock knock!' },
    { id: 'tower', emoji: '🧱', name: 'tower', say: 'Bam!' },
    { id: 'eat', emoji: '😋', name: 'eating', say: 'Yum yum!' },
    { id: 'bell', emoji: '🔔', name: 'bell', say: 'Ding ding!' },
    { id: 'clap', emoji: '👏', name: 'clap', say: 'Clap clap!' },
  ],
};

/* ------------------------------------------------------------------------
   ECHO (game 2)   audio: public/audio/phonemes/<id>.mp3  e.g. a.mp3, ma.mp3, ma-ma.mp3
   ------------------------------------------------------------------------ */
export const ECHO_LEVELS: Record<string, string[]> = {
  vowels: ['a', 'o', 'u', 'i', 'e'],
  lips: ['ma', 'pa', 'ba', 'ma', 'pa', 'ba'],
  tongue: ['ta', 'da', 'na', 'ta', 'da', 'na'],
  ou: ['po', 'bu', 'mu', 'mo', 'bu', 'mo'],
  doubles: ['ma-ma', 'pa-pa', 'ba-ba', 'da-da', 'na-na'],
  mix: ['ma-pa', 'ba-ma', 'pa-ta', 'ta-ma', 'mo-pu', 'bu-da'],
};

/* ------------------------------------------------------------------------
   BUILD (game 6)   audio: public/audio/phrases/<id>.mp3
   ------------------------------------------------------------------------ */
export interface TrainWord {
  id: string; // also the audio file name, e.g. "ma-ma"
  syllables: string[];
  emoji: string;
}
export const TRAIN_WORDS: TrainWord[] = [
  { id: 'ma-ma', syllables: ['ma', 'ma'], emoji: '👩' },
  { id: 'pa-pa', syllables: ['pa', 'pa'], emoji: '👨' },
  { id: 'ba-by', syllables: ['ba', 'by'], emoji: '👶' },
  { id: 'pup-py', syllables: ['pup', 'py'], emoji: '🐶' },
  { id: 'kit-ty', syllables: ['kit', 'ty'], emoji: '🐱' },
  { id: 'ap-ple', syllables: ['ap', 'ple'], emoji: '🍎' },
  { id: 'ba-na-na', syllables: ['ba', 'na', 'na'], emoji: '🍌' },
  { id: 'mon-key', syllables: ['mon', 'key'], emoji: '🐒' },
  { id: 'rab-bit', syllables: ['rab', 'bit'], emoji: '🐰' },
];

export interface Phrase {
  id: string;
  words: { text: string; emoji: string }[];
}
export const TWO_WORD_PHRASES: Phrase[] = [
  { id: 'mom-sleeps', words: [{ text: 'Mom', emoji: '👩' }, { text: 'sleeps', emoji: '😴' }] },
  { id: 'dad-came', words: [{ text: 'Dad', emoji: '👨' }, { text: 'came', emoji: '🚪' }] },
  { id: 'give-ball', words: [{ text: 'Give', emoji: '🤲' }, { text: 'ball', emoji: '⚽' }] },
  { id: 'kitty-sleeps', words: [{ text: 'Kitty', emoji: '🐱' }, { text: 'sleeps', emoji: '😴' }] },
  { id: 'red-ball', words: [{ text: 'Red', emoji: '🔴' }, { text: 'ball', emoji: '⚽' }] },
  { id: 'want-drink', words: [{ text: 'Want', emoji: '🙋' }, { text: 'drink', emoji: '🥤' }] },
  { id: 'mom-give', words: [{ text: 'Mom', emoji: '👩' }, { text: 'give', emoji: '🤲' }] },
  { id: 'dog-runs', words: [{ text: 'Dog', emoji: '🐶' }, { text: 'runs', emoji: '🏃' }] },
];
export const SENTENCES: Phrase[] = [
  { id: 'mom-gives-milk', words: [{ text: 'Mom', emoji: '👩' }, { text: 'gives', emoji: '🤲' }, { text: 'milk', emoji: '🥛' }] },
  { id: 'dog-eats-bread', words: [{ text: 'Dog', emoji: '🐶' }, { text: 'eats', emoji: '🍽️' }, { text: 'bread', emoji: '🍞' }] },
  { id: 'i-want-apple', words: [{ text: 'I', emoji: '🙋' }, { text: 'want', emoji: '💛' }, { text: 'apple', emoji: '🍎' }] },
  { id: 'baby-sleeps-bed', words: [{ text: 'Baby', emoji: '👶' }, { text: 'sleeps', emoji: '😴' }, { text: 'in bed', emoji: '🛏️' }] },
  { id: 'cat-drinks-milk', words: [{ text: 'Cat', emoji: '🐱' }, { text: 'drinks', emoji: '🥛' }, { text: 'milk', emoji: '🥛' }] },
];
export interface Sequence {
  id: string;
  title: string;
  steps: { emoji: string; label: string }[];
}
export const SEQUENCES: Sequence[] = [
  { id: 'plant', title: 'Grow a flower', steps: [{ emoji: '🌰', label: 'seed' }, { emoji: '🌱', label: 'sprout' }, { emoji: '🌻', label: 'flower' }] },
  { id: 'hands', title: 'Wash hands', steps: [{ emoji: '🚰', label: 'water' }, { emoji: '🧼', label: 'soap' }, { emoji: '🧻', label: 'dry' }] },
  { id: 'teeth', title: 'Brush teeth', steps: [{ emoji: '🪥', label: 'take brush' }, { emoji: '🦷', label: 'brush' }, { emoji: '😁', label: 'smile' }] },
  { id: 'dress', title: 'Get dressed', steps: [{ emoji: '🧦', label: 'socks' }, { emoji: '👟', label: 'shoes' }, { emoji: '🧥', label: 'coat' }] },
];

/* ------------------------------------------------------------------------
   REQUEST BOARD (game 8)   audio: public/audio/aac/<id>.mp3
   ------------------------------------------------------------------------ */
export interface AacCard {
  id: string;
  word: string;
  emoji: string;
  color: string;
}
export const AAC_CORE: AacCard[] = [
  { id: 'want', word: 'I want', emoji: '🙋', color: '#ffc83d' },
  { id: 'more', word: 'more', emoji: '➕', color: '#a8e0c0' },
  { id: 'give', word: 'give', emoji: '🤲', color: '#ffc83d' },
  { id: 'help', word: 'help', emoji: '🆘', color: '#ff9d8f' },
  { id: 'drink', word: 'drink', emoji: '🥤', color: '#9fd4ff' },
  { id: 'eat', word: 'eat', emoji: '🍽️', color: '#ffd9a0' },
  { id: 'play', word: 'play', emoji: '🧸', color: '#d9c8ff' },
  { id: 'stop', word: 'stop', emoji: '✋', color: '#ff9d8f' },
  { id: 'no', word: "don't want", emoji: '🙅', color: '#ff9d8f' },
  { id: 'hurts', word: 'it hurts', emoji: '🤕', color: '#ff9d8f' },
  { id: 'rest', word: 'rest', emoji: '🛌', color: '#c4e9ff' },
];
export const AAC_THINGS: AacCard[] = [
  { id: 'juice', word: 'juice', emoji: '🧃', color: '#9fd4ff' },
  { id: 'apple', word: 'apple', emoji: '🍎', color: '#ffd9a0' },
  { id: 'cookie', word: 'cookie', emoji: '🍪', color: '#ffd9a0' },
  { id: 'ball', word: 'ball', emoji: '⚽', color: '#d9c8ff' },
  { id: 'teddy', word: 'teddy', emoji: '🧸', color: '#d9c8ff' },
  { id: 'car', word: 'car', emoji: '🚗', color: '#d9c8ff' },
  { id: 'book', word: 'book', emoji: '📖', color: '#d9c8ff' },
  { id: 'mom', word: 'mom', emoji: '👩', color: '#a8e0c0' },
];
export const AAC_BY_ID: Record<string, AacCard> = Object.fromEntries([...AAC_CORE, ...AAC_THINGS].map((x) => [x.id, x]));

/* ------------------------------------------------------------------------
   GAME META – used by home, hub, guides and the dashboard
   ------------------------------------------------------------------------ */
export interface GameMeta {
  id: GameId;
  title: string;
  emoji: string;
  color: string;
  skill: SkillId;
  tagline: string;
  modes: { id: string; label: string }[];
}

export const GAMES: GameMeta[] = [
  {
    id: 'sound-toys', title: 'Sound toys', emoji: '🐮', color: '#ffd9a0', skill: 'sounds',
    tagline: 'Tap, listen, copy the sound',
    modes: [{ id: 'animals', label: 'Animals' }, { id: 'vehicles', label: 'Vehicles' }, { id: 'things', label: 'Things' }, { id: 'bubbles', label: 'Bubbles' }],
  },
  {
    id: 'echo', title: 'Copy Lexi', emoji: '👄', color: '#ffb8c0', skill: 'sounds',
    tagline: 'Watch the mouth, say it back',
    modes: [{ id: 'vowels', label: 'A O U I E' }, { id: 'lips', label: 'ma pa ba' }, { id: 'tongue', label: 'ta da na' }, { id: 'ou', label: 'mo bu' }, { id: 'doubles', label: 'ma-ma' }, { id: 'mix', label: 'Mix' }],
  },
  {
    id: 'pick', title: 'Show me!', emoji: '👆', color: '#c4e9ff', skill: 'understanding',
    tagline: 'Hear a word, find the picture',
    modes: [{ id: '2', label: '2 cards' }, { id: '3', label: '3 cards' }, { id: '4', label: '4 cards' }, { id: 'body', label: 'Body' }, { id: 'lotto', label: 'Lotto' }],
  },
  {
    id: 'sort', title: 'Drag & sort', emoji: '🪣', color: '#a8e0c0', skill: 'words',
    tagline: 'Odd one out, baskets, feeding',
    modes: [{ id: 'odd', label: 'Odd one out' }, { id: 'baskets', label: 'Two baskets' }, { id: 'feed', label: 'Feed the bear' }, { id: 'dress', label: 'Dress the doll' }],
  },
  {
    id: 'pairs', title: 'Pairs', emoji: '🃏', color: '#d9c8ff', skill: 'play',
    tagline: 'Find two that match',
    modes: [{ id: '3', label: '3 pairs' }, { id: '4', label: '4 pairs' }, { id: '6', label: '6 pairs' }],
  },
  {
    id: 'build', title: 'Build it', emoji: '🚂', color: '#ffc83d', skill: 'phrases',
    tagline: 'Syllable train, words, sentences',
    modes: [{ id: 'train', label: 'Syllable train' }, { id: 'two', label: 'Two words' }, { id: 'sentence', label: 'Sentences' }, { id: 'steps', label: 'Picture steps' }],
  },
  {
    id: 'scenes', title: 'Pretend play', emoji: '🛒', color: '#ffcba4', skill: 'words',
    tagline: 'Shop, mystery bag, what is missing?',
    modes: [{ id: 'shop', label: 'Shop' }, { id: 'bag', label: 'Mystery bag' }, { id: 'missing', label: "What's missing?" }],
  },
  {
    id: 'request', title: 'Ask for it', emoji: '💬', color: '#9fd4ff', skill: 'communication',
    tagline: 'Picture cards to ask and say',
    modes: [{ id: 'board', label: 'Talk board' }, { id: 'ask', label: 'Ask for it' }, { id: 'help', label: 'Help me!' }],
  },
];
export const GAME_BY_ID: Record<GameId, GameMeta> = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameId, GameMeta>;

export const SKILLS: { id: SkillId; label: string; emoji: string; blurb: string }[] = [
  { id: 'sounds', label: 'Sounds & imitation', emoji: '🔊', blurb: 'Voice, vowels, syllables, copying sounds' },
  { id: 'understanding', label: 'Understanding words', emoji: '👂', blurb: 'Knows names of things, actions, instructions' },
  { id: 'words', label: 'Words & vocabulary', emoji: '💬', blurb: 'Says words, groups things by category' },
  { id: 'phrases', label: 'Phrases', emoji: '🧩', blurb: 'Two-word phrases and simple sentences' },
  { id: 'communication', label: 'Requests & communication', emoji: '🙋', blurb: 'Asks, refuses, calls for help' },
  { id: 'play', label: 'Play & attention', emoji: '🎲', blurb: 'Turn-taking, attention, memory, play' },
];
