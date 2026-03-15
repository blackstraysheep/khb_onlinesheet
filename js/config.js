(function(global){
  const SUPABASE_URL = 'http://127.0.0.1:54321';
  const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
  //const AUDIO_BASE_URL = 'https://blackstraysheep.github.io/khb_onlinesheet/audio/';
  const AUDIO_BASE_URL = '../audio_zundamon/';
  const TOKEN_PREFIX = 'khb-';
  const TOKEN_LENGTH = 8;

  global.KHB_APP_CONFIG = Object.freeze({
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    JUDGE_FUNCTION_URL: SUPABASE_URL + '/functions/v1/judge-submit-with-token',
    AUDIO_BASE_URL,
    TOKEN_PREFIX,
    TOKEN_LENGTH,
  });
})(window);
