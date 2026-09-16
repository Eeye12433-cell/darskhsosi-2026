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
      chat_messages: {
        Row: {
          attachments: string[] | null
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          role: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          feature_id: string
          id: string
          is_active: boolean
          subject: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_id: string
          id?: string
          is_active?: boolean
          subject?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_id?: string
          id?: string
          is_active?: boolean
          subject?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_sets: {
        Row: {
          cards: Json
          created_at: string
          id: string
          source_material_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cards?: Json
          created_at?: string
          id?: string
          source_material_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cards?: Json
          created_at?: string
          id?: string
          source_material_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_sets_source_material_id_fkey"
            columns: ["source_material_id"]
            isOneToOne: false
            referencedRelation: "uploaded_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_invite_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          student_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          student_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          student_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      parent_links: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_persona: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          education_level: string | null
          goals: string | null
          hobbies: string | null
          id: string
          interests: string[] | null
          knowledge_ratio: number | null
          learning_languages: string[] | null
          learning_style: string | null
          learning_styles: string[] | null
          name: string
          preferred_language: string | null
          speaking_style: string | null
          strengths: string | null
          study_target: string | null
          subject: string | null
          updated_at: string
          user_id: string
          weaknesses: string | null
        }
        Insert: {
          ai_persona?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          education_level?: string | null
          goals?: string | null
          hobbies?: string | null
          id?: string
          interests?: string[] | null
          knowledge_ratio?: number | null
          learning_languages?: string[] | null
          learning_style?: string | null
          learning_styles?: string[] | null
          name: string
          preferred_language?: string | null
          speaking_style?: string | null
          strengths?: string | null
          study_target?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
          weaknesses?: string | null
        }
        Update: {
          ai_persona?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          education_level?: string | null
          goals?: string | null
          hobbies?: string | null
          id?: string
          interests?: string[] | null
          knowledge_ratio?: number | null
          learning_languages?: string[] | null
          learning_style?: string | null
          learning_styles?: string[] | null
          name?: string
          preferred_language?: string | null
          speaking_style?: string | null
          strengths?: string | null
          study_target?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
          weaknesses?: string | null
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          correct_index: number
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_favorite: boolean
          options: Json
          question: string
          subject: string
          times_correct: number
          times_wrong: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_index?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_favorite?: boolean
          options?: Json
          question: string
          subject?: string
          times_correct?: number
          times_wrong?: number
          topic?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_favorite?: boolean
          options?: Json
          question?: string
          subject?: string
          times_correct?: number
          times_wrong?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          duration_weeks: number | null
          id: string
          plan_data: Json
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number | null
          id?: string
          plan_data: Json
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number | null
          id?: string
          plan_data?: Json
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          name_ar: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_ar?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          user_id?: string
        }
        Relationships: []
      }
      uploaded_materials: {
        Row: {
          content: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_credentials: {
        Row: {
          created_at: string
          custom_api_key: string | null
          custom_base_url: string | null
          custom_model: string | null
          gemini_api_key: string | null
          id: string
          openai_api_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_api_key?: string | null
          custom_base_url?: string | null
          custom_model?: string | null
          gemini_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_api_key?: string | null
          custom_base_url?: string | null
          custom_model?: string | null
          gemini_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      is_parent_of: {
        Args: { _parent_id: string; _student_id: string }
        Returns: boolean
      }
      redeem_parent_invite: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      app_role: "student" | "parent"
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
      app_role: ["student", "parent"],
    },
  },
} as const
