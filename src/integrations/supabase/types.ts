export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip: string | null
          new_values: Json | null
          prev_values: Json | null
          reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip?: string | null
          new_values?: Json | null
          prev_values?: Json | null
          reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip?: string | null
          new_values?: Json | null
          prev_values?: Json | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          base_currency: Database["public"]["Enums"]["currency_code"]
          business_address: string | null
          business_email: string | null
          business_name: string | null
          business_phone: string | null
          created_at: string
          dashboard_layout: Json
          invoice_footer: string | null
          logo_url: string | null
          tax_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: Database["public"]["Enums"]["currency_code"]
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          dashboard_layout?: Json
          invoice_footer?: string | null
          logo_url?: string | null
          tax_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: Database["public"]["Enums"]["currency_code"]
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          dashboard_layout?: Json
          invoice_footer?: string | null
          logo_url?: string | null
          tax_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          company: string | null
          city: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          deleted_at: string | null
          deleted_by: string | null
          doc_type: string | null
          entity_id: string
          entity_type: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          deleted_by?: string | null
          doc_type?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          deleted_by?: string | null
          doc_type?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: Database["public"]["Enums"]["currency_code"]
          created_at: string
          effective_date: string
          id: string
          quote_currency: Database["public"]["Enums"]["currency_code"]
          rate: number
          user_id: string
        }
        Insert: {
          base_currency: Database["public"]["Enums"]["currency_code"]
          created_at?: string
          effective_date?: string
          id?: string
          quote_currency: Database["public"]["Enums"]["currency_code"]
          rate: number
          user_id: string
        }
        Update: {
          base_currency?: Database["public"]["Enums"]["currency_code"]
          created_at?: string
          effective_date?: string
          id?: string
          quote_currency?: Database["public"]["Enums"]["currency_code"]
          rate?: number
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          amount_base: number | null
          category: Database["public"]["Enums"]["expense_category"]
          client_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          exchange_rate: number | null
          expense_date: string
          id: string
          name: string
          notes: string | null
          rate_effective_date: string | null
          receipt_url: string | null
          updated_at: string
          user_id: string
          vendor: string | null
          workshop_id: string | null
        }
        Insert: {
          amount: number
          amount_base?: number | null
          category?: Database["public"]["Enums"]["expense_category"]
          client_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          exchange_rate?: number | null
          expense_date?: string
          id?: string
          name: string
          notes?: string | null
          rate_effective_date?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id: string
          vendor?: string | null
          workshop_id?: string | null
        }
        Update: {
          amount?: number
          amount_base?: number | null
          category?: Database["public"]["Enums"]["expense_category"]
          client_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          exchange_rate?: number | null
          expense_date?: string
          id?: string
          name?: string
          notes?: string | null
          rate_effective_date?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_financials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          amount_base: number | null
          client_id: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          deleted_at: string | null
          deleted_by: string | null
          due_date: string | null
          exchange_rate: number | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          rate_effective_date: string | null
          receipt_url: string | null
          received_date: string | null
          reference: string | null
          updated_at: string
          user_id: string
          workshop_id: string | null
        }
        Insert: {
          amount: number
          amount_base?: number | null
          client_id: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          deleted_at?: string | null
          deleted_by?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          rate_effective_date?: string | null
          receipt_url?: string | null
          received_date?: string | null
          reference?: string | null
          updated_at?: string
          user_id: string
          workshop_id?: string | null
        }
        Update: {
          amount?: number
          amount_base?: number | null
          client_id?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          deleted_at?: string | null
          deleted_by?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          rate_effective_date?: string | null
          receipt_url?: string | null
          received_date?: string | null
          reference?: string | null
          updated_at?: string
          user_id?: string
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_financials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          preferred_currency: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          preferred_currency?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          preferred_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports_snapshots: {
        Row: {
          base_currency: Database["public"]["Enums"]["currency_code"]
          expenses: number
          generated_at: string
          id: string
          pdf_path: string | null
          profit: number
          rates_used: Json | null
          report_month: string
          revenue: number
          user_id: string
        }
        Insert: {
          base_currency?: Database["public"]["Enums"]["currency_code"]
          expenses?: number
          generated_at?: string
          id?: string
          pdf_path?: string | null
          profit?: number
          rates_used?: Json | null
          report_month: string
          revenue?: number
          user_id: string
        }
        Update: {
          base_currency?: Database["public"]["Enums"]["currency_code"]
          expenses?: number
          generated_at?: string
          id?: string
          pdf_path?: string | null
          profit?: number
          rates_used?: Json | null
          report_month?: string
          revenue?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          columns: Json
          created_at: string
          filters: Json
          id: string
          name: string
          page: string
          pinned: boolean
          sort: Json
          user_id: string
        }
        Insert: {
          columns?: Json
          created_at?: string
          filters?: Json
          id?: string
          name: string
          page: string
          pinned?: boolean
          sort?: Json
          user_id: string
        }
        Update: {
          columns?: Json
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          page?: string
          pinned?: boolean
          sort?: Json
          user_id?: string
        }
        Relationships: []
      }
      workshop_tag_assignments: {
        Row: {
          tag_id: string
          user_id: string
          workshop_id: string
        }
        Insert: {
          tag_id: string
          user_id: string
          workshop_id: string
        }
        Update: {
          tag_id?: string
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "workshop_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_tag_assignments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_financials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_tag_assignments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      workshops: {
        Row: {
          assigned_date: string | null
          category: string | null
          category_path_snapshot: string | null
          client_id: string
          completion_pct: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          custom_measurement: string | null
          deadline: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          discount: number
          end_date: string | null
          estimated_hours: number | null
          final_amount: number | null
          id: string
          internal_notes: string | null
          name: string
          options_snapshot: Json
          price: number
          priority: Database["public"]["Enums"]["priority_level"]
          product_ref_id: string | null
          start_date: string | null
          tax: number
          updated_at: string
          user_id: string
          workflow_status: Database["public"]["Enums"]["workflow_status"]
        }
        Insert: {
          assigned_date?: string | null
          category?: string | null
          category_path_snapshot?: string | null
          client_id: string
          completion_pct?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          custom_measurement?: string | null
          deadline?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          discount?: number
          end_date?: string | null
          estimated_hours?: number | null
          final_amount?: number | null
          id?: string
          internal_notes?: string | null
          name: string
          options_snapshot?: Json
          price?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          product_ref_id?: string | null
          start_date?: string | null
          tax?: number
          updated_at?: string
          user_id: string
          workflow_status?: Database["public"]["Enums"]["workflow_status"]
        }
        Update: {
          assigned_date?: string | null
          category?: string | null
          category_path_snapshot?: string | null
          client_id?: string
          completion_pct?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          custom_measurement?: string | null
          deadline?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          discount?: number
          end_date?: string | null
          estimated_hours?: number | null
          final_amount?: number | null
          id?: string
          internal_notes?: string | null
          name?: string
          options_snapshot?: Json
          price?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          product_ref_id?: string | null
          start_date?: string | null
          tax?: number
          updated_at?: string
          user_id?: string
          workflow_status?: Database["public"]["Enums"]["workflow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "workshops_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      workshop_financials: {
        Row: {
          assigned_date: string | null
          category: string | null
          client_id: string | null
          client_name: string | null
          completion_pct: number | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          deadline: string | null
          description: string | null
          discount: number | null
          end_date: string | null
          estimated_hours: number | null
          final_amount: number | null
          final_amount_base: number | null
          financial_status: string | null
          id: string | null
          internal_notes: string | null
          last_payment_date: string | null
          name: string | null
          paid_base: number | null
          price: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          remaining_base: number | null
          start_date: string | null
          tax: number | null
          updated_at: string | null
          user_id: string | null
          workflow_status: Database["public"]["Enums"]["workflow_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "workshops_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      dashboard_kpis: { Args: never; Returns: Json }
      rate_at: {
        Args: {
          p_as_of: string
          p_from: Database["public"]["Enums"]["currency_code"]
          p_to: Database["public"]["Enums"]["currency_code"]
          p_user: string
        }
        Returns: number
      }
      to_base: {
        Args: {
          p_amount: number
          p_as_of: string
          p_from: Database["public"]["Enums"]["currency_code"]
          p_user: string
        }
        Returns: number
      }
    }
    Enums: {
      currency_code: "USD" | "LBP" | "LYD"
      expense_category:
        | "software"
        | "hardware"
        | "travel"
        | "marketing"
        | "rent"
        | "utilities"
        | "supplies"
        | "freelancer"
        | "other"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "credit_card"
        | "western_union"
        | "paypal"
        | "other"
      priority_level: "low" | "medium" | "high" | "urgent"
      workflow_status:
        | "planning"
        | "in_progress"
        | "waiting"
        | "completed"
        | "cancelled"
        | "archived"
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

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      currency_code: ["USD", "LBP", "LYD"],
      expense_category: [
        "software",
        "hardware",
        "travel",
        "marketing",
        "rent",
        "utilities",
        "supplies",
        "freelancer",
        "other",
      ],
      payment_method: [
        "cash",
        "bank_transfer",
        "credit_card",
        "western_union",
        "paypal",
        "other",
      ],
      priority_level: ["low", "medium", "high", "urgent"],
      workflow_status: [
        "planning",
        "in_progress",
        "waiting",
        "completed",
        "cancelled",
        "archived",
      ],
    },
  },
} as const
