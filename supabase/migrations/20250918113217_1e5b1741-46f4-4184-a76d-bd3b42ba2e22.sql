-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  suggestion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert suggestions
CREATE POLICY "Anyone can insert suggestions" 
ON public.suggestions 
FOR INSERT 
WITH CHECK (true);

-- Allow only admins to select suggestions
CREATE POLICY "Admins can view all suggestions" 
ON public.suggestions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow only admins to update suggestions
CREATE POLICY "Admins can update suggestions" 
ON public.suggestions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow only admins to delete suggestions
CREATE POLICY "Admins can delete suggestions" 
ON public.suggestions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));