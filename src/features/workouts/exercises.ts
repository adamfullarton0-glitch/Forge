/** The exercise database — ~33 movements with verified demo videos. */

export interface Exercise {
  /** Muscles worked, e.g. "Chest · Triceps · Front delts". */
  m: string;
  /** Prescribed sets × reps, e.g. "4 × 6–8". */
  sr: string;
  steps: string[];
  tip: string;
  /** Equipment ids required (keys into EQUIPMENT). */
  eq: string[];
  /** Alternative exercise names to swap to. */
  alt: string[];
  /** YouTube video id for the form tutorial, if bundled. */
  vid?: string;
  /** Cable-attachment guidance, if relevant. */
  att?: string[];
  /** Lower-body movement → progress in larger 5 kg / 10 lb jumps. */
  lower?: boolean;
}

export const EX: Record<string, Exercise> = {
  'Barbell Bench Press': {
    m: 'Chest · Triceps · Front delts',
    sr: '4 × 6–8',
    steps: [
      'Lie flat with eyes under the bar, feet planted, shoulder blades pinched back and down.',
      'Grip slightly wider than shoulder width and unrack with straight arms.',
      'Lower the bar under control to mid-chest, elbows tucked about 45°.',
      'Press back up in a slight arc until arms are locked out.',
    ],
    tip: 'Keep your butt on the bench and drive your feet into the floor for stability.',
    eq: ['barbell', 'bench'],
    alt: ['Incline Dumbbell Press', 'Push-Up'],
    vid: '4Y2ZdHCOXok',
  },
  'Incline Dumbbell Press': {
    m: 'Upper chest · Front delts · Triceps',
    sr: '3 × 8–10',
    steps: [
      'Set the bench to a 30–45° incline and sit back with dumbbells at shoulder level.',
      'Press the dumbbells up and slightly together until arms are extended.',
      'Lower slowly until you feel a stretch across the upper chest.',
      'Keep wrists stacked over elbows the whole time.',
    ],
    tip: "Don't set the incline too steep — past 45° it becomes a shoulder press.",
    eq: ['dumbbell', 'bench'],
    alt: ['Push-Up'],
  },
  'Overhead Press': {
    m: 'Shoulders · Triceps · Core',
    sr: '4 × 6–8',
    steps: [
      'Stand with the bar at collarbone height, grip just outside shoulders.',
      "Brace your core and glutes so your lower back doesn't arch.",
      'Press the bar straight up, moving your head slightly back out of the way.',
      'Lock out overhead with biceps by your ears, then lower under control.',
    ],
    tip: 'Squeeze your glutes hard — it protects your lower back.',
    eq: ['barbell'],
    alt: ['Seated Dumbbell Shoulder Press'],
    vid: 'hG6sWbZmW1c',
  },
  'Seated Dumbbell Shoulder Press': {
    m: 'Shoulders · Triceps',
    sr: '3 × 8–12',
    steps: [
      'Sit on an upright bench, dumbbells at shoulder height, palms forward.',
      'Press up until arms are extended without slamming the weights together.',
      'Lower with control until elbows are just below shoulder level.',
    ],
    tip: "Keep your ribs down — don't flare them to cheat the rep.",
    eq: ['dumbbell', 'bench'],
    alt: ['Overhead Press'],
  },
  'Lateral Raise': {
    m: 'Side delts',
    sr: '3 × 12–15',
    steps: [
      'Stand with light dumbbells at your sides, slight bend in the elbows.',
      'Raise the weights out to the sides, leading with your elbows.',
      'Stop at shoulder height, pause briefly, lower slowly.',
    ],
    tip: "Go light. If you're swinging, the weight is too heavy.",
    eq: ['dumbbell'],
    alt: ['Face Pull'],
    vid: '4hTUCDUQaNA',
  },
  'Rear Delt Fly': {
    m: 'Rear delts · Upper back',
    sr: '3 × 12–15',
    steps: [
      'Hinge forward at the hips with a flat back, dumbbells hanging below you.',
      'Raise the weights out to the sides with a slight elbow bend.',
      'Squeeze your shoulder blades at the top, lower slowly.',
    ],
    tip: 'Think about pulling your arms apart, not lifting the weight up.',
    eq: ['dumbbell'],
    alt: ['Face Pull'],
  },
  'Tricep Pushdown': {
    m: 'Triceps',
    sr: '3 × 10–12',
    steps: [
      'Face a cable machine with a bar or rope at chest height.',
      'Pin your elbows to your sides and push down until arms are straight.',
      'Squeeze at the bottom, then let the weight rise to about 90° at the elbow.',
    ],
    tip: 'If your elbows drift forward, drop the weight.',
    eq: ['cable'],
    att: [
      'Rope — splits at the bottom for a fuller squeeze',
      'Straight bar — slightly heavier loading',
      'V-bar — easiest on the wrists',
    ],
    alt: ['Skullcrusher', 'Dips'],
  },
  Skullcrusher: {
    m: 'Triceps (long head)',
    sr: '3 × 10–12',
    steps: [
      'Lie on a bench holding an EZ-bar or dumbbells over your chest.',
      'Keeping upper arms still, bend the elbows to lower the weight toward your forehead.',
      'Extend back up without letting the elbows flare wide.',
    ],
    tip: 'Lower the bar slightly behind your head for a bigger stretch.',
    eq: ['barbell', 'bench'],
    alt: ['Tricep Pushdown', 'Dips'],
  },
  Dips: {
    m: 'Chest · Triceps · Front delts',
    sr: '3 × 8–12',
    steps: [
      'Support yourself on parallel bars with arms locked out.',
      'Lean slightly forward and lower until shoulders are just below elbows.',
      'Press back up without locking out aggressively.',
    ],
    tip: 'Lean forward for chest emphasis, stay upright for triceps.',
    eq: ['pullupbar'],
    alt: ['Push-Up'],
  },
  'Push-Up': {
    m: 'Chest · Triceps · Core',
    sr: '3 × max reps',
    steps: [
      'Start in a plank with hands just outside shoulder width.',
      'Lower your whole body as one unit until your chest nearly touches the floor.',
      'Press back up keeping your hips in line with your shoulders.',
    ],
    tip: 'A sagging lower back means your core gave out — stop the set.',
    eq: [],
    alt: [],
  },
  'Cable Fly': {
    m: 'Chest',
    sr: '3 × 12–15',
    steps: [
      'Set cables at chest height and take a step forward, one foot ahead.',
      'With a slight elbow bend, bring your hands together in a hugging arc.',
      'Squeeze the chest at the middle, then open back slowly to a stretch.',
    ],
    tip: "Keep the same elbow angle throughout — it's a fly, not a press.",
    eq: ['cable'],
    att: ['D-handles — the only attachment you need here'],
    alt: ['Incline Dumbbell Press', 'Push-Up'],
  },
  Deadlift: {
    m: 'Posterior chain · Back · Grip',
    sr: '3 × 4–6',
    steps: [
      'Stand with the bar over mid-foot, shins about an inch away.',
      'Hinge down and grip just outside your legs, flat back, chest up.',
      'Push the floor away and stand tall, keeping the bar against your legs.',
      'Lock out with squeezed glutes, then lower by pushing your hips back.',
    ],
    tip: 'Treat every rep like the first one — reset your brace each time.',
    eq: ['barbell'],
    alt: ['Romanian Deadlift', 'Hip Thrust'],
    vid: 'XxWcirHIwVo',
    lower: true,
  },
  'Romanian Deadlift': {
    m: 'Hamstrings · Glutes · Lower back',
    sr: '3 × 8–10',
    steps: [
      'Hold the bar at hip level with a shoulder-width grip.',
      'Push your hips straight back with soft knees, sliding the bar down your thighs.',
      'Stop when you feel a deep hamstring stretch (usually mid-shin).',
      'Drive your hips forward to stand back up.',
    ],
    tip: "It's a hip hinge, not a squat — your knees barely move.",
    eq: ['barbell'],
    alt: ['Hip Thrust', 'Lying Leg Curl'],
    vid: '5bJEigM5iVg',
    lower: true,
  },
  'Pull-Up': {
    m: 'Lats · Biceps · Upper back',
    sr: '3 × max reps',
    steps: [
      'Hang from a bar with hands just outside shoulder width, palms away.',
      'Pull your chest toward the bar by driving your elbows down.',
      'Get your chin over the bar, then lower all the way to a dead hang.',
    ],
    tip: "Can't do one yet? Use a band or do slow negatives — they build fast.",
    eq: ['pullupbar'],
    alt: ['Lat Pulldown', 'Barbell Row'],
    vid: 'eGo4IYlbE5g',
  },
  'Lat Pulldown': {
    m: 'Lats · Biceps',
    sr: '3 × 10–12',
    steps: [
      'Sit with thighs locked under the pads, grip wide on the bar.',
      'Pull the bar to your upper chest while leaning back slightly.',
      'Squeeze your lats, then let the bar rise with full arm extension.',
    ],
    tip: 'Pull with your elbows, not your hands — imagine elbows going into your pockets.',
    eq: ['cable'],
    att: [
      'Wide lat bar — best for back width',
      'Neutral V-grip — more mid-back, wrist friendly',
      'Underhand close bar — extra biceps',
    ],
    alt: ['Pull-Up'],
    vid: 'SALxEARiMkw',
  },
  'Barbell Row': {
    m: 'Mid-back · Lats · Biceps',
    sr: '4 × 8–10',
    steps: [
      'Hinge to about 45° with a flat back, bar hanging at arm’s length.',
      'Pull the bar to your lower ribs, elbows tracking back.',
      'Pause, then lower under control without standing up between reps.',
    ],
    tip: 'If your torso bounces up every rep, lighten the load.',
    eq: ['barbell'],
    alt: ['Seated Cable Row'],
    vid: 'A1tmBJKKfVs',
  },
  'Seated Cable Row': {
    m: 'Mid-back · Lats · Biceps',
    sr: '3 × 10–12',
    steps: [
      'Sit tall with feet braced, grab the handle with arms extended.',
      'Pull the handle to your stomach, squeezing your shoulder blades together.',
      'Let your arms extend fully and shoulders stretch forward slightly.',
    ],
    tip: "Chest stays proud — don't turn it into a crunch.",
    eq: ['cable'],
    att: [
      'V-bar (close grip) — best all-rounder',
      'Wide bar — upper back emphasis',
      'Rope — longest range of motion',
    ],
    alt: ['Barbell Row'],
  },
  'Face Pull': {
    m: 'Rear delts · Rotator cuff',
    sr: '3 × 15',
    steps: [
      'Set a rope attachment at face height on a cable machine.',
      'Pull the rope toward your face, splitting the ends past your ears.',
      'Finish with elbows high and hands beside your head, then return slowly.',
    ],
    tip: "Great for posture and shoulder health — don't skip it.",
    eq: ['cable'],
    att: ['Rope — the only attachment that works properly here'],
    alt: ['Rear Delt Fly'],
  },
  'Barbell Shrug': {
    m: 'Traps',
    sr: '3 × 12–15',
    steps: [
      'Hold a barbell at hip level with straight arms.',
      'Shrug your shoulders straight up toward your ears.',
      'Hold the squeeze for a second, then lower fully.',
    ],
    tip: 'Straight up and down — rolling the shoulders adds nothing.',
    eq: ['barbell'],
    alt: [],
  },
  'Barbell Curl': {
    m: 'Biceps',
    sr: '3 × 8–12',
    steps: [
      'Stand holding the bar with an underhand, shoulder-width grip.',
      'Curl the bar up keeping elbows pinned to your sides.',
      'Squeeze at the top, lower slowly to full extension.',
    ],
    tip: 'The lowering half builds just as much muscle — take 2–3 seconds down.',
    eq: ['barbell'],
    alt: ['Hammer Curl'],
    vid: 'ZQWL7omZh94',
  },
  'Hammer Curl': {
    m: 'Biceps · Forearms',
    sr: '3 × 10–12',
    steps: [
      'Hold dumbbells at your sides with palms facing each other.',
      'Curl both up keeping that neutral grip the whole way.',
      'Lower under control without swinging.',
    ],
    tip: 'Hits the brachialis — makes arms look thicker from the side.',
    eq: ['dumbbell'],
    alt: ['Barbell Curl'],
  },
  'Preacher Curl': {
    m: 'Biceps',
    sr: '3 × 10–12',
    steps: [
      'Rest your upper arms flat on the preacher pad, gripping an EZ-bar.',
      'Curl up until forearms are vertical.',
      'Lower slowly until arms are almost fully straight.',
    ],
    tip: "Don't fully relax at the bottom — keep tension on the muscle.",
    eq: ['machine'],
    alt: ['Barbell Curl'],
  },
  'Barbell Back Squat': {
    m: 'Quads · Glutes · Core',
    sr: '4 × 6–8',
    steps: [
      'Set the bar on your upper traps, grip tight, stand with feet shoulder width.',
      'Brace your core, then sit down and back, knees tracking over toes.',
      'Descend until thighs are at least parallel to the floor.',
      'Drive up through your whole foot back to standing.',
    ],
    tip: 'Big breath into your belly before every rep — your brace is your seatbelt.',
    eq: ['barbell'],
    alt: ['Leg Press', 'Walking Lunge'],
    vid: 'gcNh17Ckjgg',
    lower: true,
  },
  'Front Squat': {
    m: 'Quads · Core · Upper back',
    sr: '3 × 6–8',
    steps: [
      'Rest the bar on your front delts with elbows high, fingertips under the bar.',
      'Squat down keeping your torso as upright as possible.',
      'Hit depth, then drive up while keeping those elbows lifted.',
    ],
    tip: 'If your elbows drop, the bar rolls forward — elbows up is rule one.',
    eq: ['barbell'],
    alt: ['Leg Press'],
    lower: true,
  },
  'Leg Press': {
    m: 'Quads · Glutes',
    sr: '3 × 10–12',
    steps: [
      'Sit in the machine with feet shoulder width on the platform.',
      'Lower the sled until knees reach about 90° without your lower back rounding off the pad.',
      'Press back up, stopping just short of locking the knees.',
    ],
    tip: 'Never let your hips curl up off the seat at the bottom.',
    eq: ['machine'],
    alt: ['Barbell Back Squat', 'Walking Lunge'],
    lower: true,
  },
  'Walking Lunge': {
    m: 'Quads · Glutes · Balance',
    sr: '3 × 10 per leg',
    steps: [
      'Hold dumbbells at your sides and step forward into a lunge.',
      'Lower until your back knee nearly touches the floor.',
      'Push through the front foot and step straight into the next lunge.',
    ],
    tip: 'Take a slightly wider stance for balance — like walking on train tracks, not a tightrope.',
    eq: [],
    alt: [],
    lower: true,
  },
  'Leg Extension': {
    m: 'Quads',
    sr: '3 × 12–15',
    steps: [
      "Sit with the pad on your shins, knees lined up with the machine's pivot.",
      'Extend your legs until straight, squeezing the quads hard.',
      'Lower slowly without letting the stack slam.',
    ],
    tip: 'Pause for one second at the top of every rep.',
    eq: ['machine'],
    alt: ['Walking Lunge'],
    lower: true,
  },
  'Lying Leg Curl': {
    m: 'Hamstrings',
    sr: '3 × 10–12',
    steps: [
      'Lie face down with the pad just above your heels.',
      'Curl your heels toward your glutes.',
      'Lower slowly to a full stretch without your hips lifting.',
    ],
    tip: 'Point your toes to make the hamstrings do more of the work.',
    eq: ['machine'],
    alt: ['Romanian Deadlift'],
    lower: true,
  },
  'Standing Calf Raise': {
    m: 'Calves',
    sr: '4 × 12–15',
    steps: [
      'Stand with the balls of your feet on a step, heels hanging off.',
      'Lower your heels for a deep stretch.',
      'Rise as high as you can onto your toes and hold for a second.',
    ],
    tip: 'Full stretch at the bottom matters more than the weight.',
    eq: [],
    alt: [],
    lower: true,
  },
  'Hip Thrust': {
    m: 'Glutes · Hamstrings',
    sr: '3 × 8–12',
    steps: [
      'Sit with your upper back on a bench, barbell over your hips.',
      'Drive through your heels and lift your hips until your body is a straight line.',
      'Squeeze your glutes hard at the top, then lower with control.',
    ],
    tip: 'Tuck your chin and look forward — it keeps your ribs down.',
    eq: ['barbell', 'bench'],
    alt: ['Walking Lunge'],
    vid: 'S_uZP4UH6J0',
    lower: true,
  },
  Plank: {
    m: 'Core',
    sr: '3 × 45–60 sec',
    steps: [
      'Set up on forearms and toes, body in one straight line.',
      "Squeeze your glutes and brace your abs like you're about to be poked.",
      'Breathe steadily and hold without letting your hips sag or pike.',
    ],
    tip: 'A shorter, harder plank beats a long, saggy one.',
    eq: [],
    alt: [],
  },
  'Goblet Squat': {
    m: 'Quads · Glutes · Core',
    sr: '3 × 10–12',
    steps: [
      'Hold one dumbbell vertically against your chest with both hands.',
      'Squat down between your knees, keeping your chest tall.',
      'Hit full depth, then drive back up through your whole foot.',
    ],
    tip: 'The weight at your chest acts as a counterbalance — most people squat deeper this way.',
    eq: ['dumbbell'],
    alt: ['Barbell Back Squat'],
    lower: true,
  },
  'Dumbbell Romanian Deadlift': {
    m: 'Hamstrings · Glutes',
    sr: '3 × 10–12',
    steps: [
      'Hold dumbbells resting against the front of your thighs, soft bend in the knees.',
      'Push your hips back, sliding the dumbbells down your legs with a flat back.',
      'Stop at a deep hamstring stretch, then drive your hips forward to stand tall.',
    ],
    tip: 'Keep the dumbbells brushing your legs the whole way down.',
    eq: ['dumbbell'],
    alt: ['Romanian Deadlift'],
    vid: 'hQgFixeXdZo',
    lower: true,
  },
};

export const EXERCISE_NAMES = Object.keys(EX);

export function getExercise(name: string): Exercise | undefined {
  return EX[name];
}

/** YouTube search fallback for movements without a bundled video. */
export const ytSearch = (name: string): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' proper form tutorial')}`;
