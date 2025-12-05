
// Supabase Initialization
const SUPABASE_URL = 'https://bwpskigahszxkgzxtewf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cHNraWdhaHN6eGtnenh0ZXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDQzMDgsImV4cCI6MjA4MDI4MDMwOH0.D99euPduBI0kJuE0u3Yw4fJCsvT5LSyO4VTbtbY3TD0';

// Ensure Supabase is loaded
if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase initialized');
} else {
    console.error('Supabase library not loaded!');
}
