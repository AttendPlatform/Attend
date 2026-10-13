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
      analytics_events: {
        Row: {
          campaign_id: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          event_id: string | null
          event_type: string
          id: string
          metadata: Json
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_analytics: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          share_platform: string | null
          source: string
          visitor_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          share_platform?: string | null
          source?: string
          visitor_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          share_platform?: string | null
          source?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_templates: {
        Row: {
          asset_url: string
          campaign_id: string
          canvas_config: Json
          created_at: string
          height: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
          version: number
          width: number
        }
        Insert: {
          asset_url: string
          campaign_id: string
          canvas_config?: Json
          created_at?: string
          height: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          version?: number
          width: number
        }
        Update: {
          asset_url?: string
          campaign_id?: string
          canvas_config?: Json
          created_at?: string
          height?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          version?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_templates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          downloads: number
          event_id: string
          generations: number
          id: string
          participants: number
          shares: number
          slug: string
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          downloads?: number
          event_id: string
          generations?: number
          id?: string
          participants?: number
          shares?: number
          slug: string
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          downloads?: number
          event_id?: string
          generations?: number
          id?: string
          participants?: number
          shares?: number
          slug?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      event_organizers: {
        Row: {
          created_at: string
          event_id: string
          id: string
          role: Database["public"]["Enums"]["organizer_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          role?: Database["public"]["Enums"]["organizer_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          role?: Database["public"]["Enums"]["organizer_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_organizers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_organizers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          id: string
          name: string | null
          participation_type: Database["public"]["Enums"]["event_participation_type"]
          registration_data: Json
          status: Database["public"]["Enums"]["event_attendance_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          name?: string | null
          participation_type?: Database["public"]["Enums"]["event_participation_type"]
          registration_data?: Json
          status?: Database["public"]["Enums"]["event_attendance_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          name?: string | null
          participation_type?: Database["public"]["Enums"]["event_participation_type"]
          registration_data?: Json
          status?: Database["public"]["Enums"]["event_attendance_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          allow_participant_campaigns: boolean
          category_id: string | null
          city: string | null
          country: string | null
          cover_image: string | null
          created_at: string
          creator_id: string
          description: string | null
          end_at: string | null
          id: string
          is_online: boolean
          latitude: number | null
          location_place_id: string | null
          longitude: number | null
          online_url: string | null
          participant_count: number
          participation_config: Json
          participation_model: Database["public"]["Enums"]["participation_model"]
          slug: string
          start_at: string
          state: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue_name: string | null
          views: number
        }
        Insert: {
          address?: string | null
          allow_participant_campaigns?: boolean
          category_id?: string | null
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          end_at?: string | null
          id?: string
          is_online?: boolean
          latitude?: number | null
          location_place_id?: string | null
          longitude?: number | null
          online_url?: string | null
          participant_count?: number
          participation_config?: Json
          participation_model?: Database["public"]["Enums"]["participation_model"]
          slug: string
          start_at: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue_name?: string | null
          views?: number
        }
        Update: {
          address?: string | null
          allow_participant_campaigns?: boolean
          category_id?: string | null
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          end_at?: string | null
          id?: string
          is_online?: boolean
          latitude?: number | null
          location_place_id?: string | null
          longitude?: number | null
          online_url?: string | null
          participant_count?: number
          participation_config?: Json
          participation_model?: Database["public"]["Enums"]["participation_model"]
          slug?: string
          start_at?: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue_name?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          dedupe_key: string | null
          event_id: string | null
          event_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          campaign_activity: boolean
          campaign_insights: boolean
          campaign_milestones: boolean
          created_at: string
          email_enabled: boolean
          event_reminders: boolean
          new_events: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          recommendations: boolean
          smart_notifications: boolean
          trending_events: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_activity?: boolean
          campaign_insights?: boolean
          campaign_milestones?: boolean
          created_at?: string
          email_enabled?: boolean
          event_reminders?: boolean
          new_events?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          recommendations?: boolean
          smart_notifications?: boolean
          trending_events?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_activity?: boolean
          campaign_insights?: boolean
          campaign_milestones?: boolean
          created_at?: string
          email_enabled?: boolean
          event_reminders?: boolean
          new_events?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          recommendations?: boolean
          smart_notifications?: boolean
          trending_events?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          action_label: string | null
          category: string
          created_at: string
          id: string
          is_active: boolean
          is_smart: boolean
          message_template: string
          title_template: string
          type: string
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_smart?: boolean
          message_template: string
          title_template: string
          type: string
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_smart?: boolean
          message_template?: string
          title_template?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          campaign_id: string | null
          category: string | null
          created_at: string
          dedupe_key: string | null
          delivery_channel: string | null
          event_id: string | null
          expires_at: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          metadata: Json | null
          priority: string
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          campaign_id?: string | null
          category?: string | null
          created_at?: string
          dedupe_key?: string | null
          delivery_channel?: string | null
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          campaign_id?: string | null
          category?: string | null
          created_at?: string
          dedupe_key?: string | null
          delivery_channel?: string | null
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          location: string | null
          name: string | null
          state: string | null
          twitter: string | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          name?: string | null
          state?: string | null
          twitter?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          name?: string | null
          state?: string | null
          twitter?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          campaign_id: string | null
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          reason: string
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_campaigns: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_campaigns_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_my_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_campaign_id?: string
          p_category: string
          p_dedupe_key?: string
          p_delivery_channel?: string
          p_event_id?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      create_notification_for_user: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_campaign_id?: string
          p_category: string
          p_dedupe_key?: string
          p_event_id?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      expire_old_notifications: { Args: never; Returns: number }
      get_campaign_analytics: {
        Args: { campaign_uuid: string }
        Returns: {
          direct_count: number
          discover_count: number
          email_count: number
          facebook_count: number
          instagram_count: number
          other_count: number
          telegram_count: number
          total_downloads: number
          total_generations: number
          total_shares: number
          total_views: number
          unique_participants: number
          whatsapp_count: number
          x_count: number
        }[]
      }
      get_campaign_recent_activity: {
        Args: { activity_limit?: number; campaign_uuid: string }
        Returns: {
          activity_id: string
          created_at: string
          event_type: string
          share_platform: string
          source: string
        }[]
      }
      get_my_notification_preferences: {
        Args: never
        Returns: {
          campaign_activity: boolean
          campaign_insights: boolean
          campaign_milestones: boolean
          created_at: string
          email_enabled: boolean
          event_reminders: boolean
          new_events: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          recommendations: boolean
          smart_notifications: boolean
          trending_events: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_my_notifications: {
        Args: { p_category?: string; p_limit?: number }
        Returns: {
          action_label: string
          action_url: string
          campaign_id: string
          category: string
          created_at: string
          delivery_channel: string
          event_id: string
          id: string
          message: string
          metadata: Json
          priority: string
          read_at: string
          status: string
          title: string
          type: string
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      increment_campaign_download: {
        Args: { campaign_uuid: string }
        Returns: undefined
      }
      increment_campaign_generation: {
        Args: { campaign_uuid: string }
        Returns: undefined
      }
      increment_campaign_metric: {
        Args: { campaign_id: string; metric_name: string }
        Returns: undefined
      }
      increment_campaign_views: {
        Args: { campaign_uuid: string }
        Returns: undefined
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      process_smart_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_campaign_id?: string
          p_category: string
          p_dedupe_key?: string
          p_event_id?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      record_notification_event: {
        Args: {
          p_campaign_id?: string
          p_dedupe_key?: string
          p_event_id?: string
          p_event_type: string
          p_metadata?: Json
        }
        Returns: string
      }
      track_campaign_event:
        | {
            Args: {
              campaign_uuid: string
              event_metadata?: Json
              event_name: string
              share_network?: string
              traffic_source?: string
              visitor_uuid: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_campaign_id: string
              p_event_type: string
              p_metadata?: Json
              p_visitor_id?: string
            }
            Returns: Json
          }
      update_notification_preferences: {
        Args: {
          p_campaign_activity?: boolean
          p_campaign_insights?: boolean
          p_campaign_milestones?: boolean
          p_email_enabled?: boolean
          p_event_reminders?: boolean
          p_new_events?: boolean
          p_push_enabled?: boolean
          p_quiet_hours_enabled?: boolean
          p_quiet_hours_end?: string
          p_quiet_hours_start?: string
          p_recommendations?: boolean
          p_smart_notifications?: boolean
          p_trending_events?: boolean
        }
        Returns: {
          campaign_activity: boolean
          campaign_insights: boolean
          campaign_milestones: boolean
          created_at: string
          email_enabled: boolean
          event_reminders: boolean
          new_events: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          recommendations: boolean
          smart_notifications: boolean
          trending_events: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      campaign_status: "draft" | "published" | "paused" | "archived"
      event_status:
        | "draft"
        | "published"
        | "paused"
        | "rejected"
        | "archived"
        | "cancelled"
        | "completed"
      event_attendance_status:
        | "attending"
        | "registered"
        | "ticketed"
        | "cancelled"
        | "attended"
      event_participation_type: "attendee" | "registrant" | "ticket_holder"
      organizer_role: "owner" | "organizer" | "manager" | "moderator"
      participation_model: "free" | "registration" | "paid" | "external"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
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
      campaign_status: ["draft", "published", "paused", "archived"],
      event_status: [
        "draft",
        "published",
        "paused",
        "rejected",
        "archived",
        "cancelled",
        "completed",
      ],
      event_attendance_status: [
        "attending",
        "registered",
        "ticketed",
        "cancelled",
        "attended",
      ],
      event_participation_type: ["attendee", "registrant", "ticket_holder"],
      organizer_role: ["owner", "organizer", "manager", "moderator"],
      participation_model: ["free", "registration", "paid", "external"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
    },
  },
} as const
