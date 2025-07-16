-- User Limits Migration
-- Creates tables and policies for managing user generation limits

-- Create user_limits table
CREATE TABLE user_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_limit INTEGER NOT NULL DEFAULT 50,
    current_usage INTEGER NOT NULL DEFAULT 0,
    reset_date TIMESTAMP NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create usage_history table
CREATE TABLE usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    generation_count INTEGER NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_limits_user_id ON user_limits(user_id);
CREATE INDEX idx_user_limits_reset_date ON user_limits(reset_date);
CREATE INDEX idx_usage_history_user_id ON usage_history(user_id);
CREATE INDEX idx_usage_history_period ON usage_history(period_start, period_end);

-- Enable Row Level Security
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_limits
CREATE POLICY "Users can view own limits" ON user_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own limits" ON user_limits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own limits" ON user_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for usage_history
CREATE POLICY "Users can view own usage history" ON usage_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage history" ON usage_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies (assuming admin role exists)
CREATE POLICY "Admins can view all limits" ON user_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can update all limits" ON user_limits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can view all usage history" ON usage_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on user_limits
CREATE TRIGGER update_user_limits_updated_at
    BEFORE UPDATE ON user_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle monthly limit reset
CREATE OR REPLACE FUNCTION reset_monthly_limits()
RETURNS void AS $$
BEGIN
    UPDATE user_limits 
    SET 
        current_usage = 0,
        reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE reset_date <= NOW();
END;
$$ language 'plpgsql';

-- Function to safely increment usage (atomic operation)
CREATE OR REPLACE FUNCTION increment_user_usage(user_uuid UUID)
RETURNS TABLE(
    new_usage INTEGER,
    monthly_limit INTEGER,
    limit_reached BOOLEAN,
    reset_date TIMESTAMP
) AS $$
DECLARE
    current_limit user_limits%ROWTYPE;
BEGIN
    -- Get current limit with row lock
    SELECT * INTO current_limit 
    FROM user_limits 
    WHERE user_id = user_uuid 
    FOR UPDATE;
    
    -- If no limit exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_limits (user_id, monthly_limit, current_usage, reset_date)
        VALUES (user_uuid, 50, 1, DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
        RETURNING * INTO current_limit;
        
        RETURN QUERY SELECT 
            current_limit.current_usage,
            current_limit.monthly_limit,
            (current_limit.current_usage >= current_limit.monthly_limit),
            current_limit.reset_date;
        RETURN;
    END IF;
    
    -- Check if limit needs reset
    IF current_limit.reset_date <= NOW() THEN
        UPDATE user_limits 
        SET 
            current_usage = 1,
            reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
        WHERE user_id = user_uuid
        RETURNING * INTO current_limit;
    ELSE
        -- Increment usage
        UPDATE user_limits 
        SET current_usage = current_usage + 1
        WHERE user_id = user_uuid
        RETURNING * INTO current_limit;
    END IF;
    
    RETURN QUERY SELECT 
        current_limit.current_usage,
        current_limit.monthly_limit,
        (current_limit.current_usage >= current_limit.monthly_limit),
        current_limit.reset_date;
END;
$$ language 'plpgsql' SECURITY DEFINER; 