export type Restaurant = {
  slug: string;
  name: string;
  address: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export type GroupSlug =
  | "gul"
  | "rosa"
  | "rod"
  | "gron"
  | "silver"
  | "bla"
  | "vit";

export type GroupDefinition = {
  slug: GroupSlug;
  name: string;
};

export type GroupVisitPlanRow = {
  groupSlug: GroupSlug;
  groupName: string;
  restaurantName: string;
  visitTime: string;
};

export type GroupRestaurantRef = {
  slug: string;
  visitTime: string;
};

export type GroupRoute = {
  name: string;
  startAddress: string;
  startCoordinates: {
    lat: number;
    lng: number;
  };
  endDestination: RouteLocation;
  restaurants: readonly GroupRestaurantRef[];
};

export type GroupTheme = {
  headerBadgeClassName: string;
  timeBadgeClassName: string;
};

export type RouteLocation = {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  slug?: string;
};

export const allRestaurants: readonly Restaurant[] = [
  {
    slug: "casa-del-planka",
    name: "La Casa de Planka",
    address: "Klockhusgränd 1A, 125 49 Älvsjö, Sweden",
    description:
      "En avslappnad stoppplats med fokus på rejäl mat i hjärtat av Älvsjö.",
    coordinates: {
      lat: 59.2810323,
      lng: 18.0004265,
    },
  },
  {
    slug: "erssons",
    name: "Erssons",
    address: "Fruängstorget 6, 129 52 Hägersten, Sweden",
    description:
      "Ett klassiskt stopp med fisk och delikatesser, perfekt på turen vidare.",
    coordinates: {
      lat: 59.2868,
      lng: 17.9642,
    },
  },
  {
    slug: "teso",
    name: "TESO Sushi & Ramen",
    address: "Kabelverksgatan 16, 125 48 Älvsjö, Sweden",
    description:
      "Sista stoppet på den gula cykelslingan med nära tillbaka till startområdet.",
    coordinates: {
      lat: 59.2823119,
      lng: 18.0028268,
    },
  },
  {
    slug: "var-pizza",
    name: "Vår Pizza",
    address: "Johan Skyttes Väg 218, 125 34 Älvsjö",
    description:
      "En pizzeria med fokus på kvalitet och hantverksmässig framställning.",
    coordinates: {
      lat: 59.2777344,
      lng: 18.0017943,
    },
  },
  {
    slug: "kottverket",
    name: "Köttverket",
    address: "Johan Skyttes Väg 203, 125 34 Älvsjö",
    description:
      "En specialiserad köttbutik och restaurang med fokus på lokala och högkvalitativa produkter.",
    coordinates: {
      lat: 59.2777346,
      lng: 18.005564,
    },
  },
  {
    slug: "rinos",
    name: "Sushi by Rino",
    address: "Svartlösavägen 52, 125 33 Älvsjö",
    description: "Japansk mat med fokus på färsk sushi och ramen.",
    coordinates: {
      lat: 59.2842178,
      lng: 17.9855931,
    },
  },
  {
    slug: "beirut",
    name: "Beirut Lounge",
    address: "Fruängstorget 6, 129 52 Hägersten",
    description: "Levantinsk restaurang med autentisk mat från Mellanöstern.",
    coordinates: {
      lat: 59.2857255,
      lng: 17.9641781,
    },
  },
  {
    slug: "herrangens-gard",
    name: "Herrängens Gård",
    address: "Herrängens Gård, 125 54 Älvsjö, Sweden",
    description:
      "Cykelturens mål och samlingsplats vid en klassisk herrgård.",
    coordinates: {
      lat: 59.2733581,
      lng: 17.9607217,
    },
  },
] as const;

export const sharedStartLocation: RouteLocation = {
  name: "Start",
  address: "Bromsvägen 46, 125 57 Älvsjö, Sweden",
  coordinates: {
    lat: 59.2756006,
    lng: 17.9811132,
  },
};

export const sharedEndDestination: RouteLocation = {
  name: "Herrängens Gård",
  address: "Herrängens Gård, 125 54 Älvsjö, Sweden",
  coordinates: {
    lat: 59.2733581,
    lng: 17.9607217,
  },
  slug: "herrangens-gard",
};

const sharedRouteDefaults = {
  startAddress: sharedStartLocation.address,
  startCoordinates: sharedStartLocation.coordinates,
  endDestination: sharedEndDestination,
} as const;

export const groupGul = {
  name: "Gul",
  ...sharedRouteDefaults,
  restaurants: [
    { slug: "var-pizza", visitTime: "16:00" },
    { slug: "beirut", visitTime: "16:45" },
    { slug: "kottverket", visitTime: "17:30" },
  ] as const,
} as const;

export const groupRod = {
  name: "Röd",
  ...sharedRouteDefaults,
  restaurants: [
    { slug: "rinos", visitTime: "16:00" },
    { slug: "kottverket", visitTime: "16:45" },
    { slug: "erssons", visitTime: "17:30" },
  ] as const,
} as const;

export const groupGron = {
  name: "Grön",
  ...sharedRouteDefaults,
  restaurants: [
    { slug: "teso", visitTime: "16:00" },
    { slug: "var-pizza", visitTime: "16:45" },
    { slug: "beirut", visitTime: "17:30" },
  ] as const,
} as const;

export const groupSilver = {
  name: "Silver",
  ...sharedRouteDefaults,
  restaurants: [
    { slug: "kottverket", visitTime: "16:00" },
    { slug: "rinos", visitTime: "16:45" },
    { slug: "var-pizza", visitTime: "17:30" },
  ] as const,
} as const;

export const groupBla = {
  name: "Blå",
  ...sharedRouteDefaults,
  restaurants: [
    { slug: "erssons", visitTime: "16:00" },
    { slug: "teso", visitTime: "16:45" },
    { slug: "casa-del-planka", visitTime: "17:30" },
  ] as const,
} as const;

export const groupRosa = {
  name: "Rosa",
  ...sharedRouteDefaults,
  restaurants: [
    { slug: "beirut", visitTime: "16:00" },
    { slug: "casa-del-planka", visitTime: "16:45" },
    { slug: "teso", visitTime: "17:30" },
  ] as const,
} as const;

export const groupVit = {
  name: "Vit",
  ...sharedRouteDefaults,
  restaurants: [
    { slug: "casa-del-planka", visitTime: "16:00" },
    { slug: "erssons", visitTime: "16:45" },
    { slug: "rinos", visitTime: "17:30" },
  ] as const,
} as const;

export const allGroupDefinitions: readonly GroupDefinition[] = [
  { slug: "gul", name: "Gul" },
  { slug: "rosa", name: "Rosa" },
  { slug: "rod", name: "Röd" },
  { slug: "gron", name: "Grön" },
  { slug: "silver", name: "Silver" },
  { slug: "bla", name: "Blå" },
  { slug: "vit", name: "Vit" },
] as const;

export const groupsBySlug: Record<GroupSlug, GroupRoute> = {
  gul: groupGul,
  rosa: groupRosa,
  rod: groupRod,
  gron: groupGron,
  silver: groupSilver,
  bla: groupBla,
  vit: groupVit,
};

export const groupThemeBySlug: Record<GroupSlug, GroupTheme> = {
  gul: {
    headerBadgeClassName: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
    timeBadgeClassName: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30",
  },
  rosa: {
    headerBadgeClassName: "bg-pink-100 text-pink-900 dark:bg-pink-900/30 dark:text-pink-300",
    timeBadgeClassName: "text-pink-700 bg-pink-50 dark:text-pink-300 dark:bg-pink-900/30",
  },
  rod: {
    headerBadgeClassName: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300",
    timeBadgeClassName: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30",
  },
  gron: {
    headerBadgeClassName: "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300",
    timeBadgeClassName: "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30",
  },
  silver: {
    headerBadgeClassName: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200",
    timeBadgeClassName: "text-zinc-700 bg-zinc-100 dark:text-zinc-200 dark:bg-zinc-800",
  },
  bla: {
    headerBadgeClassName: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300",
    timeBadgeClassName: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30",
  },
  vit: {
    headerBadgeClassName: "bg-zinc-50 text-zinc-900 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-600",
    timeBadgeClassName: "text-zinc-700 bg-zinc-50 border border-zinc-300 dark:text-zinc-200 dark:bg-zinc-800 dark:border-zinc-600",
  },
};

export function getGroupDefinitionBySlug(
  groupSlug: GroupSlug,
): GroupDefinition | undefined {
  return allGroupDefinitions.find((group) => group.slug === groupSlug);
}

export function getGroupRouteBySlug(
  groupSlug: GroupSlug,
): GroupRoute | undefined {
  return groupsBySlug[groupSlug];
}

export const restaurantsBySlug: Record<string, Restaurant> =
  allRestaurants.reduce<Record<string, Restaurant>>((acc, restaurant) => {
    acc[restaurant.slug] = restaurant;
    return acc;
  }, {});
