// 20 Countryside Ghibli Cottage Quests Pool across 4 Rooms / Categories
export interface CottageQuestItem {
  id: string;
  title: string;
  flavor_text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  coin_reward: number;
  is_daily: boolean;
  category: 'Intellect' | 'Vitality' | 'Serenity' | 'Craft';
  room: string;
}

export interface RoomCategory {
  name: 'Intellect' | 'Vitality' | 'Serenity' | 'Craft';
  room: string;
  room_description: string;
  icon: string;
  color: string;
  tasks: Omit<CottageQuestItem, 'category' | 'room'>[];
}

export const COTTAGE_QUEST_CATEGORIES: RoomCategory[] = [
  {
    name: 'Intellect',
    room: 'The Study / Library',
    room_description: 'A warm little room lined with tilting bookshelves, a brass desk lamp, and dust motes drifting through afternoon light.',
    icon: '📚',
    color: '#829C7C',
    tasks: [
      {
        id: 'int_01',
        title: 'Read for 20 minutes',
        flavor_text: 'Curl up by the window and add a page to your story.',
        difficulty: 'easy',
        xp_reward: 20,
        coin_reward: 5,
        is_daily: true,
      },
      {
        id: 'int_02',
        title: 'Study or review notes',
        flavor_text: "Light the desk lamp and let today's lesson settle in.",
        difficulty: 'medium',
        xp_reward: 35,
        coin_reward: 9,
        is_daily: true,
      },
      {
        id: 'int_03',
        title: 'Work on a coding project',
        flavor_text: 'Tinker away at your little invention until it hums to life.',
        difficulty: 'hard',
        xp_reward: 70,
        coin_reward: 18,
        is_daily: false,
      },
      {
        id: 'int_04',
        title: 'Learn something new',
        flavor_text: 'Follow a curious thread and see where it leads.',
        difficulty: 'medium',
        xp_reward: 30,
        coin_reward: 8,
        is_daily: false,
      },
      {
        id: 'int_05',
        title: 'Write for 15 minutes',
        flavor_text: 'Uncap the inkwell and let your thoughts spill onto the page.',
        difficulty: 'easy',
        xp_reward: 18,
        coin_reward: 5,
        is_daily: true,
      },
    ],
  },
  {
    name: 'Vitality',
    room: 'The Balcony / Zen Garden',
    room_description: 'A sun-warmed balcony with a lavender pot, a watering can, and a view over rolling green hills.',
    icon: '🌱',
    color: '#659D7B',
    tasks: [
      {
        id: 'vit_01',
        title: 'Drink a full glass of water',
        flavor_text: 'Fill your cup from the well and drink it slow.',
        difficulty: 'easy',
        xp_reward: 15,
        coin_reward: 4,
        is_daily: true,
      },
      {
        id: 'vit_02',
        title: 'Go for a walk or jog',
        flavor_text: 'Wander the meadow path until your cheeks turn pink.',
        difficulty: 'medium',
        xp_reward: 35,
        coin_reward: 9,
        is_daily: true,
      },
      {
        id: 'vit_03',
        title: 'Stretch for 10 minutes',
        flavor_text: 'Ease out the morning stiffness like a cat waking from a nap.',
        difficulty: 'easy',
        xp_reward: 20,
        coin_reward: 5,
        is_daily: true,
      },
      {
        id: 'vit_04',
        title: 'Cook a proper meal',
        flavor_text: 'Simmer something good and let the whole cottage smell like home.',
        difficulty: 'medium',
        xp_reward: 40,
        coin_reward: 10,
        is_daily: false,
      },
      {
        id: 'vit_05',
        title: 'Complete a full workout',
        flavor_text: 'Tend the garden of your own body until it thrives.',
        difficulty: 'hard',
        xp_reward: 65,
        coin_reward: 17,
        is_daily: false,
      },
    ],
  },
  {
    name: 'Serenity',
    room: 'The Hearth / Tea Nook',
    room_description: "A crackling fireplace, a well-worn armchair, and a kettle that's always just about to whistle.",
    icon: '🍵',
    color: '#C66B4D',
    tasks: [
      {
        id: 'ser_01',
        title: 'Meditate for 5–10 minutes',
        flavor_text: 'Sit by the hearth and let your thoughts settle like embers.',
        difficulty: 'easy',
        xp_reward: 20,
        coin_reward: 5,
        is_daily: true,
      },
      {
        id: 'ser_02',
        title: 'Journal about your day',
        flavor_text: 'Write a small letter to yourself before the candle burns low.',
        difficulty: 'easy',
        xp_reward: 18,
        coin_reward: 5,
        is_daily: true,
      },
      {
        id: 'ser_03',
        title: 'Take a screen-free break',
        flavor_text: 'Set the lantern down and simply watch the rain for a while.',
        difficulty: 'medium',
        xp_reward: 30,
        coin_reward: 8,
        is_daily: true,
      },
      {
        id: 'ser_04',
        title: 'Get to bed on time',
        flavor_text: 'Bank the fire, pull up the quilt, and let the day rest.',
        difficulty: 'medium',
        xp_reward: 35,
        coin_reward: 9,
        is_daily: true,
      },
      {
        id: 'ser_05',
        title: 'Have a proper tea break',
        flavor_text: 'Brew a pot, breathe in the steam, and do absolutely nothing else.',
        difficulty: 'easy',
        xp_reward: 15,
        coin_reward: 4,
        is_daily: false,
      },
    ],
  },
  {
    name: 'Craft',
    room: 'The Workshop / Studio',
    room_description: 'A tidy corner of sawdust and string, with half-finished projects waiting patiently on the shelf.',
    icon: '🔨',
    color: '#8C6239',
    tasks: [
      {
        id: 'cra_01',
        title: 'Tidy your space for 15 minutes',
        flavor_text: 'Sweep the workshop floor and set every tool back in its place.',
        difficulty: 'easy',
        xp_reward: 18,
        coin_reward: 5,
        is_daily: true,
      },
      {
        id: 'cra_02',
        title: 'Do a focused work session',
        flavor_text: 'Shut the workshop door and lose yourself in the work for a while.',
        difficulty: 'hard',
        xp_reward: 60,
        coin_reward: 15,
        is_daily: true,
      },
      {
        id: 'cra_03',
        title: 'Reach inbox zero',
        flavor_text: 'Answer every waiting letter until the desk is finally clear.',
        difficulty: 'medium',
        xp_reward: 30,
        coin_reward: 8,
        is_daily: false,
      },
      {
        id: 'cra_04',
        title: 'Review your budget',
        flavor_text: "Count the coins in the jar and see how the season's going.",
        difficulty: 'medium',
        xp_reward: 32,
        coin_reward: 8,
        is_daily: false,
      },
      {
        id: 'cra_05',
        title: 'Finish one small project',
        flavor_text: 'Put the last stitch in and hang your handiwork on the wall.',
        difficulty: 'hard',
        xp_reward: 55,
        coin_reward: 14,
        is_daily: false,
      },
    ],
  },
];

// Flattened list of all 20 quests
export const ALL_COTTAGE_QUESTS: CottageQuestItem[] = COTTAGE_QUEST_CATEGORIES.flatMap((cat) =>
  cat.tasks.map((t) => ({ ...t, category: cat.name, room: cat.room }))
);

// Initial 5 default active quests on the Daily Quest Board
export const DEFAULT_ACTIVE_QUEST_IDS = ['int_01', 'vit_01', 'ser_01', 'cra_01', 'int_02'];
