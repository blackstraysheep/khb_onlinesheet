(function(global){
  const SUPABASE_URL = 'http://127.0.0.1:54321';
  const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

  const appConfig = Object.freeze({
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    JUDGE_FUNCTION_URL: SUPABASE_URL + '/functions/v1/judge-submit-with-token',
  });

  global.KHB_APP_CONFIG = appConfig;
})(window);
