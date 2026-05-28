export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          certifications: string[] | null
          city: string | null
          commission_pct: number | null
          country: string | null
          created_at: string | null
          cuisine_type: string | null
          currency: string
          delivery_zones: Json | null
          description: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          lead_time_hours: number | null
          logo_url: string | null
          min_order_value: number | null
          name: string
          operating_hours: Json | null
          phone: string | null
          postal_code: string | null
          slug: string
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          certifications?: string[] | null
          city?: string | null
          commission_pct?: number | null
          country?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          currency?: string
          delivery_zones?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          lead_time_hours?: number | null
          logo_url?: string | null
          min_order_value?: number | null
          name: string
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          slug: string
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          certifications?: string[] | null
          city?: string | null
          commission_pct?: number | null
          country?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          currency?: string
          delivery_zones?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          lead_time_hours?: number | null
          logo_url?: string | null
          min_order_value?: number | null
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          slug?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_slot_exceptions: {
        Row: {
          exception_date: string
          id: string
          is_cancelled: boolean | null
          reason: string | null
          slot_id: string
        }
        Insert: {
          exception_date: string
          id?: string
          is_cancelled?: boolean | null
          reason?: string | null
          slot_id: string
        }
        Update: {
          exception_date?: string
          id?: string
          is_cancelled?: boolean | null
          reason?: string | null
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_slot_exceptions_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_slots: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          max_orders: number | null
          start_time: string
          supplier_id: string
          zone_name: string | null
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          max_orders?: number | null
          start_time: string
          supplier_id: string
          zone_name?: string | null
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_orders?: number | null
          start_time?: string
          supplier_id?: string
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_slots_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string | null
          discount_pct: number
          end_date: string
          id: string
          is_active: boolean | null
          product_id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          discount_pct: number
          end_date: string
          id?: string
          is_active?: boolean | null
          product_id: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          discount_pct?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          product_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          commission_amt: number
          commission_pct: number
          confirmed_at: string | null
          currency: string
          delivered_at: string | null
          delivery_date: string
          delivery_slot_id: string | null
          id: string
          is_auto_placed: boolean
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_note: string | null
          payment_status: string | null
          placed_at: string | null
          recurring_order_id: string | null
          restaurant_id: string
          status: string | null
          subtotal: number
          supplier_id: string
          tax: number | null
          total: number
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          commission_amt: number
          commission_pct: number
          confirmed_at?: string | null
          currency: string
          delivered_at?: string | null
          delivery_date: string
          delivery_slot_id?: string | null
          id?: string
          is_auto_placed?: boolean
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_note?: string | null
          payment_status?: string | null
          placed_at?: string | null
          recurring_order_id?: string | null
          restaurant_id: string
          status?: string | null
          subtotal: number
          supplier_id: string
          tax?: number | null
          total: number
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          commission_amt?: number
          commission_pct?: number
          confirmed_at?: string | null
          currency?: string
          delivered_at?: string | null
          delivery_date?: string
          delivery_slot_id?: string | null
          id?: string
          is_auto_placed?: boolean
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_note?: string | null
          payment_status?: string | null
          placed_at?: string | null
          recurring_order_id?: string | null
          restaurant_id?: string
          status?: string | null
          subtotal?: number
          supplier_id?: string
          tax?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_slot_id_fkey"
            columns: ["delivery_slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          is_available: boolean | null
          min_order_qty: number | null
          name: string
          price: number
          supplier_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_available?: boolean | null
          min_order_qty?: number | null
          name: string
          price: number
          supplier_id: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_available?: boolean | null
          min_order_qty?: number | null
          name?: string
          price?: number
          supplier_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_order_items: {
        Row: {
          id: string
          product_id: string
          product_name: string
          quantity: number
          recurring_order_id: string
          unit: string
          unit_price: number
        }
        Insert: {
          id?: string
          product_id: string
          product_name: string
          quantity: number
          recurring_order_id: string
          unit: string
          unit_price: number
        }
        Update: {
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          recurring_order_id?: string
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_order_items_recurring_order_id_fkey"
            columns: ["recurring_order_id"]
            isOneToOne: false
            referencedRelation: "recurring_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_order_runs: {
        Row: {
          error_message: string | null
          id: string
          order_id: string | null
          recurring_order_id: string
          run_at: string | null
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          order_id?: string | null
          recurring_order_id: string
          run_at?: string | null
          status: string
        }
        Update: {
          error_message?: string | null
          id?: string
          order_id?: string | null
          recurring_order_id?: string
          run_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_order_runs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_order_runs_recurring_order_id_fkey"
            columns: ["recurring_order_id"]
            isOneToOne: false
            referencedRelation: "recurring_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_orders: {
        Row: {
          created_at: string | null
          delivery_offset_days: number
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          notes: string | null
          restaurant_id: string
          schedule_days: Json
          start_date: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_offset_days?: number
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          notes?: string | null
          restaurant_id: string
          schedule_days?: Json
          start_date?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_offset_days?: number
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          notes?: string | null
          restaurant_id?: string
          schedule_days?: Json
          start_date?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_onboarding: {
        Args: {
          p_address?: string
          p_city?: string
          p_company_name: string
          p_company_type: string
          p_country?: string
          p_cuisine_type?: string
          p_currency?: string
          p_email?: string
          p_phone?: string
          p_postal_code?: string
          p_slug: string
        }
        Returns: Json
      }
      compute_next_run_date: {
        Args: { p_recurring_order_id: string }
        Returns: string
      }
      execute_recurring_orders: { Args: never; Returns: Json }
      get_my_company_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

// App-level type aliases
export type CompanyType = "supplier" | "restaurant";
export type ProductUnit = "kg" | "piece" | "liter" | "box" | "bunch" | "pack";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "dispatched" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "partially_paid";
