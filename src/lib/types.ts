
export interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  github?: string;
  email?: string;
  linkedin?: string;
}

export interface PokeCard {
  id: string;
  name: string;
  imageUrl: string;
  set?: string;
  rarity?: string;
  price?: number;
}

export interface Point {
  x: number;
  y: number;
}
