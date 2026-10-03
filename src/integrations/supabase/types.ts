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
      app_settings: {
        Row: {
          id: number
          require_pin_above_threshold: boolean
          sca_threshold: number
          updated_at: string
        }
        Insert: {
          id?: number
          require_pin_above_threshold?: boolean
          sca_threshold?: number
          updated_at?: string
        }
        Update: {
          id?: number
          require_pin_above_threshold?: boolean
          sca_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      biometric_audit: {
        Row: {
          created_at: string
          id: string
          method: string
          outcome: string
          reason: string | null
          step: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          method: string
          outcome: string
          reason?: string | null
          step: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          outcome?: string
          reason?: string | null
          step?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_cards: {
        Row: {
          barcode_type: string
          barcode_value: string
          brand: string
          card_number: string
          card_type: string
          color: string | null
          created_at: string
          encrypted_extra: string | null
          expires_at: string | null
          id: string
          iv: string | null
          logo_url: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode_type?: string
          barcode_value: string
          brand: string
          card_number: string
          card_type?: string
          color?: string | null
          created_at?: string
          encrypted_extra?: string | null
          expires_at?: string | null
          id?: string
          iv?: string | null
          logo_url?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode_type?: string
          barcode_value?: string
          brand?: string
          card_number?: string
          card_type?: string
          color?: string | null
          created_at?: string
          encrypted_extra?: string | null
          expires_at?: string | null
          id?: string
          iv?: string | null
          logo_url?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_cards: {
        Row: {
          brand: string
          created_at: string
          encrypted_pan: string
          exp_month: number
          exp_year: number
          holder: string
          id: string
          iv: string
          last4: string
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          encrypted_pan: string
          exp_month: number
          exp_year: number
          holder: string
          id?: string
          iv: string
          last4: string
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          encrypted_pan?: string
          exp_month?: number
          exp_year?: number
          holder?: string
          id?: string
          iv?: string
          last4?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          authorized_at: string | null
          created_at: string
          currency: string
          expires_at: string
          id: string
          merchant_name: string
          merchant_ref: string | null
          status: string
          token: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          amount: number
          authorized_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          merchant_name: string
          merchant_ref?: string | null
          status?: string
          token?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          authorized_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          merchant_name?: string
          merchant_ref?: string | null
          status?: string
          token?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          pin_hash: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          pin_hash?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          pin_hash?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          card_id: string | null
          created_at: string
          currency: string
          id: string
          merchant: string | null
          status: string
          token: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant?: string | null
          status?: string
          token: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant?: string | null
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "payment_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string
          credential_id: string | null
          id: string
          label: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          id?: string
          label: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          id?: string
          label?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          aaguid: string | null
          attestation_fmt: string | null
          backed_up: boolean | null
          counter: number
          created_at: string
          credential_id: string
          device_type: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          aaguid?: string | null
          attestation_fmt?: string | null
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id: string
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          aaguid?: string | null
          attestation_fmt?: string | null
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id?: string
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
