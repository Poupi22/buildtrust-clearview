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
    PostgrestVersion: "14.17"
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
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          project_id: string | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      client_assistant_access: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          invited_by: string
          is_active: boolean
          phone: string | null
          professional_role: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          invited_by: string
          is_active?: boolean
          phone?: string | null
          professional_role?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          invited_by?: string
          is_active?: boolean
          phone?: string | null
          professional_role?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assistant_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      company_settings: {
        Row: {
          auto_publish_on_approval: boolean
          company_id: string
          created_at: string
          default_milestone_template: string | null
          default_report_template: string | null
          require_dual_approval: boolean
          updated_at: string
        }
        Insert: {
          auto_publish_on_approval?: boolean
          company_id: string
          created_at?: string
          default_milestone_template?: string | null
          default_report_template?: string | null
          require_dual_approval?: boolean
          updated_at?: string
        }
        Update: {
          auto_publish_on_approval?: boolean
          company_id?: string
          created_at?: string
          default_milestone_template?: string | null
          default_report_template?: string | null
          require_dual_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_events: {
        Row: {
          admin_note: string | null
          created_at: string
          detail: string | null
          event_date: string
          event_type: string
          id: string
          obligation_id: string | null
          project_id: string
          responsible_id: string | null
          weekly_work_plan_id: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          detail?: string | null
          event_date: string
          event_type: string
          id?: string
          obligation_id?: string | null
          project_id: string
          responsible_id?: string | null
          weekly_work_plan_id?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          detail?: string | null
          event_date?: string
          event_type?: string
          id?: string
          obligation_id?: string | null
          project_id?: string
          responsible_id?: string | null
          weekly_work_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_events_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "report_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_events_weekly_work_plan_id_fkey"
            columns: ["weekly_work_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_work_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          achievements: string | null
          approver_signature_snapshot: Json | null
          author_id: string
          challenges: string | null
          corrective_actions: string | null
          created_at: string
          delays: string | null
          equipment: Json
          id: string
          is_late: boolean
          is_published: boolean
          materials: Json
          next_activities: string[] | null
          next_plan: string | null
          notes: string | null
          obligation_id: string | null
          owner_instructions: string | null
          personnel: Json
          plan_version_id: string | null
          project_id: string
          published_at: string | null
          published_by: string | null
          report_date: string
          report_ref: string | null
          report_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          revision: number
          safety_observations: string | null
          signature_snapshot: Json | null
          state: Database["public"]["Enums"]["report_state"]
          status: Database["public"]["Enums"]["report_status"]
          submitted_at: string | null
          submitted_at_server: string | null
          summary: string | null
          supersedes_id: string | null
          supervision_instructions: string | null
          tasks_completed: string[] | null
          technical_observations: string | null
          title: string | null
          updated_at: string
          weather: string | null
          week_end: string | null
          week_start: string | null
          weekly_work_plan_id: string | null
          work_area: string | null
          work_end_time: string | null
          work_start_time: string | null
          workforce_count: number | null
          works_done: Json
        }
        Insert: {
          achievements?: string | null
          approver_signature_snapshot?: Json | null
          author_id: string
          challenges?: string | null
          corrective_actions?: string | null
          created_at?: string
          delays?: string | null
          equipment?: Json
          id?: string
          is_late?: boolean
          is_published?: boolean
          materials?: Json
          next_activities?: string[] | null
          next_plan?: string | null
          notes?: string | null
          obligation_id?: string | null
          owner_instructions?: string | null
          personnel?: Json
          plan_version_id?: string | null
          project_id: string
          published_at?: string | null
          published_by?: string | null
          report_date: string
          report_ref?: string | null
          report_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision?: number
          safety_observations?: string | null
          signature_snapshot?: Json | null
          state?: Database["public"]["Enums"]["report_state"]
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          submitted_at_server?: string | null
          summary?: string | null
          supersedes_id?: string | null
          supervision_instructions?: string | null
          tasks_completed?: string[] | null
          technical_observations?: string | null
          title?: string | null
          updated_at?: string
          weather?: string | null
          week_end?: string | null
          week_start?: string | null
          weekly_work_plan_id?: string | null
          work_area?: string | null
          work_end_time?: string | null
          work_start_time?: string | null
          workforce_count?: number | null
          works_done?: Json
        }
        Update: {
          achievements?: string | null
          approver_signature_snapshot?: Json | null
          author_id?: string
          challenges?: string | null
          corrective_actions?: string | null
          created_at?: string
          delays?: string | null
          equipment?: Json
          id?: string
          is_late?: boolean
          is_published?: boolean
          materials?: Json
          next_activities?: string[] | null
          next_plan?: string | null
          notes?: string | null
          obligation_id?: string | null
          owner_instructions?: string | null
          personnel?: Json
          plan_version_id?: string | null
          project_id?: string
          published_at?: string | null
          published_by?: string | null
          report_date?: string
          report_ref?: string | null
          report_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision?: number
          safety_observations?: string | null
          signature_snapshot?: Json | null
          state?: Database["public"]["Enums"]["report_state"]
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          submitted_at_server?: string | null
          summary?: string | null
          supersedes_id?: string | null
          supervision_instructions?: string | null
          tasks_completed?: string[] | null
          technical_observations?: string | null
          title?: string | null
          updated_at?: string
          weather?: string | null
          week_end?: string | null
          week_start?: string | null
          weekly_work_plan_id?: string | null
          work_area?: string | null
          work_end_time?: string | null
          work_start_time?: string | null
          workforce_count?: number | null
          works_done?: Json
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "report_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "project_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_weekly_work_plan_id_fkey"
            columns: ["weekly_work_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_work_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          mime_type: string | null
          note: string | null
          project_id: string
          storage_path: string
          uploaded_by: string
          version: number
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          mime_type?: string | null
          note?: string | null
          project_id: string
          storage_path: string
          uploaded_by: string
          version: number
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          mime_type?: string | null
          note?: string | null
          project_id?: string
          storage_path?: string
          uploaded_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "project_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_project_id_fkey"
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
          progress_report_id: string | null
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
          progress_report_id?: string | null
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
          progress_report_id?: string | null
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
          actual_end: string | null
          actual_start: string | null
          contribution_pct: number
          created_at: string
          id: string
          is_published: boolean
          ordering: number
          planned_date: string | null
          planned_end: string | null
          planned_start: string | null
          progress: number
          project_id: string
          review_comment: string | null
          review_status: Database["public"]["Enums"]["milestone_review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          actual_end?: string | null
          actual_start?: string | null
          contribution_pct?: number
          created_at?: string
          id?: string
          is_published?: boolean
          ordering?: number
          planned_date?: string | null
          planned_end?: string | null
          planned_start?: string | null
          progress?: number
          project_id: string
          review_comment?: string | null
          review_status?: Database["public"]["Enums"]["milestone_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          actual_end?: string | null
          actual_start?: string | null
          contribution_pct?: number
          created_at?: string
          id?: string
          is_published?: boolean
          ordering?: number
          planned_date?: string | null
          planned_end?: string | null
          planned_start?: string | null
          progress?: number
          project_id?: string
          review_comment?: string | null
          review_status?: Database["public"]["Enums"]["milestone_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          submitted_at?: string | null
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          link: string | null
          project_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          project_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          project_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_activities: {
        Row: {
          created_at: string
          dependency: string | null
          id: string
          milestone_id: string | null
          ordering: number
          plan_version_id: string
          planned_end: string | null
          planned_start: string | null
          project_id: string
          sub_milestone_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          dependency?: string | null
          id?: string
          milestone_id?: string | null
          ordering?: number
          plan_version_id: string
          planned_end?: string | null
          planned_start?: string | null
          project_id: string
          sub_milestone_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          dependency?: string | null
          id?: string
          milestone_id?: string | null
          ordering?: number
          plan_version_id?: string
          planned_end?: string | null
          planned_start?: string | null
          project_id?: string
          sub_milestone_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_activities_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_activities_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "project_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_activities_sub_milestone_id_fkey"
            columns: ["sub_milestone_id"]
            isOneToOne: false
            referencedRelation: "sub_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_activities: {
        Row: {
          created_at: string
          expected_outcome: string | null
          id: string
          milestone_id: string | null
          planned_quantity: number | null
          project_id: string
          responsible_id: string | null
          status: Database["public"]["Enums"]["activity_status"]
          sub_milestone_id: string | null
          title: string
          unit: string | null
          updated_at: string
          weekly_work_plan_id: string
          work_day_id: string | null
        }
        Insert: {
          created_at?: string
          expected_outcome?: string | null
          id?: string
          milestone_id?: string | null
          planned_quantity?: number | null
          project_id: string
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          sub_milestone_id?: string | null
          title: string
          unit?: string | null
          updated_at?: string
          weekly_work_plan_id: string
          work_day_id?: string | null
        }
        Update: {
          created_at?: string
          expected_outcome?: string | null
          id?: string
          milestone_id?: string | null
          planned_quantity?: number | null
          project_id?: string
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          sub_milestone_id?: string | null
          title?: string
          unit?: string | null
          updated_at?: string
          weekly_work_plan_id?: string
          work_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planned_activities_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_activities_sub_milestone_id_fkey"
            columns: ["sub_milestone_id"]
            isOneToOne: false
            referencedRelation: "sub_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_activities_weekly_work_plan_id_fkey"
            columns: ["weekly_work_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_work_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_activities_work_day_id_fkey"
            columns: ["work_day_id"]
            isOneToOne: false
            referencedRelation: "weekly_work_days"
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
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_initials?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_reports: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          project_id: string
          quantity: number
          report_date: string
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["progress_report_status"]
          sub_milestone_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          project_id: string
          quantity: number
          report_date?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["progress_report_status"]
          sub_milestone_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          project_id?: string
          quantity?: number
          report_date?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["progress_report_status"]
          sub_milestone_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          category: string
          created_at: string
          current_version: number
          description: string | null
          id: string
          project_id: string
          title: string
          updated_at: string
          uploaded_by: string
          uploader_role: string | null
          visibility: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_version?: number
          description?: string | null
          id?: string
          project_id: string
          title: string
          updated_at?: string
          uploaded_by: string
          uploader_role?: string | null
          visibility?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_version?: number
          description?: string | null
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
          uploader_role?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_plan_versions: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          admin_note: string | null
          archived_at: string | null
          created_at: string
          file_path: string | null
          id: string
          period_label: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          previous_version_id: string | null
          project_id: string
          revision_reason: string | null
          status: Database["public"]["Enums"]["plan_version_status"]
          submitted_at: string
          submitted_by: string
          title: string
          updated_at: string
          version_no: number
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          admin_note?: string | null
          archived_at?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          period_label?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          previous_version_id?: string | null
          project_id: string
          revision_reason?: string | null
          status?: Database["public"]["Enums"]["plan_version_status"]
          submitted_at?: string
          submitted_by: string
          title: string
          updated_at?: string
          version_no: number
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          admin_note?: string | null
          archived_at?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          period_label?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          previous_version_id?: string | null
          project_id?: string
          revision_reason?: string | null
          status?: Database["public"]["Enums"]["plan_version_status"]
          submitted_at?: string
          submitted_by?: string
          title?: string
          updated_at?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_plan_versions_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "project_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_plan_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          active_plan_version_id: string | null
          client_name: string | null
          code: string
          company_id: string | null
          completion: number
          created_at: string
          created_by: string
          current_phase: string | null
          entreprise: string | null
          execution_enabled: boolean
          id: string
          location: string | null
          mission_controle: string | null
          planned_end_date: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          timezone: string
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          active_plan_version_id?: string | null
          client_name?: string | null
          code: string
          company_id?: string | null
          completion?: number
          created_at?: string
          created_by: string
          current_phase?: string | null
          entreprise?: string | null
          execution_enabled?: boolean
          id?: string
          location?: string | null
          mission_controle?: string | null
          planned_end_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          timezone?: string
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          active_plan_version_id?: string | null
          client_name?: string | null
          code?: string
          company_id?: string | null
          completion?: number
          created_at?: string
          created_by?: string
          current_phase?: string | null
          entreprise?: string | null
          execution_enabled?: boolean
          id?: string
          location?: string | null
          mission_controle?: string | null
          planned_end_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          timezone?: string
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
      report_approvals: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["approval_decision"]
          id: string
          project_id: string
          reason: string | null
          report_id: string
          reviewer_id: string
          signature_profile_id: string | null
          signature_snapshot: Json | null
        }
        Insert: {
          created_at?: string
          decision: Database["public"]["Enums"]["approval_decision"]
          id?: string
          project_id: string
          reason?: string | null
          report_id: string
          reviewer_id: string
          signature_profile_id?: string | null
          signature_snapshot?: Json | null
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["approval_decision"]
          id?: string
          project_id?: string
          reason?: string | null
          report_id?: string
          reviewer_id?: string
          signature_profile_id?: string | null
          signature_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "report_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_approvals_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_approvals_signature_profile_id_fkey"
            columns: ["signature_profile_id"]
            isOneToOne: false
            referencedRelation: "signature_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_comments: {
        Row: {
          author_id: string
          author_role: string | null
          body: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          project_id: string
          report_id: string | null
        }
        Insert: {
          author_id: string
          author_role?: string | null
          body: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          project_id: string
          report_id?: string | null
        }
        Update: {
          author_id?: string
          author_role?: string | null
          body?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          project_id?: string
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
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
      report_obligations: {
        Row: {
          created_at: string
          due_at: string
          due_date: string
          id: string
          kind: Database["public"]["Enums"]["obligation_kind"]
          project_id: string
          report_id: string | null
          resolved_at: string | null
          responsible_id: string | null
          status: Database["public"]["Enums"]["obligation_status"]
          updated_at: string
          weekly_work_plan_id: string | null
          work_day_id: string | null
        }
        Insert: {
          created_at?: string
          due_at: string
          due_date: string
          id?: string
          kind: Database["public"]["Enums"]["obligation_kind"]
          project_id: string
          report_id?: string | null
          resolved_at?: string | null
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["obligation_status"]
          updated_at?: string
          weekly_work_plan_id?: string | null
          work_day_id?: string | null
        }
        Update: {
          created_at?: string
          due_at?: string
          due_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["obligation_kind"]
          project_id?: string
          report_id?: string | null
          resolved_at?: string | null
          responsible_id?: string | null
          status?: Database["public"]["Enums"]["obligation_status"]
          updated_at?: string
          weekly_work_plan_id?: string | null
          work_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_obligations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_obligations_weekly_work_plan_id_fkey"
            columns: ["weekly_work_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_work_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_obligations_work_day_id_fkey"
            columns: ["work_day_id"]
            isOneToOne: false
            referencedRelation: "weekly_work_days"
            referencedColumns: ["id"]
          },
        ]
      }
      report_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          project_id: string
          report_id: string
          revision: number
          snapshot: Json
          state: Database["public"]["Enums"]["report_state"]
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          project_id: string
          report_id: string
          revision: number
          snapshot: Json
          state: Database["public"]["Enums"]["report_state"]
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
          report_id?: string
          revision?: number
          snapshot?: Json
          state?: Database["public"]["Enums"]["report_state"]
        }
        Relationships: [
          {
            foreignKeyName: "report_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_versions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_profiles: {
        Row: {
          full_name: string | null
          id: string
          initials: string | null
          is_current: boolean
          kind: string
          registered_at: string
          signature_data: string | null
          user_id: string
          version: number
        }
        Insert: {
          full_name?: string | null
          id?: string
          initials?: string | null
          is_current?: boolean
          kind?: string
          registered_at?: string
          signature_data?: string | null
          user_id: string
          version?: number
        }
        Update: {
          full_name?: string | null
          id?: string
          initials?: string | null
          is_current?: boolean
          kind?: string
          registered_at?: string
          signature_data?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      sub_milestones: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          completed_quantity: number
          contribution_pct: number
          created_at: string
          created_by: string
          id: string
          is_published: boolean
          milestone_id: string
          ordering: number
          planned_end: string | null
          planned_start: string | null
          progress_pct: number
          project_id: string
          status: string
          target_quantity: number
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          completed_quantity?: number
          contribution_pct?: number
          created_at?: string
          created_by: string
          id?: string
          is_published?: boolean
          milestone_id: string
          ordering?: number
          planned_end?: string | null
          planned_start?: string | null
          progress_pct?: number
          project_id: string
          status?: string
          target_quantity: number
          title: string
          unit?: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          completed_quantity?: number
          contribution_pct?: number
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean
          milestone_id?: string
          ordering?: number
          planned_end?: string | null
          planned_start?: string | null
          progress_pct?: number
          project_id?: string
          status?: string
          target_quantity?: number
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          milestone_id: string | null
          priority: string
          project_id: string
          status: string
          sub_milestone_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_id?: string | null
          priority?: string
          project_id: string
          status?: string
          sub_milestone_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_id?: string | null
          priority?: string
          project_id?: string
          status?: string
          sub_milestone_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sub_milestone_id_fkey"
            columns: ["sub_milestone_id"]
            isOneToOne: false
            referencedRelation: "sub_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string
          en: string
          fr: string
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          en: string
          fr: string
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          en?: string
          fr?: string
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          approval_signature: string | null
          created_at: string
          language: string
          notify_media_published: boolean
          notify_milestone_updated: boolean
          notify_new_issue: boolean
          notify_report_approved: boolean
          notify_report_rejected: boolean
          notify_task_assigned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_signature?: string | null
          created_at?: string
          language?: string
          notify_media_published?: boolean
          notify_milestone_updated?: boolean
          notify_new_issue?: boolean
          notify_report_approved?: boolean
          notify_report_rejected?: boolean
          notify_task_assigned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_signature?: string | null
          created_at?: string
          language?: string
          notify_media_published?: boolean
          notify_milestone_updated?: boolean
          notify_new_issue?: boolean
          notify_report_approved?: boolean
          notify_report_rejected?: boolean
          notify_task_assigned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      weekly_work_days: {
        Row: {
          created_at: string
          exception_reason: string | null
          id: string
          is_working_day: boolean
          locked: boolean
          project_id: string
          reporting_status: string
          weekly_work_plan_id: string
          work_date: string
        }
        Insert: {
          created_at?: string
          exception_reason?: string | null
          id?: string
          is_working_day?: boolean
          locked?: boolean
          project_id: string
          reporting_status?: string
          weekly_work_plan_id: string
          work_date: string
        }
        Update: {
          created_at?: string
          exception_reason?: string | null
          id?: string
          is_working_day?: boolean
          locked?: boolean
          project_id?: string
          reporting_status?: string
          weekly_work_plan_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_work_days_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_work_days_weekly_work_plan_id_fkey"
            columns: ["weekly_work_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_work_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_work_plans: {
        Row: {
          activated_at: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          cycle_status: Database["public"]["Enums"]["weekly_cycle_status"]
          end_date: string
          expected_outcome: string | null
          id: string
          notes: string | null
          plan_version_id: string | null
          project_id: string
          start_date: string
          status: Database["public"]["Enums"]["weekly_plan_status"]
          updated_at: string
          week_no: number
          year: number
        }
        Insert: {
          activated_at?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          cycle_status?: Database["public"]["Enums"]["weekly_cycle_status"]
          end_date: string
          expected_outcome?: string | null
          id?: string
          notes?: string | null
          plan_version_id?: string | null
          project_id: string
          start_date: string
          status?: Database["public"]["Enums"]["weekly_plan_status"]
          updated_at?: string
          week_no: number
          year: number
        }
        Update: {
          activated_at?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          cycle_status?: Database["public"]["Enums"]["weekly_cycle_status"]
          end_date?: string
          expected_outcome?: string | null
          id?: string
          notes?: string | null
          plan_version_id?: string | null
          project_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["weekly_plan_status"]
          updated_at?: string
          week_no?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_work_plans_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "project_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_work_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      can_report_on_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      enforce_report_deadlines: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_project_assistant: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_client_side: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _new: Json
          _old: Json
          _project_id: string
          _reason: string
        }
        Returns: undefined
      }
      notify_project_roles: {
        Args: {
          _body: string
          _entity_id: string
          _entity_type: string
          _exclude: string
          _link: string
          _project_id: string
          _roles: Database["public"]["Enums"]["project_member_role"][]
          _title: string
          _type: string
        }
        Returns: undefined
      }
      notify_users: {
        Args: {
          _body: string
          _entity_id: string
          _entity_type: string
          _link: string
          _project_id: string
          _title: string
          _type: string
          _user_ids: string[]
        }
        Returns: undefined
      }
      project_member_role: {
        Args: { _project_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["project_member_role"]
      }
      recalc_milestone: { Args: { _m: string }; Returns: undefined }
      recalc_project: { Args: { _p: string }; Returns: undefined }
      recalc_sub_milestone: { Args: { _sub: string }; Returns: undefined }
      shares_project: { Args: { _a: string; _b: string }; Returns: boolean }
    }
    Enums: {
      activity_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "delayed"
        | "suspended"
      app_role:
        | "super-admin"
        | "company-admin"
        | "engineer"
        | "client"
        | "technician"
        | "project-lead"
        | "client-assistant"
      approval_decision: "approved" | "rejected" | "revision-requested"
      issue_severity: "low" | "medium" | "high" | "critical"
      issue_status: "open" | "in-progress" | "resolved" | "closed"
      milestone_review_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
      milestone_status: "pending" | "in-progress" | "completed" | "delayed"
      obligation_kind: "daily" | "weekly"
      obligation_status: "pending" | "submitted" | "approved" | "absent"
      plan_version_status: "draft" | "submitted" | "active" | "archived"
      progress_report_status: "submitted" | "approved" | "rejected"
      project_member_role:
        | "manager"
        | "engineer"
        | "client"
        | "viewer"
        | "technician"
        | "project-lead"
        | "client-assistant"
      project_status:
        | "active"
        | "on-hold"
        | "completed"
        | "delayed"
        | "planning"
      report_state:
        | "pending"
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "absent"
        | "archived"
      report_status:
        | "draft"
        | "submitted"
        | "under-review"
        | "approved"
        | "rejected"
        | "published"
      weekly_cycle_status: "open" | "compliant" | "non_compliant" | "void"
      weekly_plan_status: "draft" | "submitted" | "active" | "closed" | "void"
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
      activity_status: [
        "not_started",
        "in_progress",
        "completed",
        "delayed",
        "suspended",
      ],
      app_role: [
        "super-admin",
        "company-admin",
        "engineer",
        "client",
        "technician",
        "project-lead",
        "client-assistant",
      ],
      approval_decision: ["approved", "rejected", "revision-requested"],
      issue_severity: ["low", "medium", "high", "critical"],
      issue_status: ["open", "in-progress", "resolved", "closed"],
      milestone_review_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
      ],
      milestone_status: ["pending", "in-progress", "completed", "delayed"],
      obligation_kind: ["daily", "weekly"],
      obligation_status: ["pending", "submitted", "approved", "absent"],
      plan_version_status: ["draft", "submitted", "active", "archived"],
      progress_report_status: ["submitted", "approved", "rejected"],
      project_member_role: [
        "manager",
        "engineer",
        "client",
        "viewer",
        "technician",
        "project-lead",
        "client-assistant",
      ],
      project_status: ["active", "on-hold", "completed", "delayed", "planning"],
      report_state: [
        "pending",
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "absent",
        "archived",
      ],
      report_status: [
        "draft",
        "submitted",
        "under-review",
        "approved",
        "rejected",
        "published",
      ],
      weekly_cycle_status: ["open", "compliant", "non_compliant", "void"],
      weekly_plan_status: ["draft", "submitted", "active", "closed", "void"],
    },
  },
} as const
