export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          plan: string
          is_admin: boolean
          country: string
          created_at: string
          last_seen: string | null
          stripe_customer_id: string | null
          avatar_url: string | null
          age: number | null
          weight: number | null
          height: number | null
          gender: string | null
          fitness_goal: string | null
          profile_setup_completed: boolean
          ads_enabled: boolean
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          plan?: string
          is_admin?: boolean
          country?: string
          created_at?: string
          last_seen?: string | null
          stripe_customer_id?: string | null
          avatar_url?: string | null
          age?: number | null
          weight?: number | null
          height?: number | null
          gender?: string | null
          fitness_goal?: string | null
          profile_setup_completed?: boolean
          ads_enabled?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          plan?: string
          is_admin?: boolean
          country?: string
          created_at?: string
          last_seen?: string | null
          stripe_customer_id?: string | null
          avatar_url?: string | null
          age?: number | null
          weight?: number | null
          height?: number | null
          gender?: string | null
          fitness_goal?: string | null
          profile_setup_completed?: boolean
          ads_enabled?: boolean
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string | null
          plan: string
          status: string
          current_period_start: string
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          amount_brl?: number
          amount_usd?: number
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          plan?: string
          status?: string
          current_period_start?: string
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          amount_brl?: number
          amount_usd?: number
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string | null
          plan?: string
          status?: string
          current_period_start?: string
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          amount_brl?: number
          amount_usd?: number
        }
      }
      events: {
        Row: {
          id: string
          user_id: string | null
          user_email?: string | null
          type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          type: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          type?: string
          metadata?: Json
          created_at?: string
        }
      }
      ai_usage: {
        Row: {
          id: string
          user_id: string
          messages_count: number
          tokens_used: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages_count?: number
          tokens_used?: number
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          messages_count?: number
          tokens_used?: number
          date?: string
          created_at?: string
        }
      }
      ai_messages: {
        Row: {
          id: string
          user_id: string
          user_message: string
          ai_response: string
          edited_response: string | null
          category: string | null
          subcategory: string | null
          user_rating: number | null
          user_thumbs_up: boolean | null
          user_flagged: boolean
          flag_reason: string | null
          training_status: string
          user_message_lang: string
          created_at: string
          tokens_used: number | null
          user_context: Json
        }
        Insert: {
          id?: string
          user_id: string
          user_message: string
          ai_response: string
          edited_response?: string | null
          category?: string | null
          subcategory?: string | null
          user_rating?: number | null
          user_thumbs_up?: boolean | null
          user_flagged?: boolean
          flag_reason?: string | null
          training_status?: string
          user_message_lang?: string
          created_at?: string
          tokens_used?: number | null
          user_context?: Json
        }
        Update: {
          id?: string
          user_id?: string
          user_message?: string
          ai_response?: string
          edited_response?: string | null
          category?: string | null
          subcategory?: string | null
          user_rating?: number | null
          user_thumbs_up?: boolean | null
          user_flagged?: boolean
          flag_reason?: string | null
          training_status?: string
          user_message_lang?: string
          created_at?: string
          tokens_used?: number | null
          user_context?: Json
        }
      }
      scans: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      metabolic_plans: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      online_users: {
        Row: {
          user_id: string
          online_at: string
          device_info: Json
        }
        Insert: {
          user_id: string
          online_at?: string
          device_info?: Json
        }
        Update: {
          user_id?: string
          online_at?: string
          device_info?: Json
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      dataset_exports: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      dataset_stats: {
        Row: {
          id: string
          total_messages: number
          approved: number
          edited: number
          rejected: number
          created_at: string
        }
        Insert: {
          id?: string
          total_messages?: number
          approved?: number
          edited?: number
          rejected?: number
          created_at?: string
        }
        Update: {
          id?: string
          total_messages?: number
          approved?: number
          edited?: number
          rejected?: number
          created_at?: string
        }
      }
    }
    Views: {
      top_users_view: {
        Row: {
          [key: string]: Json | undefined
        }
      }
      admin_overview: {
        Row: {
          [key: string]: Json | undefined
        }
      }
      active_users: {
        Row: {
          [key: string]: Json | undefined
        }
      }
      recent_events: {
        Row: {
          [key: string]: Json | undefined
        }
      }
    }
    Functions: {
      log_event: {
        Args: { p_type: string; p_user_id?: string; p_metadata?: Json }
        Returns: void
      }
    }
  }
}
