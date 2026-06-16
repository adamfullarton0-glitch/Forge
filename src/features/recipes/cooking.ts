import { GP, GB, GS, type Recipe } from './data';

/**
 * Generates a believable step-by-step cooking method for any recipe. Featured
 * recipes carry their own `steps`; generated recipes are assembled from the
 * protein/base/sauce parts they were built from.
 */

export interface Method {
  steps: string[];
  tip: string;
}

interface CookProtein {
  p: string;
  prep: string;
  sear: string | null;
  roast: string | null;
  wok: string | null;
  done: string;
  tip: string;
  nocook?: boolean;
}
interface CookBase {
  b: string;
  cook: string;
  roastable: boolean;
}
interface CookSauce {
  build: string;
  when: 'rub' | 'glaze' | 'end' | 'marinate';
}

const COOK_P: CookProtein[] = [
  {
    p: '180g chicken breast',
    prep: 'Pound it to an even thickness, pat dry and season',
    sear: '5–6 min per side over medium-high',
    roast: '18–20 min at 200°C',
    wok: 'sliced thin, 4–5 min over high heat',
    done: 'until it reaches 74°C and the juices run clear',
    tip: 'Rest it 3 minutes before slicing so the juices stay in the meat, not on the board.',
  },
  {
    p: '150g turkey mince',
    prep: "No prep needed — you'll break it up in the pan",
    sear: 'browned 6–8 min, breaking it up, until no pink remains',
    roast: null,
    wok: '6–8 min over high heat, breaking it up',
    done: 'until fully cooked through and the liquid has cooked off',
    tip: "Don't stir it constantly — let it sit to catch colour. That browning is flavour.",
  },
  {
    p: '150g lean beef strips',
    prep: 'Pat very dry and season well',
    sear: '2–3 min per side',
    roast: null,
    wok: '2–3 min over fierce heat, not crowded',
    done: 'browned outside and just blushing pink inside',
    tip: 'A screaming-hot dry pan sears; a cool crowded pan stews. Heat is everything.',
  },
  {
    p: '150g salmon fillet',
    prep: 'Pat the skin bone-dry and season',
    sear: 'skin-side down 4 min, then 2–3 min on the flesh',
    roast: '12–14 min at 200°C',
    wok: null,
    done: 'until it flakes easily and looks opaque',
    tip: "Press it skin-down for the first 10 seconds so it can't curl — that's the trick to crisp skin.",
  },
  {
    p: '180g cod loin',
    prep: 'Pat dry and season',
    sear: '3–4 min per side, turning gently',
    roast: '12–15 min at 200°C',
    wok: null,
    done: 'until opaque and just flaking',
    tip: 'Cod is delicate — flip it only once, with a wide spatula.',
  },
  {
    p: '150g tuna steak',
    prep: 'Oil lightly and season',
    sear: '1–2 min per side for a pink centre',
    roast: null,
    wok: null,
    done: 'seared outside, still rosy in the middle',
    tip: 'Treat it like a steak. Overcook tuna and it turns to cardboard — leave the middle pink.',
  },
  {
    p: '150g king prawns',
    prep: 'Peel, devein and pat dry',
    sear: '2 min per side over high heat',
    roast: '8–10 min at 200°C',
    wok: '2–3 min over high heat',
    done: 'until pink, opaque and curled into a loose C',
    tip: "The second they curl tight they're done. One minute too long and they go rubbery.",
  },
  {
    p: '2 eggs plus 2 whites',
    prep: 'Beat with a pinch of salt',
    sear: 'folded gently over low-medium for 2–3 min',
    roast: null,
    wok: null,
    done: 'until just set but still soft',
    tip: 'Pull them off the heat slightly underdone — they keep cooking on the plate.',
  },
  {
    p: '200g firm tofu',
    prep: 'Press it 15 min, cube, and toss in a little cornflour',
    sear: 'fried 8–10 min, turning, until golden on all sides',
    roast: 'baked 25 min at 200°C, turning once',
    wok: 'fried crisp, then sauced',
    done: 'until crisp and deep golden',
    tip: 'Dry tofu plus a dusting of cornflour is the whole secret to crispy, not soggy.',
  },
  {
    p: '180g chicken in a yogurt marinade',
    prep: 'Coat in seasoned yogurt and leave it 15 min or more',
    sear: '5–6 min per side',
    roast: '20 min at 200°C',
    wok: null,
    done: 'until 74°C with charred, blistered edges',
    tip: "The yogurt tenderises the chicken and chars into dark, smoky spots — don't wipe it off.",
  },
  {
    p: '200g cottage cheese',
    prep: 'Season with salt and pepper',
    sear: null,
    roast: null,
    wok: null,
    done: '',
    tip: "Blitz it smooth with a fork or blender if you'd rather a creamy sauce than curds.",
    nocook: true,
  },
  {
    p: '160g pork loin',
    prep: 'Pat dry and season',
    sear: '4–5 min per side',
    roast: '18–22 min at 200°C',
    wok: null,
    done: 'until 63°C with a faint blush, then rested',
    tip: 'Rest pork for 5 minutes — it carries on cooking off the heat and stays juicy.',
  },
  {
    p: '150g tempeh',
    prep: 'Steam or simmer it 8 min, then slice',
    sear: 'fried 3–4 min per side until golden',
    roast: 'baked 20 min at 200°C',
    wok: 'fried golden, then sauced',
    done: 'until golden and heated through',
    tip: 'The quick steam first kills any bitterness and helps it drink up the sauce.',
  },
  {
    p: '120g halloumi',
    prep: 'Slice it 1cm thick and pat dry',
    sear: 'dry-fried 2 min per side, no oil',
    roast: null,
    wok: null,
    done: 'until golden with griddle marks',
    tip: 'No oil needed — halloumi releases its own. Leave it alone until it colours, then flip once.',
  },
];

const COOK_B: CookBase[] = [
  {
    b: '75g dry white rice',
    cook: 'rinse it, then simmer in 1.5× its volume of water for 10–12 min and steam it, lid on, off the heat for 5 min',
    roastable: false,
  },
  {
    b: '75g dry brown rice',
    cook: 'simmer in plenty of water for about 25 min until tender, then drain',
    roastable: false,
  },
  {
    b: '70g dry quinoa',
    cook: 'rinse it well, simmer in 2× water for 15 min until the little germs pop, then fluff with a fork',
    roastable: false,
  },
  {
    b: '200g sweet potato',
    cook: 'peel and cube it, toss in a little oil and roast 25 min at 200°C until caramelised (or microwave 6–7 min)',
    roastable: true,
  },
  {
    b: '80g dry pasta',
    cook: 'boil in well-salted water for 9–11 min until al dente, saving a splash of the cooking water',
    roastable: false,
  },
  {
    b: '1 nest of egg noodles',
    cook: "soak or boil for 4 min, drain, and toss with a drop of oil so they don't clump",
    roastable: false,
  },
  {
    b: '1 large wholemeal wrap',
    cook: 'warm in a dry pan for 20 seconds a side until soft and pliable',
    roastable: false,
  },
  {
    b: '60g couscous',
    cook: 'cover with an equal volume of boiling stock, lid on for 5 min, then fluff with a fork',
    roastable: false,
  },
  {
    b: '200g baby potatoes',
    cook: 'halve and boil 12–15 min until tender (or roast 25 min for crispy edges)',
    roastable: true,
  },
  {
    b: '60g oats',
    cook: 'simmer with about 250ml milk or water for 4–5 min, stirring, until thick and creamy',
    roastable: false,
  },
];

const COOK_S: CookSauce[] = [
  {
    build:
      'Mix red chilli, garlic, smoked paprika, a squeeze of lemon and a splash of vinegar into a punchy rub',
    when: 'rub',
  },
  {
    build: 'Simmer soy sauce with a little honey, grated ginger and garlic until syrupy',
    when: 'glaze',
  },
  {
    build: 'Soften garlic in a little oil or butter and stir in mixed herbs and parsley',
    when: 'end',
  },
  {
    build:
      'Stir smoked paprika, garlic powder, a little tomato purée and honey into a quick BBQ glaze',
    when: 'glaze',
  },
  {
    build: 'Sauté garlic, halved cherry tomatoes and olives with oregano until jammy',
    when: 'end',
  },
  {
    build: 'Mix yogurt with garam masala, cumin, ginger and garlic into a marinade',
    when: 'marinate',
  },
  { build: 'Have good basil pesto ready', when: 'end' },
  {
    build: 'Combine paprika, a little cayenne, garlic powder, oregano and thyme into a dry rub',
    when: 'rub',
  },
  {
    build: 'Mix lemon zest and juice with plenty of cracked black pepper and a little garlic',
    when: 'end',
  },
  {
    build: 'Simmer soy, gochujang, a little honey, garlic and sesame oil into a glossy sauce',
    when: 'glaze',
  },
  { build: 'Whisk wholegrain mustard, honey and a splash of vinegar into a dressing', when: 'end' },
  {
    build: 'Loosen peanut butter with soy, lime, garlic and a little warm water into a sauce',
    when: 'end',
  },
  {
    build: 'Stir yogurt with lemon, garlic and dill into a cool tzatziki-style sauce',
    when: 'end',
  },
  { build: 'Loosen sweet chilli sauce with a squeeze of lime', when: 'glaze' },
];

const FEATURED_STEPS: Record<string, Method> = {
  'Chicken Burrito Bowl': {
    steps: [
      'Cook 75g rice: rinse, simmer in 1.5× water for 10–12 min, then steam off the heat 5 min. Stir through lime juice, zest and chopped coriander for lime rice.',
      "Butterfly a 180g chicken breast so it's an even thickness, pat dry, and season with salt, pepper, cumin and smoked paprika.",
      'Heat 1 tsp oil over medium-high and sear the chicken 5–6 min per side until it hits 74°C and the juices run clear. Rest 3 min, then slice.',
      'Warm black beans with a pinch of cumin. In a dry hot pan, char the sweetcorn 3–4 min until spotty and smoky.',
      'Dice tomato with a little red onion, lime and salt for a quick salsa. Slice the avocado.',
      'Build the bowl: lime rice on the bottom, then chicken, beans, charred corn, salsa and avocado. Finish with lime and coriander.',
    ],
    tip: 'Char the corn properly — those dark spots are where all the flavour lives.',
  },
  'Salmon, Rice & Greens': {
    steps: [
      'Cook 75g rice: rinse, simmer in 1.5× water 10–12 min, then steam off the heat 5 min.',
      'Pat a 150g salmon fillet bone-dry and season the skin and flesh.',
      'Heat 1 tsp oil over medium-high. Lay the salmon skin-side down and press gently for 10 sec. Cook 4 min undisturbed for crisp skin, then flip and give it 2–3 min until it flakes.',
      'Meanwhile, steam or pan-fry broccoli florets with sliced garlic 4–5 min until bright green and just tender. Squeeze over lemon.',
      'Plate the rice, garlic broccoli and salmon, with a lemon wedge on the side.',
    ],
    tip: 'Dry skin and a still pan are all you need for crisp salmon skin every time.',
  },
  'Turkey Chili': {
    steps: [
      'Dice an onion and a pepper. Heat 1 tsp oil and soften them 4–5 min.',
      'Add 150g turkey mince, break it up, and brown 6–8 min until there’s no pink left.',
      'Stir in cumin, smoked paprika, chilli and garlic and cook 1 min until fragrant.',
      'Add chopped tomatoes and a drained tin of kidney beans. Simmer 15–20 min, stirring now and then, until thick.',
      'Season, finish with lime and coriander, and serve on its own or over rice.',
    ],
    tip: "Let it simmer long enough to really thicken — that's where the deep flavour comes from.",
  },
  'Beef Stir-Fry Noodles': {
    steps: [
      'Soak or boil the egg noodles 4 min, drain, and toss with a drop of oil.',
      'Mix the sauce: soy sauce, grated ginger, garlic and a little honey.',
      'Get a wok smoking hot. Sear 150g beef strips (dry and not crowded) 2–3 min until browned, then remove.',
      'Stir-fry broccoli and sliced pepper 2–3 min, keeping them crisp.',
      'Return the beef, add the noodles and sauce, and toss hard 1–2 min until everything’s glossy and coated.',
    ],
    tip: 'High heat and a dry wok — crowding steams the beef instead of searing it.',
  },
  'Protein Pancakes': {
    steps: [
      'Blend 60g oats, 2 eggs, 1 banana, a scoop of whey and a splash of milk until smooth. Let the batter rest 2 min.',
      'Heat a lightly greased non-stick pan over medium.',
      'Pour small pancakes and cook until bubbles form on top and the edges set, about 2 min. Flip and give them 1–2 min more.',
      'Stack them up and top with berries or a little honey.',
    ],
    tip: 'Medium heat, never high — protein batter scorches in seconds.',
  },
  'Greek Yogurt Parfait': {
    steps: [
      'Spoon half the Greek yogurt into a glass or jar.',
      'Add a layer of berries and a little granola, then the rest of the yogurt.',
      'Top with more berries, granola, chopped almonds and a drizzle of honey.',
    ],
    tip: 'Add the granola right before you eat so it stays crunchy.',
  },
  'Tofu Veggie Curry': {
    steps: [
      'Press 200g tofu 15 min, cube it, and toss in a little cornflour. Fry in 1 tsp oil 8–10 min until golden, then set aside.',
      'Soften a diced onion 4 min. Add garlic, ginger and curry spices (or paste) and cook 1 min.',
      'Pour in coconut milk and simmer 5 min, then stir through spinach until it wilts.',
      'Return the crispy tofu, simmer 2–3 min, and serve over rice.',
    ],
    tip: 'Crisp the tofu first and add it back at the end so it keeps its texture in the sauce.',
  },
  'Tuna Pasta Salad': {
    steps: [
      'Boil 80g pasta in salted water until al dente, then drain and cool it under cold water.',
      'Drain the tuna and mix with light mayo, a squeeze of lemon and black pepper.',
      'Fold the tuna, sweetcorn and finely diced onion through the cooled pasta.',
      'Chill 10 min if you can, season, and serve.',
    ],
    tip: "Cool the pasta fully before mixing or it'll thin the mayo into a puddle.",
  },
  'PB Overnight Oats': {
    steps: [
      'In a jar, combine 60g oats, milk, a spoon of peanut butter, mashed banana and chia seeds.',
      'Stir really well, seal, and refrigerate overnight (or at least 4 hours).',
      'In the morning, loosen with a splash of milk and top with banana and a little extra peanut butter.',
    ],
    tip: "The chia needs the full chill to gel — that's what makes it thick and spoonable.",
  },
  'Shrimp Tacos': {
    steps: [
      'Toss the shrimp with lime, chilli, garlic and a little smoked paprika.',
      'Shred the cabbage. Mix yogurt with lime and a pinch of salt for the drizzle.',
      'Sear the shrimp in a hot pan 2 min per side until pink and curled.',
      'Warm the tortillas, then fill with slaw, shrimp and the yogurt drizzle. Finish with lime.',
    ],
    tip: 'Shrimp cook in minutes — pull them off the heat the moment they curl.',
  },
  'Egg White Veggie Omelette': {
    steps: [
      'Sauté sliced mushrooms and spinach in a non-stick pan until softened, then set aside.',
      'Beat the egg whites with salt and pepper. Pour into a lightly buttered pan over medium-low.',
      'As it sets, push the edges in and tilt the pan to fill the gaps. When it’s mostly set, add the veg, tomatoes and a little cheese to one half.',
      'Fold it over and slide onto the plate.',
    ],
    tip: 'Low-medium heat keeps the whites tender — high heat makes them rubbery.',
  },
  'Chicken & Sweet Potato Traybake': {
    steps: [
      'Heat the oven to 200°C. Cube the sweet potato and slice the peppers and onion.',
      'On a lined tray, toss the veg and chicken thighs with olive oil, salt, paprika and garlic.',
      "Spread everything in a single layer (don't crowd it). Roast 30–35 min, turning once, until the chicken is 74°C and the sweet potato edges caramelise.",
      'Finish with a squeeze of lemon or some fresh herbs.',
    ],
    tip: 'One layer with space around everything roasts; a crowded tray just steams.',
  },
};

const lower = (x: string): string => x.charAt(0).toLowerCase() + x.slice(1);

/** Returns the method for a recipe, or null if one can't be derived. */
export function cookSteps(r: Recipe): Method | null {
  if (r.steps) {
    return {
      steps: r.steps,
      tip:
        r.tip ??
        (r.meal === 'snack'
          ? 'Keep these ingredients on hand for an easy high-protein hit any time of day.'
          : 'A high-protein start to the day — prep ahead on busy mornings and scale the portion to your calorie goal.'),
    };
  }
  const featured = FEATURED_STEPS[r.name];
  if (featured) return featured;
  if (r.pIdx == null || r.bIdx == null || r.sIdx == null) return null;

  const protein = GP[r.pIdx];
  const base = GB[r.bIdx];
  const sauce = GS[r.sIdx];
  const P = COOK_P[r.pIdx];
  const B = COOK_B[r.bIdx];
  const S = COOK_S[r.sIdx];
  if (!protein || !base || !sauce || !P || !B || !S) return null;

  const pn = protein[0].toLowerCase();
  const bn = base[0].toLowerCase();
  const sname = sauce[0];
  const fmt = r.fmt;
  const preApplied = S.when === 'rub' || S.when === 'marinate';
  const s: string[] = [];

  s.push(
    `Get everything ready: ${P.p}, ${B.b}, a big handful of mixed greens, plus the makings of the ${sname} sauce. ${P.prep}.`,
  );
  if (S.when === 'marinate')
    s.push(
      `${S.build}, then coat the ${pn} and leave it to marinate while you prep the rest — 15 minutes minimum, longer is better.`,
    );
  else if (S.when === 'rub') s.push(`${S.build}, and rub it all over the ${pn}.`);
  s.push(`Cook the ${bn}: ${B.cook}.`);

  if (P.nocook) {
    s.push(
      `The ${pn} needs no cooking — just season it well${
        S.when === 'end' ? `. ${S.build}, and fold it through` : ''
      }.`,
    );
    s.push(
      `Layer it up: ${bn} and greens in a bowl with the ${pn} on top, and a squeeze of lemon.`,
    );
  } else if (fmt === 'Traybake' && P.roast) {
    s.push(
      `Heat the oven to 200°C and line a tray. Spread the ${pn}${
        B.roastable ? ` and the ${bn}` : ''
      } out with a handful of veg, drizzle with oil${
        S.when === 'rub' ? '' : ', season'
      }, and give everything room — a crowded tray steams instead of roasting.`,
    );
    s.push(
      `Roast ${P.roast}, turning once, ${P.done}.${
        B.roastable ? '' : ` (Cook the ${bn} separately as above.)`
      }`,
    );
    if (S.when === 'end' || S.when === 'glaze')
      s.push(
        `${S.build}, and ${
          S.when === 'glaze'
            ? 'brush it on for the last few minutes'
            : 'spoon it over once it’s out of the oven'
        }.`,
      );
  } else if (fmt === 'Stir-Fry') {
    s.push(
      P.wok
        ? `Get a wok or wide pan smoking hot with a little oil and stir-fry the ${pn} ${P.wok}, ${P.done}, then push it to one side.`
        : `Sear the ${pn} in a very hot pan ${P.sear ?? ''}, ${P.done}, then set it aside — it's too delicate to toss in a wok.`,
    );
    s.push(`Stir-fry the greens for 2 minutes, keeping them crisp and bright.`);
    s.push(
      preApplied
        ? `Return the ${pn}, splash in a little water or stock and toss hard for 1–2 minutes to pull the ${sname.toLowerCase()} flavours together, then pile it over the ${bn}.`
        : `${S.build}. Return the ${pn}, pour in the sauce and toss hard for 1–2 minutes until glossy, then pile it over the ${bn}.`,
    );
  } else if (fmt === 'Skillet') {
    s.push(
      `Heat a little oil in a skillet over medium-high and cook the ${pn} ${P.sear ?? ''}, ${P.done}. Lift it out to rest.`,
    );
    s.push(
      preApplied
        ? `In the same pan, splash in a little water or stock and scrape up the browned bits into a quick pan sauce.`
        : `In the same pan, ${lower(S.build)}; let it bubble for a minute, scraping up the tasty browned bits.`,
    );
    s.push(
      `Slide the ${pn} back in, spoon the sauce over and simmer 2–3 minutes, then serve with the ${bn} and greens.`,
    );
  } else {
    const note =
      fmt === 'Traybake' ? "This one's better off pan-cooked than oven-roasted, so: " : '';
    s.push(
      `${note}Cook the ${pn}: heat a little oil over medium-high and sear it ${P.sear ?? ''}, ${P.done}.`,
    );
    if (S.when === 'glaze')
      s.push(`${S.build}, then brush it over the ${pn} for the last minute so it caramelises.`);
    else if (S.when === 'end') s.push(`${S.build}.`);
    s.push(
      `Build the bowl: ${bn} on the bottom, greens alongside, the ${pn} on top, and ${
        S.when === 'end'
          ? 'the sauce spooned over'
          : S.when === 'glaze'
            ? 'any extra glaze spooned over'
            : 'a wedge of lemon to finish'
      }.`,
    );
  }
  s.push(
    `Taste and adjust the seasoning, add a squeeze of lemon or lime to wake it all up, and you're done — roughly ${r.kcal} kcal with ${r.p}g protein, ${r.c}g carbs and ${r.f}g fat.`,
  );
  s.push(
    `Meal-prep note: this scales cleanly — cook 2–3× the ${pn} and ${bn} at once, keep them in airtight tubs, and they'll hold 3 days in the fridge. Reheat gently and add the greens and sauce fresh so nothing goes soggy.`,
  );
  return { steps: s, tip: P.tip };
}
