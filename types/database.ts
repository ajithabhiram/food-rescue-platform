export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'donor' | 'partner' | 'volunteer'
export type OfferStatus = 'available' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled'
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type NotificationType = 'email' | 'sms' | 'push'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          role: UserRole
          verified_at: string | null
          banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone?: string | null
          role?: UserRole
          verified_at?: string | null
          banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          role?: UserRole
          verified_at?: string | null
          banned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      donor_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          address: string | null
          city: string | null
          location: unknown | null
          zone_id: string | null
          opening_hours: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          address?: string | null
          city?: string | null
          location?: unknown | null
          zone_id?: string | null
          opening_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string | null
          address?: string | null
          city?: string | null
          location?: unknown | null
          zone_id?: string | null
          opening_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      partner_profiles: {
        Row: {
          id: string
          user_id: string
          org_name: string
          address: string | null
          city: string | null
          location: unknown | null
          zone_id: string | null
          capacity_info: Json | null
          collection_prefs: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_name: string
          address?: string | null
          city?: string | null
          location?: unknown | null
          zone_id?: string | null
          capacity_info?: Json | null
          collection_prefs?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_name?: string
          address?: string | null
          city?: string | null
          location?: unknown | null
          zone_id?: string | null
          capacity_info?: Json | null
          collection_prefs?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          donor_id: string
          title: string
          description: string | null
          quantity_est: number | null
          quantity_unit: string | null
          food_type: string | null
          pickup_window_start: string
          pickup_window_end: string
          location: unknown | null
          address: string | null
          status: OfferStatus
          image_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          donor_id: string
          title: string
          description?: string | null
          quantity_est?: number | null
          quantity_unit?: string | null
          food_type?: string | null
          pickup_window_start: string
          pickup_window_end: string
          location?: unknown | null
          address?: string | null
          status?: OfferStatus
          image_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          donor_id?: string
          title?: string
          description?: string | null
          quantity_est?: number | null
          quantity_unit?: string | null
          food_type?: string | null
          pickup_window_start?: string
          pickup_window_end?: string
          location?: unknown | null
          address?: string | null
          status?: OfferStatus
          image_path?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          offer_id: string
          partner_id: string | null
          volunteer_id: string | null
          scheduled_time: string | null
          status: AssignmentStatus
          otp_code: string | null
          pickup_photos: string[] | null
          notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          partner_id?: string | null
          volunteer_id?: string | null
          scheduled_time?: string | null
          status?: AssignmentStatus
          otp_code?: string | null
          pickup_photos?: string[] | null
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          partner_id?: string | null
          volunteer_id?: string | null
          scheduled_time?: string | null
          status?: AssignmentStatus
          otp_code?: string | null
          pickup_photos?: string[] | null
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      offer_status: OfferStatus
      assignment_status: AssignmentStatus
      notification_type: NotificationType
    }
  }
}
