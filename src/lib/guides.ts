import type { GameId } from './types';

/**
 * Method notes shown in the adult area and as a "?" sheet inside each game.
 * Same structure for every game: goal, skills, materials, steps, coaching tips, home tasks, criteria.
 * Written as a first draft – the logoped should review and edit this file.
 */
export interface Guide {
  goal: string;
  skills: string[];
  materials: string[];
  steps: string[];
  tips: string[];
  homeTasks: string[];
  criteria: string[];
}

export const GUIDES: Record<GameId, Guide> = {
  'sound-toys': {
    goal: 'Awaken the wish to copy sounds and build voice activity: animals, vehicles, everyday noises.',
    skills: ['Voice activity', 'Onomatopoeia (moo, beep, boom)', 'Joint attention', 'Cause and effect'],
    materials: ['Animal and vehicle figures', 'Drum, tambourine, maracas', 'Bubbles', 'Wind-up toy'],
    steps: [
      'Sit next to the child, screen between you, so you can both see it and each other.',
      'Tap a toy. Make the sound with exaggerated face, then wait about 5 seconds.',
      'If the child makes any sound, answer it with joy and tap again.',
      'Repeat the sound twice, then switch to the real toy or figure.',
      'End while the child still wants more.',
    ],
    tips: [
      'Wait. Silence with a hopeful face invites a sound.',
      'Copy the child’s sounds first – they learn that voice makes things happen.',
      'Do not ask "say moo!" more than once.',
    ],
    homeTasks: ['Say "moo" and "meow" with figures during bath or lunch.', 'Blow bubbles and wait for "pop!" or any sound before blowing again.'],
    criteria: ['Looks at the toy and at you', 'Makes any vocal sound after the toy sounds', 'Copies a sound or sound-like word'],
  },
  echo: {
    goal: 'Copy mouth shapes and voice: vowels, then syllables, using a face the child can watch.',
    skills: ['Vowel sounds A O U I E', 'Syllables ma, pa, ba, ta, da, na, mo, bu', 'Looking at the mouth', 'Imitation'],
    materials: ['Small mirror', 'Pictures of mouth positions', 'Lip-sync character (this app)'],
    steps: [
      'Let the child watch Lexi say the sound twice (use the turtle for slow).',
      'Say the sound yourself next to the screen, face level with the child.',
      'When the child tries, tap how it went: Said it, Tried, or Not yet.',
      'Do 5–6 sounds, then stop. Switch to a movement game if attention drops.',
      'Use the close-up button for lip sounds (M, P, B).',
    ],
    tips: [
      'Start with sounds the child already makes.',
      'Accept approximations. A sound close to the target is a success.',
      'Face the mirror together and make silly faces first.',
    ],
    homeTasks: ['Play "ma-ma, pa-pa" in the mirror for 3 minutes.', 'Sing vowels with different voices: loud, quiet, high, low.'],
    criteria: ['Looks at Lexi’s mouth', 'Produces any sound after the model', 'Matches the vowel or first sound', 'Repeats 2 same syllables'],
  },
  pick: {
    goal: 'Understand words: pick the named picture from 2, 3, then 4 cards.',
    skills: ['Names of objects and body parts', 'Choosing by word', 'Listening without gestures'],
    materials: ['Real objects and picture cards', 'Picture lotto', 'Toy animals, kitchen, doll'],
    steps: [
      'Check first with real objects: "Where is the cup?"',
      'Play the screen game with 2 cards. Say the word once and wait.',
      'If the child does not choose, point to the right card and say the word again.',
      'Move to 3 and 4 cards only after 4 of 5 choices go well.',
      'Finish with body parts: "Where is your nose?"',
    ],
    tips: ['Do not repeat the word again and again. Say it once, clearly.', 'Pointing counts as understanding – no speech is required here.'],
    homeTasks: ['Ask "Give me the spoon" at meals.', 'Hide a toy in a pile and ask "Where is the car?"'],
    criteria: ['Chooses correctly from 2 without help', 'From 3 without help', 'From 4 without help', 'Understands body-part names'],
  },
  sort: {
    goal: 'Group things by category and learn what belongs together: odd one out, two baskets, feeding, dressing.',
    skills: ['Classification', 'Words in categories', 'Fine motor (drag)', 'Following simple instructions'],
    materials: ['Toy fruit and vegetables', 'Doll with clothes', 'Teddy', 'Two baskets or boxes'],
    steps: [
      'Say the item name when the child touches it. Tap an item to hear it.',
      'Ask "Where does it go?" – let the child try before helping.',
      'Feed the bear and dress the doll: say "Yum!" or "Put on the socks".',
      'Repeat the same game with real toys.',
    ],
    tips: ['A wrong try just bounces back – no negative sound. Wait, then give a hint.', 'Name every item the child holds.'],
    homeTasks: ['Sort laundry: "socks here, t-shirts there".', 'Put toys into 2 boxes: animals and cars.'],
    criteria: ['Drags an item to a target', 'Sorts 4 of 6 items correctly', 'Finds the odd one out'],
  },
  pairs: {
    goal: 'Build attention, memory and turn-taking by finding matching cards.',
    skills: ['Attention', 'Short-term memory', 'Turn-taking', 'Naming what is on the card'],
    materials: ['Paired picture cards', 'Matching toys', 'Picture domino'],
    steps: [
      'Start with 3 pairs. Take turns: child, adult, child.',
      'When a card flips, say its name. Listen to the recording together.',
      'Celebrate every match – and every try.',
      'Add pairs slowly; stop when interest drops.',
    ],
    tips: ['Name the picture each time a card opens.', 'Say "my turn / your turn" so turn-taking becomes a game.'],
    homeTasks: ['Match socks from the laundry basket.', 'Find two identical toys in a box.'],
    criteria: ['Waits for a turn', 'Finds a pair with 3 pairs', 'Finds pairs with 4–6 pairs'],
  },
  build: {
    goal: 'Move from syllables to words, then to two-word phrases and short sentences.',
    skills: ['Syllables in words', 'Two-word phrases (who + what does)', 'Sentence order', 'Sequence of events'],
    materials: ['Syllable cards', 'Sentence-builder cards', 'Picture series (3 steps)', 'Magnetic board'],
    steps: [
      'Syllable train: tap each wagon and say the syllable together; then say the whole word.',
      'Two words: look at the picture, tap the words in order, say "Mom sleeps".',
      'Add a third word only when two words come easily.',
      'Picture steps: put the pictures in order and tell what happens first, next, last.',
    ],
    tips: ['Say the phrase with a small pause between words.', 'Add one word to what the child says ("Ball." → "Big ball.").'],
    homeTasks: ['At dinner say 2-word phrases: "Mom eats", "Give bread".', 'Tell the steps of washing hands.'],
    criteria: ['Taps the syllables in order', 'Says or points two words in order', 'Orders 3 pictures in a series'],
  },
  scenes: {
    goal: 'Use words in play: shop, mystery bag, and "what is missing?" – naming and short memory.',
    skills: ['First words and naming', 'Pretend play', 'Memory for objects', 'Turn-taking'],
    materials: ['Toy shop and products', 'Opaque bag with small objects', 'Tray with 3 toys and a cloth'],
    steps: [
      'Shop: ask for an item ("Apple, please!"). Tap Said / Tried / Not yet.',
      'Mystery bag: let the child pull out the item and name it. Give the word if needed.',
      'What is missing: look together, cover, remove, ask "What is gone?"',
      'Repeat with real toys right after the screen.',
    ],
    tips: ['Always give the word first, then wait for the child to try.', 'Accept pointing or an approximation.'],
    homeTasks: ['Play shop with real fruit and a toy till.', 'Put 3 toys under a cloth, remove one: "What is gone?"'],
    criteria: ['Names or tries a word', 'Asks with a word or gesture', 'Notices what is missing'],
  },
  request: {
    goal: 'Ask for things, say stop, call for help – with picture cards, sounds or words (alternative communication).',
    skills: ['Requests: I want, more, give, help', 'Refusing: stop, don’t want', 'Communicative initiative'],
    materials: ['Printed picture cards: want, more, give, help, drink, eat, play, stop', 'Favorite snack in a clear box', 'Toys out of reach'],
    steps: [
      'Put a favorite item where the child sees it but cannot reach it.',
      'Wait. Model the card: "I want juice". Let the child tap the cards.',
      'Give the item at once, saying the words. Do not demand a perfect sentence.',
      'Practice Help (stuck jar), More (cookies), Stop (rolling ball).',
    ],
    tips: ['Any communication works: card, point, sound, word.', 'Honor "stop" and "don’t want" right away – it builds trust.'],
    homeTasks: ['Put snack in a clear jar: wait for "help" or the card.', 'Offer small portions so the child can ask for "more".'],
    criteria: ['Taps a card to ask', 'Combines "I want" + item', 'Uses Help, More, Stop in context'],
  },
};
