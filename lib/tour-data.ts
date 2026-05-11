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

export const groupGul = {
  name: "Gul",
  startAddress: "Bromsvägen 46, 125 57 Älvsjö, Sweden",
  startCoordinates: {
    lat: 59.2756006,
    lng: 17.9811132,
  },
  restaurants: [
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
  ] as const,
};

export const restaurantsBySlug: Record<string, Restaurant> =
  groupGul.restaurants.reduce<Record<string, Restaurant>>((acc, restaurant) => {
    acc[restaurant.slug] = restaurant;
    return acc;
  }, {});
