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

export type RouteLocation = {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export const allRestaurants: readonly Restaurant[] = [
  {
    slug: "casa-del-planka",
    name: "La Casa de Planka",
    address: "Klockhusgrand 1A, 125 49 Alvsjo, Sweden",
    description:
      "En avslappnad stoppplats med fokus pa rejal mat i hjartat av Alvsjo.",
    coordinates: {
      lat: 59.2810323,
      lng: 18.0004265,
    },
  },
  {
    slug: "erssons",
    name: "Erssons",
    address: "Fruangstorget 6, 129 52 Hagersten, Sweden",
    description:
      "Ett klassiskt stopp med fisk och delikatesser, perfekt pa turen vidare.",
    coordinates: {
      lat: 59.2868,
      lng: 17.9642,
    },
  },
  {
    slug: "teso",
    name: "TESO Sushi & Ramen",
    address: "Kabelverksgatan 16, 125 48 Alvsjo, Sweden",
    description:
      "Sista stoppet pa den gula cykelslingan med nara tillbaka till startomradet.",
    coordinates: {
      lat: 59.2823119,
      lng: 18.0028268,
    },
  },
  {
    slug: "var-pizza",
    name: "VÅR PIZZA",
    address: "Johan Skyttes Väg 218, 125 34 Älvsjö",
    description:
      "En pizzeria med fokus pa kvalitet och hantverksmässig framställning.",
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
      "En specialiserad köttbutik och restaurang med fokus pa lokala och högkvalitativa produkter.",
    coordinates: {
      lat: 59.2777346,
      lng: 18.005564,
    },
  },
  {
    slug: "rinos",
    name: "Sushi by Rino",
    address: "Svartlösavägen 52, 125 33 Älvsjö",
    description: "Japansk cuisine med fokus pa färsk sushi och ramen.",
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

export function getGroupDefinitionBySlug(
  groupSlug: GroupSlug,
): GroupDefinition | undefined {
  return allGroupDefinitions.find((group) => group.slug === groupSlug);
}

export const restaurantsBySlug: Record<string, Restaurant> =
  allRestaurants.reduce<Record<string, Restaurant>>((acc, restaurant) => {
    acc[restaurant.slug] = restaurant;
    return acc;
  }, {});
