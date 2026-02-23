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
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
