/**
 * StudySphere - Supabase Client Configuration
 * ===========================================
 * Alternative backend client using Supabase.
 * Enforces PostgreSQL Row Level Security (RLS).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xyzproject.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * SQL Schema & RLS Policies for Supabase:
 * 
 * -- 1. Profiles Table with Role
 * create table public.profiles (
 *   id uuid references auth.users not null primary key,
 *   name text,
 *   email text,
 *   role text default 'student'
 * );
 * 
 * -- 2. Resources Table
 * create table public.resources (
 *   id text primary key,
 *   title text not null,
 *   description text not null,
 *   subject text not null,
 *   unit text not null,
 *   type text not null,
 *   file_url text,
 *   video_url text,
 *   tags text,
 *   uploaded_by uuid references auth.users,
 *   created_at timestamp with time zone default timezone('utc'::text, now()),
 *   average_rating numeric default 0.0,
 *   rating_count int default 0,
 *   view_count int default 0
 * );
 * 
 * -- 3. Enable RLS
 * alter table public.resources enable row level security;
 * 
 * -- Anyone can read resources
 * create policy "Public resources read" on public.resources for select using (true);
 * 
 * -- Only admins can insert/update/delete resources
 * create policy "Admin write resources" on public.resources for all
 *   using (auth.jwt() ->> 'email' = 'kaliabhavyam123@gmail.com' or
 *          exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
 */

export default supabase;
