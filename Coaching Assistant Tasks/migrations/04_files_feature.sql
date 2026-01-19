-- Files table for document/media storage
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- MIME type (e.g., 'application/pdf', 'image/png')
    file_size_bytes INTEGER NOT NULL,
    storage_url TEXT NOT NULL, -- URL to the stored file
    description TEXT,
    entity_type TEXT, -- Type of entity this file belongs to (e.g., 'drill', 'session', 'player', 'coach')
    entity_id UUID, -- ID of the entity this file is attached to
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_entity_type ON public.files(entity_type);
CREATE INDEX IF NOT EXISTS idx_files_entity_id ON public.files(entity_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_entity_lookup ON public.files(entity_type, entity_id);

-- File sharing table for granular access control
CREATE TABLE IF NOT EXISTS public.file_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit', 'admin')),
    shared_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(file_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON public.file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with_user_id ON public.file_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_by_user_id ON public.file_shares(shared_by_user_id);

-- File comments/annotations
CREATE TABLE IF NOT EXISTS public.file_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    timestamp_position FLOAT, -- For video files, the timestamp in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_comments_file_id ON public.file_comments(file_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_user_id ON public.file_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_created_at ON public.file_comments(created_at);

-- Enable RLS on files tables
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files
-- Users can view their own files
CREATE POLICY "Users can view own files" ON public.files FOR SELECT
USING (auth.uid() = uploaded_by);

-- Users can view files shared with them
CREATE POLICY "Users can view shared files" ON public.files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.file_shares
    WHERE file_shares.file_id = files.id
    AND file_shares.shared_with_user_id = auth.uid()
  )
);

-- Users can view public files
CREATE POLICY "Users can view public files" ON public.files FOR SELECT
USING (is_public = true);

-- Users can insert their own files
CREATE POLICY "Users can upload files" ON public.files FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- Users can update their own files
CREATE POLICY "Users can update own files" ON public.files FOR UPDATE
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON public.files FOR DELETE
USING (auth.uid() = uploaded_by);

-- RLS for file_shares
CREATE POLICY "File owner can manage shares" ON public.file_shares FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_shares.file_id
    AND files.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Shared user can view shares" ON public.file_shares FOR SELECT
USING (shared_with_user_id = auth.uid());

CREATE POLICY "File owner can insert shares" ON public.file_shares FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_shares.file_id
    AND files.uploaded_by = auth.uid()
  )
  AND shared_by_user_id = auth.uid()
);

CREATE POLICY "File owner can delete shares" ON public.file_shares FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_shares.file_id
    AND files.uploaded_by = auth.uid()
  )
);

-- RLS for file_comments
CREATE POLICY "Users can view comments on files they have access to" ON public.file_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_comments.file_id
    AND (
      files.uploaded_by = auth.uid()
      OR files.is_public = true
      OR EXISTS (
        SELECT 1 FROM public.file_shares
        WHERE file_shares.file_id = files.id
        AND file_shares.shared_with_user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can add comments to accessible files" ON public.file_comments FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_comments.file_id
    AND (
      files.uploaded_by = auth.uid()
      OR files.is_public = true
      OR EXISTS (
        SELECT 1 FROM public.file_shares
        WHERE file_shares.file_id = files.id
        AND file_shares.shared_with_user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update their own comments" ON public.file_comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON public.file_comments FOR DELETE
USING (user_id = auth.uid());
