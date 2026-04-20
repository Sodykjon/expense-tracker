import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lgdyldmpboxdizrzldst.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZHlsZG1wYm94ZGl6cnpsZHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NDE3NjcsImV4cCI6MjA5MjIxNzc2N30.BvgGlmYcug9gYAWkGkkODKsCJj0JXfnRrE0iigTPcJw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
