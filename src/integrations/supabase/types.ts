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
      adventure_signups: {
        Row: {
          adventure_id: string
          created_at: string
          id: string
          message: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adventure_id: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adventure_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adventure_signups_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
        ]
      }
      adventures: {
        Row: {
          country: string | null
          created_at: string
          creator_id: string
          difficulty: string | null
          elevation: string | null
          id: string
          max_group_size: number | null
          meeting_point: string | null
          notes: string | null
          peak_name: string
          target_date: string | null
          target_month: number | null
          target_year: number | null
          timing_type: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          creator_id: string
          difficulty?: string | null
          elevation?: string | null
          id?: string
          max_group_size?: number | null
          meeting_point?: string | null
          notes?: string | null
          peak_name: string
          target_date?: string | null
          target_month?: number | null
          target_year?: number | null
          timing_type?: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          creator_id?: string
          difficulty?: string | null
          elevation?: string | null
          id?: string
          max_group_size?: number | null
          meeting_point?: string | null
          notes?: string | null
          peak_name?: string
          target_date?: string | null
          target_month?: number | null
          target_year?: number | null
          timing_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ascent_cheers: {
        Row: {
          ascent_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ascent_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ascent_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ascent_cheers_ascent_id_fkey"
            columns: ["ascent_id"]
            isOneToOne: false
            referencedRelation: "ascents"
            referencedColumns: ["id"]
          },
        ]
      }
      ascents: {
        Row: {
          ascent_date: string
          country: string | null
          created_at: string
          date_precision: string
          elevation: string | null
          guiding: string | null
          id: string
          is_public: boolean
          oxygen: string | null
          partner_ids: string[]
          partner_names: string[]
          peak_name: string
          peak_type: string
          photo_url: string | null
          route: string | null
          trip_report: string | null
          updated_at: string
          user_id: string
          with_group: boolean
        }
        Insert: {
          ascent_date: string
          country?: string | null
          created_at?: string
          date_precision?: string
          elevation?: string | null
          guiding?: string | null
          id?: string
          is_public?: boolean
          oxygen?: string | null
          partner_ids?: string[]
          partner_names?: string[]
          peak_name: string
          peak_type?: string
          photo_url?: string | null
          route?: string | null
          trip_report?: string | null
          updated_at?: string
          user_id: string
          with_group?: boolean
        }
        Update: {
          ascent_date?: string
          country?: string | null
          created_at?: string
          date_precision?: string
          elevation?: string | null
          guiding?: string | null
          id?: string
          is_public?: boolean
          oxygen?: string | null
          partner_ids?: string[]
          partner_names?: string[]
          peak_name?: string
          peak_type?: string
          photo_url?: string | null
          route?: string | null
          trip_report?: string | null
          updated_at?: string
          user_id?: string
          with_group?: boolean
        }
        Relationships: []
      }
      bonus_titles: {
        Row: {
          created_at: string
          happened_on: string | null
          id: string
          story: string | null
          title_id: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          happened_on?: string | null
          id?: string
          story?: string | null
          title_id: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          happened_on?: string | null
          id?: string
          story?: string | null
          title_id?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          category: string
          contact_email: string | null
          created_at: string
          details: string
          id: string
          page_path: string | null
          reporter_id: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          category?: string
          contact_email?: string | null
          created_at?: string
          details: string
          id?: string
          page_path?: string | null
          reporter_id?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          category?: string
          contact_email?: string | null
          created_at?: string
          details?: string
          id?: string
          page_path?: string | null
          reporter_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      camp_builds: {
        Row: {
          build_id: string
          created_at: string
          id: string
          label: string
          updated_at: string
          user_id: string
          x: number
          y: number
        }
        Insert: {
          build_id: string
          created_at?: string
          id?: string
          label: string
          updated_at?: string
          user_id: string
          x?: number
          y?: number
        }
        Update: {
          build_id?: string
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
          user_id?: string
          x?: number
          y?: number
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_warnings: {
        Row: {
          advisory_level: number
          advisory_text: string | null
          country_name: string
          created_at: string
          id: string
          last_checked_at: string
          source: string | null
          updated_at: string
        }
        Insert: {
          advisory_level?: number
          advisory_text?: string | null
          country_name: string
          created_at?: string
          id?: string
          last_checked_at?: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          advisory_level?: number
          advisory_text?: string | null
          country_name?: string
          created_at?: string
          id?: string
          last_checked_at?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      location_updates: {
        Row: {
          created_at: string
          id: string
          lat: number
          lng: number
          recorded_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lng: number
          recorded_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          cheer: boolean
          comment: boolean
          created_at: string
          follow: boolean
          like: boolean
          mention: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          cheer?: boolean
          comment?: boolean
          created_at?: string
          follow?: boolean
          like?: boolean
          mention?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          cheer?: boolean
          comment?: boolean
          created_at?: string
          follow?: boolean
          like?: boolean
          mention?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          body: string
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          actor_id: string
          body: string
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          actor_id?: string
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: []
      }
      outbound_clicks: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string | null
          page_path: string | null
          url: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          label?: string | null
          page_path?: string | null
          url: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          page_path?: string | null
          url?: string
          video_id?: string | null
        }
        Relationships: []
      }
      peak_photo_entries: {
        Row: {
          caption: string | null
          country: string
          country_slug: string
          created_at: string
          id: string
          peak_name: string
          photo_url: string
          user_id: string
          votes: number
        }
        Insert: {
          caption?: string | null
          country: string
          country_slug: string
          created_at?: string
          id?: string
          peak_name: string
          photo_url: string
          user_id: string
          votes?: number
        }
        Update: {
          caption?: string | null
          country?: string
          country_slug?: string
          created_at?: string
          id?: string
          peak_name?: string
          photo_url?: string
          user_id?: string
          votes?: number
        }
        Relationships: []
      }
      peak_photo_rounds: {
        Row: {
          country_slug: string
          ends_at: string
          started_at: string
        }
        Insert: {
          country_slug: string
          ends_at?: string
          started_at?: string
        }
        Update: {
          country_slug?: string
          ends_at?: string
          started_at?: string
        }
        Relationships: []
      }
      peak_photo_votes: {
        Row: {
          country_slug: string
          created_at: string
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          country_slug: string
          created_at?: string
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          country_slug?: string
          created_at?: string
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peak_photo_votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "peak_photo_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      peakbagger_import_batches: {
        Row: {
          applied_at: string | null
          batch_no: number
          checksum: string
          created_at: string
          error: string | null
          id: string
          row_count: number
          run_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          batch_no: number
          checksum: string
          created_at?: string
          error?: string | null
          id?: string
          row_count?: number
          run_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          batch_no?: number
          checksum?: string
          created_at?: string
          error?: string | null
          id?: string
          row_count?: number
          run_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peakbagger_import_batches_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "peakbagger_import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      peakbagger_import_events: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          run_id: string | null
          scope: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          run_id?: string | null
          scope?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          run_id?: string | null
          scope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peakbagger_import_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "peakbagger_import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      peakbagger_import_lists: {
        Row: {
          error: string | null
          list_id: string
          row_count: number
          run_id: string | null
          scraped_at: string
          status: string
        }
        Insert: {
          error?: string | null
          list_id: string
          row_count?: number
          run_id?: string | null
          scraped_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          list_id?: string
          row_count?: number
          run_id?: string | null
          scraped_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "peakbagger_import_lists_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "peakbagger_import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      peakbagger_import_runs: {
        Row: {
          batches_applied: number
          batches_total: number
          created_at: string
          finished_at: string | null
          id: string
          last_error: string | null
          lists_blocked: number
          lists_done: number
          lists_total: number
          peaks_captured: number
          rows_upserted: number
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          batches_applied?: number
          batches_total?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          last_error?: string | null
          lists_blocked?: number
          lists_done?: number
          lists_total?: number
          peaks_captured?: number
          rows_upserted?: number
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          batches_applied?: number
          batches_total?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          last_error?: string | null
          lists_blocked?: number
          lists_done?: number
          lists_total?: number
          peaks_captured?: number
          rows_upserted?: number
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      peakbagger_peaks: {
        Row: {
          coords_checked_at: string | null
          coords_source: string | null
          elevation: number
          fetched_at: string
          lat: number | null
          location: string | null
          lon: number | null
          name: string
          pid: string
          prominence: number | null
          range: string | null
          world_peak_id: number | null
        }
        Insert: {
          coords_checked_at?: string | null
          coords_source?: string | null
          elevation: number
          fetched_at?: string
          lat?: number | null
          location?: string | null
          lon?: number | null
          name: string
          pid: string
          prominence?: number | null
          range?: string | null
          world_peak_id?: number | null
        }
        Update: {
          coords_checked_at?: string | null
          coords_source?: string | null
          elevation?: number
          fetched_at?: string
          lat?: number | null
          location?: string | null
          lon?: number | null
          name?: string
          pid?: string
          prominence?: number | null
          range?: string | null
          world_peak_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "peakbagger_peaks_world_peak_id_fkey"
            columns: ["world_peak_id"]
            isOneToOne: false
            referencedRelation: "world_peaks"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          edited_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string
          created_at: string
          edited_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          peak_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          edited_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          peak_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          peak_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          updated_at: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          updated_at?: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          updated_at?: string
          viewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string
          id: string
          profile_goals: string[]
          theme: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          id: string
          profile_goals?: string[]
          theme?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          profile_goals?: string[]
          theme?: string | null
          updated_at?: string
          username?: string | null
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
      visitor_counter: {
        Row: {
          count: number
          id: number
        }
        Insert: {
          count?: number
          id?: number
        }
        Update: {
          count?: number
          id?: number
        }
        Relationships: []
      }
      visits: {
        Row: {
          country: string | null
          created_at: string
          date_precision: string
          id: string
          is_public: boolean
          notes: string | null
          photo_url: string | null
          place_key: string
          place_name: string
          place_type: string
          updated_at: string
          user_id: string
          visit_date: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          date_precision?: string
          id?: string
          is_public?: boolean
          notes?: string | null
          photo_url?: string | null
          place_key: string
          place_name: string
          place_type?: string
          updated_at?: string
          user_id: string
          visit_date?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          date_precision?: string
          id?: string
          is_public?: boolean
          notes?: string | null
          photo_url?: string | null
          place_key?: string
          place_name?: string
          place_type?: string
          updated_at?: string
          user_id?: string
          visit_date?: string | null
        }
        Relationships: []
      }
      world_peaks: {
        Row: {
          added_by: string | null
          admin1: string | null
          country_code: string | null
          created_at: string
          dem_elevation: number | null
          elevation: number | null
          feature_code: string | null
          first_ascent_by: string | null
          first_ascent_date: string | null
          id: number
          isolation_km: number | null
          lat: number | null
          lon: number | null
          name: string
          notes: string | null
          peakbagger_id: string | null
          prominence: number | null
          prominence_source: string | null
          saddle_lat: number | null
          saddle_lon: number | null
          source: string
        }
        Insert: {
          added_by?: string | null
          admin1?: string | null
          country_code?: string | null
          created_at?: string
          dem_elevation?: number | null
          elevation?: number | null
          feature_code?: string | null
          first_ascent_by?: string | null
          first_ascent_date?: string | null
          id?: number
          isolation_km?: number | null
          lat?: number | null
          lon?: number | null
          name: string
          notes?: string | null
          peakbagger_id?: string | null
          prominence?: number | null
          prominence_source?: string | null
          saddle_lat?: number | null
          saddle_lon?: number | null
          source?: string
        }
        Update: {
          added_by?: string | null
          admin1?: string | null
          country_code?: string | null
          created_at?: string
          dem_elevation?: number | null
          elevation?: number | null
          feature_code?: string | null
          first_ascent_by?: string | null
          first_ascent_date?: string | null
          id?: number
          isolation_km?: number | null
          lat?: number | null
          lon?: number | null
          name?: string
          notes?: string | null
          peakbagger_id?: string | null
          prominence?: number | null
          prominence_source?: string | null
          saddle_lat?: number | null
          saddle_lon?: number | null
          source?: string
        }
        Relationships: []
      }
      world_places: {
        Row: {
          added_by: string | null
          admin1: string | null
          category: string
          country_code: string | null
          created_at: string
          feature_code: string | null
          id: number
          lat: number | null
          lon: number | null
          name: string
          source: string
          source_id: string | null
        }
        Insert: {
          added_by?: string | null
          admin1?: string | null
          category?: string
          country_code?: string | null
          created_at?: string
          feature_code?: string | null
          id?: number
          lat?: number | null
          lon?: number | null
          name: string
          source?: string
          source_id?: string | null
        }
        Update: {
          added_by?: string | null
          admin1?: string | null
          category?: string
          country_code?: string | null
          created_at?: string
          feature_code?: string | null
          id?: number
          lat?: number | null
          lon?: number | null
          name?: string
          source?: string
          source_id?: string | null
        }
        Relationships: []
      }
      youtube_climbs: {
        Row: {
          climb_date: string | null
          continent: string | null
          country: string | null
          created_at: string
          elevation: string | null
          id: string
          peak_name: string | null
          published_at: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          video_description: string | null
          video_id: string
          video_title: string
          video_url: string
        }
        Insert: {
          climb_date?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string
          elevation?: string | null
          id?: string
          peak_name?: string | null
          published_at?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_description?: string | null
          video_id: string
          video_title: string
          video_url: string
        }
        Update: {
          climb_date?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string
          elevation?: string | null
          id?: string
          peak_name?: string | null
          published_at?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_description?: string | null
          video_id?: string
          video_title?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      world_peak_country_counts: {
        Row: {
          country_code: string | null
          peaks: number | null
        }
        Relationships: []
      }
      world_peak_country_stats: {
        Row: {
          country_code: string | null
          max_elevation: number | null
          peak_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_peak_metrics: { Args: { _rows: Json }; Returns: number }
      ascent_dedupe_key: { Args: { _name: string }; Returns: string }
      build_peak_list: {
        Args: {
          _country?: string
          _limit?: number
          _min_elevation?: number
          _min_prominence?: number
          _sort?: string
        }
        Returns: {
          admin1: string
          country_code: string
          elevation: number
          id: number
          lat: number
          lon: number
          name: string
          prominence: number
          total_matches: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_visitor_count: { Args: never; Returns: number }
      peak_ascent_registry: {
        Args: { _limit?: number; _name: string }
        Returns: {
          ascent_date: string
          avatar_url: string
          country: string
          date_precision: string
          display_name: string
          id: string
          photo_url: string
          route: string
          trip_report: string
          user_id: string
        }[]
      }
      peak_norm: { Args: { _t: string }; Returns: string }
      search_world_peaks: {
        Args: {
          _country?: string
          _limit?: number
          _min_elevation?: number
          _min_prominence?: number
          _q: string
        }
        Returns: {
          admin1: string
          country_code: string
          elevation: number
          feature_code: string
          id: number
          lat: number
          lon: number
          name: string
          prominence: number
        }[]
      }
      search_world_places: {
        Args: {
          _category?: string
          _country?: string
          _limit?: number
          _q: string
        }
        Returns: {
          admin1: string
          category: string
          country_code: string
          feature_code: string
          id: number
          lat: number
          lon: number
          name: string
        }[]
      }
      send_notification: {
        Args: {
          _body: string
          _kind: string
          _link?: string
          _recipient_id: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
      wants_notification: {
        Args: { _kind: string; _user_id: string }
        Returns: boolean
      }
      world_peak_countries: {
        Args: never
        Returns: {
          country_code: string
          peaks: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
