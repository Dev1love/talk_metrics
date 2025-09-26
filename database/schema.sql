-- TalkMetrics Database Schema
-- PostgreSQL Database Schema for chat analysis and metrics calculation

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Participants table - stores information about chat participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
    platform_id VARCHAR(255), -- Original ID from platform
    is_business BOOLEAN DEFAULT false, -- Is this participant the business account
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table - groups related messages into conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
    platform_conversation_id VARCHAR(255), -- Original conversation ID from platform
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    participant_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table - stores individual chat messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'contact')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    timestamp_original TIMESTAMP WITH TIME ZONE NOT NULL, -- Original timestamp from chat
    timestamp_normalized TIMESTAMP WITH TIME ZONE NOT NULL, -- Normalized timestamp
    platform_message_id VARCHAR(255), -- Original message ID from platform
    is_forwarded BOOLEAN DEFAULT false,
    reply_to_message_id UUID REFERENCES messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis table - stores AI processing results for messages
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    intention VARCHAR(50) CHECK (intention IN ('request', 'booking', 'payment', 'complaint', 'upsell', 'greeting', 'goodbye', 'question', 'answer', 'other')),
    intention_confidence DECIMAL(3,2) CHECK (intention_confidence >= 0 AND intention_confidence <= 1),
    politeness_score DECIMAL(3,2) CHECK (politeness_score >= 0 AND politeness_score <= 1),
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_confidence DECIMAL(3,2) CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 1),
    contains_keywords TEXT[], -- Array of detected keywords
    ai_model VARCHAR(50), -- Which AI model was used
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Metrics table - stores calculated metrics for each conversation
CREATE TABLE conversation_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    first_response_time_minutes INTEGER, -- Time to first response in minutes
    avg_response_time_minutes DECIMAL(10,2), -- Average response time in minutes
    total_response_time_minutes INTEGER, -- Total time from start to close
    message_count_incoming INTEGER DEFAULT 0,
    message_count_outgoing INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false, -- Was the conversation resolved/completed
    has_booking_conversion BOOLEAN DEFAULT false, -- Contains booking keywords/confirmation
    has_payment_conversion BOOLEAN DEFAULT false, -- Contains payment keywords/confirmation
    has_upsell_attempt BOOLEAN DEFAULT false, -- Contains upsell proposals
    avg_politeness_score DECIMAL(3,2), -- Average politeness of outgoing messages
    dominant_customer_sentiment VARCHAR(20), -- Most frequent customer sentiment
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global Metrics table - stores aggregated metrics across all conversations
CREATE TABLE global_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    completed_conversations INTEGER DEFAULT 0,
    avg_first_response_minutes DECIMAL(10,2),
    avg_response_time_minutes DECIMAL(10,2),
    avg_closure_time_minutes DECIMAL(10,2),
    completion_rate DECIMAL(5,2), -- Percentage of completed conversations
    booking_conversion_rate DECIMAL(5,2), -- Percentage with booking conversion
    payment_conversion_rate DECIMAL(5,2), -- Percentage with payment conversion
    upsell_rate DECIMAL(5,2), -- Percentage with upsell attempts
    avg_politeness_score DECIMAL(3,2),
    cci_score INTEGER CHECK (cci_score >= 0 AND cci_score <= 100), -- Communication Quality Index
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_date)
);

-- Insights table - stores generated insights and recommendations
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50) NOT NULL, -- e.g., 'response_time', 'politeness', 'conversion'
    proof_message_id UUID REFERENCES messages(id), -- Link to specific message as proof
    proof_conversation_id UUID REFERENCES conversations(id), -- Link to conversation as proof
    metric_impact DECIMAL(5,2), -- Expected impact on metrics (percentage)
    is_addressed BOOLEAN DEFAULT false,
    addressed_at TIMESTAMP WITH TIME ZONE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File Uploads table - tracks uploaded chat files
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(10) CHECK (file_type IN ('txt', 'json')),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
    upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    conversations_created INTEGER DEFAULT 0,
    messages_created INTEGER DEFAULT 0,
    participants_created INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance optimization
CREATE INDEX idx_messages_conversation_timestamp ON messages(conversation_id, timestamp_normalized);
CREATE INDEX idx_messages_participant ON messages(participant_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_participants_platform ON participants(platform);
CREATE INDEX idx_ai_analysis_message ON ai_analysis(message_id);
CREATE INDEX idx_ai_analysis_intention ON ai_analysis(intention);
CREATE INDEX idx_conversation_metrics_conversation ON conversation_metrics(conversation_id);
CREATE INDEX idx_global_metrics_date ON global_metrics(metric_date);
CREATE INDEX idx_insights_priority ON insights(priority);
CREATE INDEX idx_insights_category ON insights(category);
CREATE INDEX idx_file_uploads_status ON file_uploads(upload_status);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();