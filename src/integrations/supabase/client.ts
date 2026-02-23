import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rigooegpcmrxzaqqnkdr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_EACOWIWsnL9G-3zpWDTeEw_fPGAJV2a";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
