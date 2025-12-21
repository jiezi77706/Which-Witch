-- ============================================
-- 举报系统数据库设置命令
-- 请在Supabase SQL编辑器中执行以下命令
-- ============================================

-- 1. 创建举报类型枚举
CREATE TYPE report_type AS ENUM (
  'copyright_infringement',
  'inappropriate_content',
  'spam',
  'harassment',
  'other'
);

-- 2. 创建举报状态枚举
CREATE TYPE report_status AS ENUM (
  'pending',
  'under_review',
  'ai_processing',
  'resolved',
  'rejected',
  'escalated'
);

-- 3. 创建举报表
CREATE TABLE work_reports (
  id SERIAL PRIMARY KEY,
  reported_work_id BIGINT NOT NULL,
  reporter_address VARCHAR(42) NOT NULL,
  report_type report_type NOT NULL,
  reason TEXT NOT NULL CHECK (LENGTH(reason) <= 300),
  alleged_copied_work_id BIGINT NULL,
  status report_status DEFAULT 'pending',
  ai_analysis JSONB NULL,
  ai_similarity_score DECIMAL(5,2) NULL,
  ai_verdict TEXT NULL,
  moderator_address VARCHAR(42) NULL,
  moderator_notes TEXT NULL,
  resolution_notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE NULL
);

-- 4. 创建AI仲裁报告表
CREATE TABLE ai_arbitration_reports (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL UNIQUE,
  overall_similarity_score DECIMAL(5,2) NOT NULL,
  disputed_areas JSONB NOT NULL,
  timeline_analysis JSONB NOT NULL,
  ai_recommendation TEXT NOT NULL,
  ai_confidence DECIMAL(5,2) NOT NULL,
  detailed_analysis JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (report_id) REFERENCES work_reports(id) ON DELETE CASCADE
);

-- 5. 创建索引
CREATE INDEX idx_work_reports_work_id ON work_reports(reported_work_id);
CREATE INDEX idx_work_reports_reporter ON work_reports(reporter_address);
CREATE INDEX idx_work_reports_status ON work_reports(status);
CREATE INDEX idx_work_reports_type ON work_reports(report_type);
CREATE INDEX idx_work_reports_created ON work_reports(created_at);
CREATE INDEX idx_ai_arbitration_report_id ON ai_arbitration_reports(report_id);

-- 6. 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建触发器
CREATE TRIGGER trigger_update_report_timestamp
BEFORE UPDATE ON work_reports
FOR EACH ROW
EXECUTE FUNCTION update_report_timestamp();

-- 8. 添加注释
COMMENT ON TABLE work_reports IS '作品举报记录表';
COMMENT ON TABLE ai_arbitration_reports IS 'AI仲裁报告表';
COMMENT ON COLUMN work_reports.reason IS '举报理由，最多300字符';
COMMENT ON COLUMN work_reports.alleged_copied_work_id IS '被抄袭的作品ID（仅抄袭举报）';

-- ============================================
-- 执行完成后，数据库表结构就创建好了
-- ============================================