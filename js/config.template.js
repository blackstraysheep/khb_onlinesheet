(function(global){
  const SUPABASE_URL = '${SUPABASE_URL}';
  const SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
  const AUDIO_BASE_URL = '${AUDIO_BASE_URL}';
  const TOKEN_PREFIX = '${TOKEN_PREFIX}';
  const TOKEN_LENGTH = Number('${TOKEN_LENGTH}') || 32;

  global.KHB_APP_CONFIG = Object.freeze({
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    JUDGE_FUNCTION_URL: SUPABASE_URL + '/functions/v1/judge-submit-with-token',
    JUDGE_REVEALED_HAIKU_FUNCTION_URL: SUPABASE_URL + '/functions/v1/judge-get-revealed-haiku',
    AUDIO_BASE_URL,
    TOKEN_PREFIX,
    TOKEN_LENGTH,
  });
})(window);
