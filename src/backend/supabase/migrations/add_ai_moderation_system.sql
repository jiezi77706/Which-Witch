-- ============================================
-- WhichWitch AI Moderation System
-- Content Moderation & Copyright Arbitration
-- ============================================

-- 1. Content Moderation Records Table
CREATE TABLE IF NOT EXISTS content_moderation (
  id SERIAL PRIMARY KEY,
  work_id BIGINT NOT NULL,
  creator_address VARCHAR(42) NOT NULL,
  
  -- Moderation Status
  status VARCHAR(20) DEFAULT 'pending',
  
  -- AI Analysis Results
  ai_analysis JSONB,
  nsfw_score DECIMAL(5,2),
  violence_score DECIMAL(5,2),
  hate_score DECIMAL(5,2),
  overall_safety_score DECIMAL(5,2),
  
  -- Detected Issues
  detected_issues TEXT[],
  flagged_content TEXT[],
  
  -- Stake Information
  stake_amount VARCHAR(50),
  stake_tx_hash VARCHAR(66),
  stake_locked BOOLEAN DEFAULT true,
  
  -- Challenge Period
  challenge_period_end TIMESTAMP WITH TIME ZONE,
  challenge_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (work_id) REFERENCES works(work_id) ON DELETE CASCADE
);

-- 2. Copyright Disputes Table
CREATE TABLE IF NOT EXISTS copyright_disputes (
  id SERIAL PRIMARY KEY,
  
  -- Dispute Parties
  reporter_address VARCHAR(42) NOT NULL,
  accused_address VARCHAR(42) NOT NULL,
  
  -- Works Involved
  original_work_id BIGINT NOT NULL,
  accused_work_id BIGINT NOT NULL,
  
  -- Dispute Details
  dispute_reason TEXT NOT NULL,
  evidence_description TEXT,
  evidence_urls TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  
  -- AI Arbitration Report
  ai_report JSONB,
  similarity_score DECIMAL(5,2),
  
  -- Similarity Analysis Details
  composition_similarity DECIMAL(5,2),
  color_similarity DECIMAL(5,2),
  character_similarity DECIMAL(5,2),
  style_similarity DECIMAL(5,2),
  
  -- Disputed Regions
  disputed_regions JSONB,
  
  -- Timeline Analysis
  original_work_date TIMESTAMP WITH TIME ZONE,
  accused_work_date TIMESTAMP WITH TIME ZONE,
  timeline_analysis TEXT,
  
  -- AI Conclusion
  ai_conclusion TEXT,
  ai_recommendation VARCHAR(50),
  confidence_level DECIMAL(5,2),
  
  -- Resolution
  resolution VARCHAR(20),
  resolution_details TEXT,
  resolved_by VARCHAR(20),
  
  -- Locks
  works_locked BOOLEAN DEFAULT true,
  lock_tx_hash VARCHAR(66),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (original_work_id) REFERENCES works(work_id) ON DELETE CASCADE,
  FOREIGN KEY (accused_work_id) REFERENCES works(work_id) ON DELETE CASCADE
);

-- 3. Moderation Challenges Table
CREATE TABLE IF NOT EXISTS moderation_challenges (
  id SERIAL PRIMARY KEY,
  moderation_id INTEGER NOT NULL,
  challenger_address VARCHAR(42) NOT NULL,
  
  -- Challenge Details
  challenge_reason TEXT NOT NULL,
  challenge_evidence TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Review
  review_notes TEXT,
  reviewed_by VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (moderation_id) REFERENCES content_moderation(id) ON DELETE CASCADE
);

-- 4. AI Analysis Cache Table
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id SERIAL PRIMARY KEY,
  content_hash VARCHAR(64) UNIQUE NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  analysis_result JSONB NOT NULL,
  
  -- Cache metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1
);

-- 5. Dispute Evidence Table
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER NOT NULL,
  
  -- Evidence Details
  evidence_type VARCHAR(50),
  evidence_url TEXT,
  evidence_data JSONB,
  description TEXT,
  
  -- Uploader
  uploaded_by VARCHAR(42) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (dispute_id) REFERENCES copyright_disputes(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_moderation_work_id ON content_moderation(work_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_creator ON content_moderation(creator_address);
CREATE INDEX IF NOT EXISTS idx_copyright_disputes_reporter ON copyright_disputes(reporter_address);
CREATE INDEX IF NOT EXISTS idx_copyright_disputes_accused ON copyright_disputes(accused_address);
CREATE INDEX IF NOT EXISTS idx_copyright_disputes_status ON copyright_disputes(status);
