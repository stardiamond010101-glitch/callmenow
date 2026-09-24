-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  extension_code TEXT UNIQUE NOT NULL,
  per_minute_rate DECIMAL(10, 2) NOT NULL DEFAULT 4.00,
  minimum_deposit DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  phone_number TEXT,
  is_available BOOLEAN DEFAULT false,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crypto wallet addresses for payouts
CREATE TABLE public.crypto_wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  coin_type TEXT NOT NULL CHECK (coin_type IN ('USDT', 'BTC', 'ETH', 'LTC', 'USDC')),
  wallet_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call records
CREATE TABLE public.calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  caller_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ringing', 'answered', 'missed', 'declined')),
  duration_seconds INTEGER DEFAULT 0,
  amount_charged DECIMAL(10, 2) DEFAULT 0.00,
  twilio_call_sid TEXT UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout history
CREATE TABLE public.payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  coin_type TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'confirmed', 'failed')),
  nowpayments_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Revenue analytics (daily aggregates)
CREATE TABLE public.revenue_daily (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  answered_calls INTEGER DEFAULT 0,
  missed_calls INTEGER DEFAULT 0,
  declined_calls INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0.00,
  UNIQUE(user_id, date)
);

-- Activity feed
CREATE TABLE public.activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('payment_received', 'video_switch', 'missed_call', 'call_ended', 'payout_sent')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification settings
CREATE TABLE public.notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  new_calls BOOLEAN DEFAULT true,
  missed_calls BOOLEAN DEFAULT true,
  payments BOOLEAN DEFAULT true,
  promos BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy settings
CREATE TABLE public.privacy_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  hide_caller_id BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KYC verification
CREATE TABLE public.kyc_verification (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  provider TEXT NOT NULL, -- 'onfido', 'sumsub'
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_calls_user_id ON public.calls(user_id);
CREATE INDEX idx_calls_created_at ON public.calls(created_at DESC);
CREATE INDEX idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_revenue_daily_user_date ON public.revenue_daily(user_id, date);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wallets" ON public.crypto_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON public.crypto_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON public.crypto_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" ON public.crypto_wallets
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own calls" ON public.calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own revenue" ON public.revenue_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification settings" ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own kyc" ON public.kyc_verification
  FOR SELECT USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username, extension_code)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    lower(replace(split_part(NEW.email, '@', 1), ' ', '_')),
    lpad((random() * 9999)::int::text, 4, '0')
  );
  
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to upsert revenue daily
CREATE OR REPLACE FUNCTION public.upsert_revenue_daily(
  p_user_id UUID,
  p_date DATE,
  p_total_calls INTEGER DEFAULT 0,
  p_answered_calls INTEGER DEFAULT 0,
  p_missed_calls INTEGER DEFAULT 0,
  p_declined_calls INTEGER DEFAULT 0,
  p_total_minutes INTEGER DEFAULT 0,
  p_total_revenue DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.revenue_daily (
    user_id, date, total_calls, answered_calls, missed_calls, declined_calls, total_minutes, total_revenue
  )
  VALUES (
    p_user_id, p_date, p_total_calls, p_answered_calls, p_missed_calls, p_declined_calls, p_total_minutes, p_total_revenue
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_calls = revenue_daily.total_calls + p_total_calls,
    answered_calls = revenue_daily.answered_calls + p_answered_calls,
    missed_calls = revenue_daily.missed_calls + p_missed_calls,
    declined_calls = revenue_daily.declined_calls + p_declined_calls,
    total_minutes = revenue_daily.total_minutes + p_total_minutes,
    total_revenue = revenue_daily.total_revenue + p_total_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
