import type { Favorite } from "@prisma/client";

export type FavoriteWithCollections = Favorite & {
  collections?: { id: string; name: string }[];
};
