export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      scan_history: {
        Row: {
          id: string
          session_id: string
          card_name: string
          set_name: string
          card_number: string
          rarity: string | null
          language: string | null
          tcg_price_usd: number | null
          cardmarket_url: string | null
          scanned_at: string
        }
        Insert: {
          id?: string
          session_id: string
          card_name: string
          set_name: string
          card_number: string
          rarity?: string | null
          language?: string | null
          tcg_price_usd?: number | null
          cardmarket_url?: string | null
          scanned_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          card_name?: string
          set_name?: string
          card_number?: string
          rarity?: string | null
          language?: string | null
          tcg_price_usd?: number | null
          cardmarket_url?: string | null
          scanned_at?: string
        }
      }
      collection: {
        Row: {
          id: string
          session_id: string
          tcgdex_set: string
          local_id: string
          card_name: string
          set_name: string
          number: string | null
          variant: string
          quantity: number
          image_url: string | null
          added_at: string
        }
        Insert: {
          id?: string
          session_id: string
          tcgdex_set: string
          local_id: string
          card_name: string
          set_name: string
          number?: string | null
          variant?: string
          quantity?: number
          image_url?: string | null
          added_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          tcgdex_set?: string
          local_id?: string
          card_name?: string
          set_name?: string
          number?: string | null
          variant?: string
          quantity?: number
          image_url?: string | null
          added_at?: string
        }
      }
      price_snapshots: {
        Row: {
          id: number
          tcgdex_set: string
          local_id: string
          snapshot_date: string
          price_min: number | null
          price_trend: number | null
        }
        Insert: {
          id?: number
          tcgdex_set: string
          local_id: string
          snapshot_date?: string
          price_min?: number | null
          price_trend?: number | null
        }
        Update: {
          id?: number
          tcgdex_set?: string
          local_id?: string
          snapshot_date?: string
          price_min?: number | null
          price_trend?: number | null
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
