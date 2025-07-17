
-- Create a table for progress entries
CREATE TABLE public.progress_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  day TEXT NOT NULL,
  kids_taught TEXT[] NOT NULL,
  class TEXT NOT NULL,
  topic_taught TEXT NOT NULL,
  homework TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index on date for better query performance
CREATE INDEX idx_progress_entries_date ON public.progress_entries(date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication is implemented yet)
CREATE POLICY "Allow public read access" 
  ON public.progress_entries 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access" 
  ON public.progress_entries 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" 
  ON public.progress_entries 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete access" 
  ON public.progress_entries 
  FOR DELETE 
  USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_progress_entries_updated_at 
    BEFORE UPDATE ON public.progress_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
