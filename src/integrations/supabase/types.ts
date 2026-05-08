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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          comment: string | null
          created_at: string
          decision: Database["public"]["Enums"]["approval_decision"]
          entity_id: string
          entity_type: string
          id: string
          project_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          decision: Database["public"]["Enums"]["approval_decision"]
          entity_id: string
          entity_type: string
          id?: string
          project_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["approval_decision"]
          entity_id?: string
          entity_type?: string
          id?: string
          project_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          country: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          author_id: string
          created_at: string
          id: string
          next_activities: string[] | null
          notes: string | null
          project_id: string
          report_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          submitted_at: string | null
          tasks_completed: string[] | null
          updated_at: string
          weather: string | null
          workforce_count: number | null
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          next_activities?: string[] | null
          notes?: string | null
          project_id: string
          report_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          tasks_completed?: string[] | null
          updated_at?: string
          weather?: string | null
          workforce_count?: number | null
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          next_activities?: string[] | null
          notes?: string | null
          project_id?: string
          report_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          tasks_completed?: string[] | null
          updated_at?: string
          weather?: string | null
          workforce_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          caption: string | null
          created_at: string
          exif: Json | null
          id: string
          is_published: boolean
          milestone_id: string | null
          mime_type: string | null
          project_id: string
          report_id: string | null
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          exif?: Json | null
          id?: string
          is_published?: boolean
          milestone_id?: string | null
          mime_type?: string | null
          project_id: string
          report_id?: string | null
          storage_path: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          exif?: Json | null
          id?: string
          is_published?: boolean
          milestone_id?: string | null
          mime_type?: string | null
          project_id?: string
          report_id?: string | null
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          actual_date: string | null
          created_at: string
          id: string
          is_published: boolean
          ordering: number
          planned_date: string | null
          progress: number
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          ordering?: number
          planned_date?: string | null
          progress?: number
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          ordering?: number
          planned_date?: string | null
          progress?: number
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_initials: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_initials?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: Database["public"]["Enums"]["project_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_name: string | null
          code: string
          company_id: string | null
          completion: number
          created_at: string
          created_by: string
          current_phase: string | null
          id: string
          location: string | null
          planned_end_date: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          code: string
          company_id?: string | null
          completion?: number
          created_at?: string
          created_by: string
          current_phase?: string | null
          id?: string
          location?: string | null
          planned_end_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          code?: string
          company_id?: string | null
          completion?: number
          created_at?: string
          created_by?: string
          current_phase?: string | null
          id?: string
          location?: string | null
          planned_end_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      report_issues: {
        Row: {
          created_at: string
          created_by: string
          date_identified: string
          description: string | null
          id: string
          impact: string | null
          is_published: boolean
          project_id: string
          report_id: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date_identified?: string
          description?: string | null
          id?: string
          impact?: string | null
          is_published?: boolean
          project_id: string
          report_id?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date_identified?: string
          description?: string | null
          id?: string
          impact?: string | null
          is_published?: boolean
          project_id?: string
          report_id?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_issues_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      project_member_role: {
        Args: { _project_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["project_member_role"]
      }
    }
    Enums: {
      app_role: "super-admin" | "company-admin" | "engineer" | "client"
      approval_decision: "approved" | "rejected" | "revision-requested"
      issue_severity: "low" | "medium" | "high" | "critical"
      issue_status: "open" | "in-progress" | "resolved" | "closed"
      milestone_status: "pending" | "in-progress" | "completed" | "delayed"
      project_member_role: "manager" | "engineer" | "client" | "viewer"
      project_status:
        | "active"
        | "on-hold"
        | "completed"
        | "delayed"
        | "planning"
      report_status:
        | "draft"
        | "submitted"
        | "under-review"
        | "approved"
        | "rejected"
        | "published"
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
      app_role: ["super-admin", "company-admin", "engineer", "client"],
      approval_decision: ["approved", "rejected", "revision-requested"],
      issue_severity: ["low", "medium", "high", "critical"],
      issue_status: ["open", "in-progress", "resolved", "closed"],
      milestone_status: ["pending", "in-progress", "completed", "delayed"],
      project_member_role: ["manager", "engineer", "client", "viewer"],
      project_status: ["active", "on-hold", "completed", "delayed", "planning"],
      report_status: [
        "draft",
        "submitted",
        "under-review",
        "approved",
        "rejected",
        "published",
      ],
    },
  },
} as const
