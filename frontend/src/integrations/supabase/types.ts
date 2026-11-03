export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string;
          icon: string;
          id: string;
          name: string;
          sort_order: number;
          unlock_condition: Json;
        };
        Insert: {
          description: string;
          icon: string;
          id: string;
          name: string;
          sort_order?: number;
          unlock_condition: Json;
        };
        Update: {
          description?: string;
          icon?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          unlock_condition?: Json;
        };
        Relationships: [];
      };
      goal_habits: {
        Row: {
          created_at: string;
          goal_id: string;
          habit_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          goal_id: string;
          habit_id: string;
          id?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          goal_id?: string;
          habit_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goal_habits_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goal_habits_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          completed_at: string | null;
          created_at: string;
          current_progress: number;
          description: string | null;
          history: Json;
          id: string;
          start_date: string;
          status: string;
          target_date: string | null;
          target_value: number;
          title: string;
          unit: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          current_progress?: number;
          description?: string | null;
          history?: Json;
          id?: string;
          start_date?: string;
          status?: string;
          target_date?: string | null;
          target_value?: number;
          title: string;
          unit?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          current_progress?: number;
          description?: string | null;
          history?: Json;
          id?: string;
          start_date?: string;
          status?: string;
          target_date?: string | null;
          target_value?: number;
          title?: string;
          unit?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      habit_completions: {
        Row: {
          completion_status: string;
          created_at: string;
          habit_id: string;
          id: string;
          notes: string | null;
          occurrence_date: string;
          progress_value: number;
          time_spent: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completion_status?: string;
          created_at?: string;
          habit_id: string;
          id?: string;
          notes?: string | null;
          occurrence_date: string;
          progress_value?: number;
          time_spent?: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          completion_status?: string;
          created_at?: string;
          habit_id?: string;
          id?: string;
          notes?: string | null;
          occurrence_date?: string;
          progress_value?: number;
          time_spent?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
        ];
      };
      habits: {
        Row: {
          category: string;
          color: string;
          created_at: string;
          description: string | null;
          end_date: string | null;
          icon: string;
          id: string;
          name: string;
          priority: string;
          recovery_configuration: Json;
          schedule_configuration: Json;
          start_date: string;
          status: string;
          target_value: number;
          tracking_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: string;
          color?: string;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          icon?: string;
          id?: string;
          name: string;
          priority?: string;
          recovery_configuration?: Json;
          schedule_configuration?: Json;
          start_date?: string;
          status?: string;
          target_value?: number;
          tracking_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          category?: string;
          color?: string;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          icon?: string;
          id?: string;
          name?: string;
          priority?: string;
          recovery_configuration?: Json;
          schedule_configuration?: Json;
          start_date?: string;
          status?: string;
          target_value?: number;
          tracking_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          dedupe_key: string | null;
          id: string;
          message: string;
          notification_type: string;
          read_status: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          message: string;
          notification_type?: string;
          read_status?: boolean;
          title: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          message?: string;
          notification_type?: string;
          read_status?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      onboarding_preferences: {
        Row: {
          available_time: string | null;
          created_at: string;
          id: string;
          interests: string[];
          personal_goals: string[];
          reminder_preferences: Json;
          tracking_preference: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          available_time?: string | null;
          created_at?: string;
          id?: string;
          interests?: string[];
          personal_goals?: string[];
          reminder_preferences?: Json;
          tracking_preference?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          available_time?: string | null;
          created_at?: string;
          id?: string;
          interests?: string[];
          personal_goals?: string[];
          reminder_preferences?: Json;
          tracking_preference?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          date_format: string;
          full_name: string | null;
          id: string;
          interests: string[];
          notification_settings: Json;
          onboarding_completed: boolean;
          personal_goals: string[];
          timezone: string;
          updated_at: string;
          week_start: number;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          date_format?: string;
          full_name?: string | null;
          id: string;
          interests?: string[];
          notification_settings?: Json;
          onboarding_completed?: boolean;
          personal_goals?: string[];
          timezone?: string;
          updated_at?: string;
          week_start?: number;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          date_format?: string;
          full_name?: string | null;
          id?: string;
          interests?: string[];
          notification_settings?: Json;
          onboarding_completed?: boolean;
          personal_goals?: string[];
          timezone?: string;
          updated_at?: string;
          week_start?: number;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Update: {
          achievement_id?: string;
          id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
