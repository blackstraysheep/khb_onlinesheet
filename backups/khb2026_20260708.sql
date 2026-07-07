--
-- PostgreSQL database dump
--

\restrict L26yeJRWxzfXef99eb8gznemS1sjmAXBYjRuAlfqP0yTDOqgfQig6vxDM0x3gR6

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP EVENT TRIGGER IF EXISTS pgrst_drop_watch;
DROP EVENT TRIGGER IF EXISTS pgrst_ddl_watch;
DROP EVENT TRIGGER IF EXISTS issue_pg_net_access;
DROP EVENT TRIGGER IF EXISTS issue_pg_graphql_access;
DROP EVENT TRIGGER IF EXISTS issue_pg_cron_access;
DROP EVENT TRIGGER IF EXISTS issue_graphql_placeholder;
DROP PUBLICATION IF EXISTS supabase_realtime;
DROP POLICY IF EXISTS venues_select ON public.venues;
DROP POLICY IF EXISTS submissions_select ON public.submissions;
DROP POLICY IF EXISTS state_update_temp ON public.state;
DROP POLICY IF EXISTS state_select ON public.state;
DROP POLICY IF EXISTS matches_update_temp ON public.matches;
DROP POLICY IF EXISTS matches_select ON public.matches;
DROP POLICY IF EXISTS matches_insert_temp ON public.matches;
DROP POLICY IF EXISTS match_snapshots_select ON public.match_snapshots;
DROP POLICY IF EXISTS judges_update_temp ON public.judges;
DROP POLICY IF EXISTS judges_select ON public.judges;
DROP POLICY IF EXISTS judges_insert_temp ON public.judges;
DROP POLICY IF EXISTS expected_judges_select ON public.expected_judges;
DROP POLICY IF EXISTS expected_judges_insert_temp ON public.expected_judges;
DROP POLICY IF EXISTS expected_judges_delete_temp ON public.expected_judges;
ALTER TABLE IF EXISTS ONLY storage.vector_indexes DROP CONSTRAINT IF EXISTS vector_indexes_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_upload_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads DROP CONSTRAINT IF EXISTS s3_multipart_uploads_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.objects DROP CONSTRAINT IF EXISTS "objects_bucketId_fkey";
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS submissions_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS submissions_judge_id_fkey;
ALTER TABLE IF EXISTS ONLY public.state DROP CONSTRAINT IF EXISTS state_venue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.state DROP CONSTRAINT IF EXISTS state_current_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_snapshots DROP CONSTRAINT IF EXISTS match_snapshots_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.expected_judges DROP CONSTRAINT IF EXISTS expected_judges_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.expected_judges DROP CONSTRAINT IF EXISTS expected_judges_judge_id_fkey;
ALTER TABLE IF EXISTS ONLY public.access_tokens DROP CONSTRAINT IF EXISTS access_tokens_venue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.access_tokens DROP CONSTRAINT IF EXISTS access_tokens_judge_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.webauthn_credentials DROP CONSTRAINT IF EXISTS webauthn_credentials_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.webauthn_challenges DROP CONSTRAINT IF EXISTS webauthn_challenges_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sso_domains DROP CONSTRAINT IF EXISTS sso_domains_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_oauth_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_flow_state_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_session_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_client_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_challenges DROP CONSTRAINT IF EXISTS mfa_challenges_auth_factor_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS mfa_amr_claims_session_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_user_id_fkey;
DROP TRIGGER IF EXISTS update_objects_updated_at ON storage.objects;
DROP TRIGGER IF EXISTS protect_objects_delete ON storage.objects;
DROP TRIGGER IF EXISTS protect_buckets_delete ON storage.buckets;
DROP TRIGGER IF EXISTS enforce_bucket_name_length_trigger ON storage.buckets;
DROP TRIGGER IF EXISTS tr_check_filters ON realtime.subscription;
DROP INDEX IF EXISTS storage.vector_indexes_name_bucket_id_idx;
DROP INDEX IF EXISTS storage.name_prefix_search;
DROP INDEX IF EXISTS storage.idx_objects_bucket_id_name_lower;
DROP INDEX IF EXISTS storage.idx_objects_bucket_id_name;
DROP INDEX IF EXISTS storage.idx_multipart_uploads_list;
DROP INDEX IF EXISTS storage.buckets_analytics_unique_name_idx;
DROP INDEX IF EXISTS storage.bucketid_objname;
DROP INDEX IF EXISTS storage.bname;
DROP INDEX IF EXISTS realtime.subscription_subscription_id_entity_filters_action_filter_selec;
DROP INDEX IF EXISTS realtime.messages_inserted_at_topic_index;
DROP INDEX IF EXISTS realtime.ix_realtime_subscription_entity;
DROP INDEX IF EXISTS public.submissions_match_judge_epoch_idx;
DROP INDEX IF EXISTS public.idx_match_snapshots_unique;
DROP INDEX IF EXISTS auth.webauthn_credentials_user_id_idx;
DROP INDEX IF EXISTS auth.webauthn_credentials_credential_id_key;
DROP INDEX IF EXISTS auth.webauthn_challenges_user_id_idx;
DROP INDEX IF EXISTS auth.webauthn_challenges_expires_at_idx;
DROP INDEX IF EXISTS auth.users_is_anonymous_idx;
DROP INDEX IF EXISTS auth.users_instance_id_idx;
DROP INDEX IF EXISTS auth.users_instance_id_email_idx;
DROP INDEX IF EXISTS auth.users_email_partial_key;
DROP INDEX IF EXISTS auth.user_id_created_at_idx;
DROP INDEX IF EXISTS auth.unique_phone_factor_per_user;
DROP INDEX IF EXISTS auth.sso_providers_resource_id_pattern_idx;
DROP INDEX IF EXISTS auth.sso_providers_resource_id_idx;
DROP INDEX IF EXISTS auth.sso_domains_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.sso_domains_domain_idx;
DROP INDEX IF EXISTS auth.sessions_user_id_idx;
DROP INDEX IF EXISTS auth.sessions_oauth_client_id_idx;
DROP INDEX IF EXISTS auth.sessions_not_after_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_for_email_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_created_at_idx;
DROP INDEX IF EXISTS auth.saml_providers_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_updated_at_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_session_id_revoked_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_parent_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_instance_id_user_id_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_instance_id_idx;
DROP INDEX IF EXISTS auth.recovery_token_idx;
DROP INDEX IF EXISTS auth.reauthentication_token_idx;
DROP INDEX IF EXISTS auth.one_time_tokens_user_id_token_type_key;
DROP INDEX IF EXISTS auth.one_time_tokens_token_hash_hash_idx;
DROP INDEX IF EXISTS auth.one_time_tokens_relates_to_hash_idx;
DROP INDEX IF EXISTS auth.oauth_consents_user_order_idx;
DROP INDEX IF EXISTS auth.oauth_consents_active_user_client_idx;
DROP INDEX IF EXISTS auth.oauth_consents_active_client_idx;
DROP INDEX IF EXISTS auth.oauth_clients_deleted_at_idx;
DROP INDEX IF EXISTS auth.oauth_auth_pending_exp_idx;
DROP INDEX IF EXISTS auth.mfa_factors_user_id_idx;
DROP INDEX IF EXISTS auth.mfa_factors_user_friendly_name_unique;
DROP INDEX IF EXISTS auth.mfa_challenge_created_at_idx;
DROP INDEX IF EXISTS auth.idx_user_id_auth_method;
DROP INDEX IF EXISTS auth.idx_oauth_client_states_created_at;
DROP INDEX IF EXISTS auth.idx_auth_code;
DROP INDEX IF EXISTS auth.identities_user_id_idx;
DROP INDEX IF EXISTS auth.identities_email_idx;
DROP INDEX IF EXISTS auth.flow_state_created_at_idx;
DROP INDEX IF EXISTS auth.factor_id_created_at_idx;
DROP INDEX IF EXISTS auth.email_change_token_new_idx;
DROP INDEX IF EXISTS auth.email_change_token_current_idx;
DROP INDEX IF EXISTS auth.custom_oauth_providers_provider_type_idx;
DROP INDEX IF EXISTS auth.custom_oauth_providers_identifier_idx;
DROP INDEX IF EXISTS auth.custom_oauth_providers_enabled_idx;
DROP INDEX IF EXISTS auth.custom_oauth_providers_created_at_idx;
DROP INDEX IF EXISTS auth.confirmation_token_idx;
DROP INDEX IF EXISTS auth.audit_logs_instance_id_idx;
ALTER TABLE IF EXISTS ONLY supabase_migrations.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY storage.vector_indexes DROP CONSTRAINT IF EXISTS vector_indexes_pkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads DROP CONSTRAINT IF EXISTS s3_multipart_uploads_pkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_pkey;
ALTER TABLE IF EXISTS ONLY storage.objects DROP CONSTRAINT IF EXISTS objects_pkey;
ALTER TABLE IF EXISTS ONLY storage.migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE IF EXISTS ONLY storage.migrations DROP CONSTRAINT IF EXISTS migrations_name_key;
ALTER TABLE IF EXISTS ONLY storage.buckets_vectors DROP CONSTRAINT IF EXISTS buckets_vectors_pkey;
ALTER TABLE IF EXISTS ONLY storage.buckets DROP CONSTRAINT IF EXISTS buckets_pkey;
ALTER TABLE IF EXISTS ONLY storage.buckets_analytics DROP CONSTRAINT IF EXISTS buckets_analytics_pkey;
ALTER TABLE IF EXISTS ONLY realtime.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY realtime.subscription DROP CONSTRAINT IF EXISTS pk_subscription;
ALTER TABLE IF EXISTS ONLY realtime.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS realtime.messages DROP CONSTRAINT IF EXISTS messages_payload_exclusive;
ALTER TABLE IF EXISTS ONLY public.venues DROP CONSTRAINT IF EXISTS venues_pkey;
ALTER TABLE IF EXISTS ONLY public.venues DROP CONSTRAINT IF EXISTS venues_code_key;
ALTER TABLE IF EXISTS ONLY public.submissions DROP CONSTRAINT IF EXISTS submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.state DROP CONSTRAINT IF EXISTS state_venue_id_key;
ALTER TABLE IF EXISTS ONLY public.state DROP CONSTRAINT IF EXISTS state_pkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_pkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_code_key;
ALTER TABLE IF EXISTS ONLY public.match_snapshots DROP CONSTRAINT IF EXISTS match_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.match_snapshots DROP CONSTRAINT IF EXISTS match_snapshots_match_epoch_unique;
ALTER TABLE IF EXISTS ONLY public.judges DROP CONSTRAINT IF EXISTS judges_voice_key_key;
ALTER TABLE IF EXISTS ONLY public.judges DROP CONSTRAINT IF EXISTS judges_pkey;
ALTER TABLE IF EXISTS ONLY public.expected_judges DROP CONSTRAINT IF EXISTS expected_judges_pkey;
ALTER TABLE IF EXISTS ONLY public.event_log DROP CONSTRAINT IF EXISTS event_log_pkey;
ALTER TABLE IF EXISTS ONLY public.access_tokens DROP CONSTRAINT IF EXISTS access_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.webauthn_credentials DROP CONSTRAINT IF EXISTS webauthn_credentials_pkey;
ALTER TABLE IF EXISTS ONLY auth.webauthn_challenges DROP CONSTRAINT IF EXISTS webauthn_challenges_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE IF EXISTS ONLY auth.sso_providers DROP CONSTRAINT IF EXISTS sso_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.sso_domains DROP CONSTRAINT IF EXISTS sso_domains_pkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY auth.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_entity_id_key;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_user_client_unique;
ALTER TABLE IF EXISTS ONLY auth.oauth_consents DROP CONSTRAINT IF EXISTS oauth_consents_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_clients DROP CONSTRAINT IF EXISTS oauth_clients_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_client_states DROP CONSTRAINT IF EXISTS oauth_client_states_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_pkey;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_authorization_id_key;
ALTER TABLE IF EXISTS ONLY auth.oauth_authorizations DROP CONSTRAINT IF EXISTS oauth_authorizations_authorization_code_key;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_last_challenged_at_key;
ALTER TABLE IF EXISTS ONLY auth.mfa_challenges DROP CONSTRAINT IF EXISTS mfa_challenges_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS mfa_amr_claims_session_id_authentication_method_pkey;
ALTER TABLE IF EXISTS ONLY auth.instances DROP CONSTRAINT IF EXISTS instances_pkey;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_provider_id_provider_unique;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_pkey;
ALTER TABLE IF EXISTS ONLY auth.flow_state DROP CONSTRAINT IF EXISTS flow_state_pkey;
ALTER TABLE IF EXISTS ONLY auth.custom_oauth_providers DROP CONSTRAINT IF EXISTS custom_oauth_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.custom_oauth_providers DROP CONSTRAINT IF EXISTS custom_oauth_providers_identifier_key;
ALTER TABLE IF EXISTS ONLY auth.audit_log_entries DROP CONSTRAINT IF EXISTS audit_log_entries_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS amr_id_pk;
ALTER TABLE IF EXISTS public.match_snapshots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.event_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS auth.refresh_tokens ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS supabase_migrations.schema_migrations;
DROP TABLE IF EXISTS storage.vector_indexes;
DROP TABLE IF EXISTS storage.s3_multipart_uploads_parts;
DROP TABLE IF EXISTS storage.s3_multipart_uploads;
DROP TABLE IF EXISTS storage.objects;
DROP TABLE IF EXISTS storage.migrations;
DROP TABLE IF EXISTS storage.buckets_vectors;
DROP TABLE IF EXISTS storage.buckets_analytics;
DROP TABLE IF EXISTS storage.buckets;
DROP TABLE IF EXISTS realtime.subscription;
DROP TABLE IF EXISTS realtime.schema_migrations;
DROP TABLE IF EXISTS realtime.messages;
DROP TABLE IF EXISTS public.venues;
DROP TABLE IF EXISTS public.submissions;
DROP TABLE IF EXISTS public.state;
DROP TABLE IF EXISTS public.matches;
DROP SEQUENCE IF EXISTS public.match_snapshots_id_seq;
DROP TABLE IF EXISTS public.match_snapshots;
DROP TABLE IF EXISTS public.judges;
DROP TABLE IF EXISTS public.expected_judges;
DROP SEQUENCE IF EXISTS public.event_log_id_seq;
DROP TABLE IF EXISTS public.event_log;
DROP TABLE IF EXISTS public.access_tokens;
DROP TABLE IF EXISTS auth.webauthn_credentials;
DROP TABLE IF EXISTS auth.webauthn_challenges;
DROP TABLE IF EXISTS auth.users;
DROP TABLE IF EXISTS auth.sso_providers;
DROP TABLE IF EXISTS auth.sso_domains;
DROP TABLE IF EXISTS auth.sessions;
DROP TABLE IF EXISTS auth.schema_migrations;
DROP TABLE IF EXISTS auth.saml_relay_states;
DROP TABLE IF EXISTS auth.saml_providers;
DROP SEQUENCE IF EXISTS auth.refresh_tokens_id_seq;
DROP TABLE IF EXISTS auth.refresh_tokens;
DROP TABLE IF EXISTS auth.one_time_tokens;
DROP TABLE IF EXISTS auth.oauth_consents;
DROP TABLE IF EXISTS auth.oauth_clients;
DROP TABLE IF EXISTS auth.oauth_client_states;
DROP TABLE IF EXISTS auth.oauth_authorizations;
DROP TABLE IF EXISTS auth.mfa_factors;
DROP TABLE IF EXISTS auth.mfa_challenges;
DROP TABLE IF EXISTS auth.mfa_amr_claims;
DROP TABLE IF EXISTS auth.instances;
DROP TABLE IF EXISTS auth.identities;
DROP TABLE IF EXISTS auth.flow_state;
DROP TABLE IF EXISTS auth.custom_oauth_providers;
DROP TABLE IF EXISTS auth.audit_log_entries;
DROP FUNCTION IF EXISTS storage.update_updated_at_column();
DROP FUNCTION IF EXISTS storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text);
DROP FUNCTION IF EXISTS storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text);
DROP FUNCTION IF EXISTS storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);
DROP FUNCTION IF EXISTS storage.protect_delete();
DROP FUNCTION IF EXISTS storage.operation();
DROP FUNCTION IF EXISTS storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text);
DROP FUNCTION IF EXISTS storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text);
DROP FUNCTION IF EXISTS storage.get_size_by_bucket();
DROP FUNCTION IF EXISTS storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text);
DROP FUNCTION IF EXISTS storage.foldername(name text);
DROP FUNCTION IF EXISTS storage.filename(name text);
DROP FUNCTION IF EXISTS storage.extension(name text);
DROP FUNCTION IF EXISTS storage.enforce_bucket_name_length();
DROP FUNCTION IF EXISTS storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb);
DROP FUNCTION IF EXISTS storage.allow_only_operation(expected_operation text);
DROP FUNCTION IF EXISTS storage.allow_any_operation(expected_operations text[]);
DROP FUNCTION IF EXISTS realtime.wal2json_escape_identifier(name text);
DROP FUNCTION IF EXISTS realtime.topic();
DROP FUNCTION IF EXISTS realtime.to_regrole(role_name text);
DROP FUNCTION IF EXISTS realtime.subscription_check_filters();
DROP FUNCTION IF EXISTS realtime.send_binary(payload bytea, event text, topic text, private boolean);
DROP FUNCTION IF EXISTS realtime.send(payload jsonb, event text, topic text, private boolean);
DROP FUNCTION IF EXISTS realtime.quote_wal2json(entity regclass);
DROP FUNCTION IF EXISTS realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer);
DROP FUNCTION IF EXISTS realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]);
DROP FUNCTION IF EXISTS realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean);
DROP FUNCTION IF EXISTS realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text);
DROP FUNCTION IF EXISTS realtime."cast"(val text, type_ regtype);
DROP FUNCTION IF EXISTS realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]);
DROP FUNCTION IF EXISTS realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text);
DROP FUNCTION IF EXISTS realtime.apply_rls(wal jsonb, max_record_bytes integer);
DROP FUNCTION IF EXISTS pgbouncer.get_auth(p_usename text);
DROP FUNCTION IF EXISTS graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb);
DROP FUNCTION IF EXISTS extensions.set_graphql_placeholder();
DROP FUNCTION IF EXISTS extensions.pgrst_drop_watch();
DROP FUNCTION IF EXISTS extensions.pgrst_ddl_watch();
DROP FUNCTION IF EXISTS extensions.grant_pg_net_access();
DROP FUNCTION IF EXISTS extensions.grant_pg_graphql_access();
DROP FUNCTION IF EXISTS extensions.grant_pg_cron_access();
DROP FUNCTION IF EXISTS auth.uid();
DROP FUNCTION IF EXISTS auth.role();
DROP FUNCTION IF EXISTS auth.jwt();
DROP FUNCTION IF EXISTS auth.email();
DROP TYPE IF EXISTS storage.buckettype;
DROP TYPE IF EXISTS realtime.wal_rls;
DROP TYPE IF EXISTS realtime.wal_column;
DROP TYPE IF EXISTS realtime.user_defined_filter;
DROP TYPE IF EXISTS realtime.equality_op;
DROP TYPE IF EXISTS realtime.action;
DROP TYPE IF EXISTS auth.one_time_token_type;
DROP TYPE IF EXISTS auth.oauth_response_type;
DROP TYPE IF EXISTS auth.oauth_registration_type;
DROP TYPE IF EXISTS auth.oauth_client_type;
DROP TYPE IF EXISTS auth.oauth_authorization_status;
DROP TYPE IF EXISTS auth.factor_type;
DROP TYPE IF EXISTS auth.factor_status;
DROP TYPE IF EXISTS auth.code_challenge_method;
DROP TYPE IF EXISTS auth.aal_level;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS supabase_vault;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS pg_stat_statements;
DROP SCHEMA IF EXISTS vault;
DROP SCHEMA IF EXISTS supabase_migrations;
DROP SCHEMA IF EXISTS storage;
DROP SCHEMA IF EXISTS realtime;
DROP SCHEMA IF EXISTS pgbouncer;
DROP SCHEMA IF EXISTS graphql_public;
DROP SCHEMA IF EXISTS graphql;
DROP SCHEMA IF EXISTS extensions;
DROP SCHEMA IF EXISTS auth;
--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA supabase_migrations;


ALTER SCHEMA supabase_migrations OWNER TO postgres;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


ALTER FUNCTION realtime.wal2json_escape_identifier(name text) OWNER TO supabase_admin;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- Name: access_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access_tokens (
    token text NOT NULL,
    judge_id uuid NOT NULL,
    role text DEFAULT 'judge'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    venue_id uuid NOT NULL
);


ALTER TABLE public.access_tokens OWNER TO postgres;

--
-- Name: event_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_log (
    id bigint NOT NULL,
    event_type text NOT NULL,
    match_id uuid,
    judge_id uuid,
    epoch integer,
    detail jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.event_log OWNER TO postgres;

--
-- Name: event_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_log_id_seq OWNER TO postgres;

--
-- Name: event_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_log_id_seq OWNED BY public.event_log.id;


--
-- Name: expected_judges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expected_judges (
    match_id uuid NOT NULL,
    judge_id uuid NOT NULL,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.expected_judges OWNER TO postgres;

--
-- Name: judges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.judges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    voice_key text
);


ALTER TABLE public.judges OWNER TO postgres;

--
-- Name: match_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_snapshots (
    id bigint NOT NULL,
    match_id uuid NOT NULL,
    epoch integer NOT NULL,
    snapshot jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    github_path text,
    github_pushed_at timestamp with time zone,
    winner text,
    CONSTRAINT match_snapshots_winner_check CHECK ((winner = ANY (ARRAY['red'::text, 'white'::text])))
);


ALTER TABLE public.match_snapshots OWNER TO postgres;

--
-- Name: match_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_snapshots_id_seq OWNER TO postgres;

--
-- Name: match_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_snapshots_id_seq OWNED BY public.match_snapshots.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text,
    name text,
    created_at timestamp with time zone DEFAULT now(),
    red_team_name text,
    white_team_name text,
    num_bouts integer
);


ALTER TABLE public.matches OWNER TO postgres;

--
-- Name: state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.state (
    id integer DEFAULT 1 NOT NULL,
    epoch integer DEFAULT 1 NOT NULL,
    accepting boolean DEFAULT false NOT NULL,
    e3_reached boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    current_match_id uuid,
    scoreboard_visible boolean DEFAULT false,
    red_wins integer DEFAULT 0 NOT NULL,
    white_wins integer DEFAULT 0 NOT NULL,
    wins_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    venue_id uuid NOT NULL
);


ALTER TABLE public.state OWNER TO postgres;

--
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    judge_id uuid NOT NULL,
    epoch integer NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    red_work integer NOT NULL,
    red_app integer NOT NULL,
    red_total integer NOT NULL,
    red_flag boolean NOT NULL,
    white_work integer NOT NULL,
    white_app integer NOT NULL,
    white_total integer NOT NULL,
    white_flag boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- Name: venues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.venues OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


ALTER TABLE supabase_migrations.schema_migrations OWNER TO postgres;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: event_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_log ALTER COLUMN id SET DEFAULT nextval('public.event_log_id_seq'::regclass);


--
-- Name: match_snapshots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_snapshots ALTER COLUMN id SET DEFAULT nextval('public.match_snapshots_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: access_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.access_tokens (token, judge_id, role, created_at, venue_id) FROM stdin;
khb2026-55da8	4cd8c381-ba46-42d8-afff-d557d8f71834	judge	2025-11-16 02:48:39.67903+00	5508a68c-eaf4-4e84-9f7e-8336a195a96c
khb2026-61617	fd23e6be-a987-48a4-b89e-8bec50864cdd	judge	2025-11-25 09:47:19.480781+00	5508a68c-eaf4-4e84-9f7e-8336a195a96c
khb2026-7c4b4	277e5bec-0c15-4362-844f-ce3052497ec3	judge	2025-11-25 08:58:40.010575+00	5508a68c-eaf4-4e84-9f7e-8336a195a96c
khb2026-bb333	f9bc634b-8340-4b67-81e1-23550ef8fff9	judge	2025-11-16 02:48:38.925808+00	5508a68c-eaf4-4e84-9f7e-8336a195a96c
khb2026-d409c	5e8f949d-9ef8-42a9-848e-26246417509d	judge	2025-11-25 09:47:31.18056+00	5508a68c-eaf4-4e84-9f7e-8336a195a96c
khb2026-d6d37	0fabf2a5-eab2-4382-a268-d649464cf5d7	judge	2025-11-25 09:47:25.848003+00	5508a68c-eaf4-4e84-9f7e-8336a195a96c
khb2026-ead18	d8377aee-df86-476a-aab6-f0bf960cf057	judge	2025-11-25 09:47:44.077416+00	5508a68c-eaf4-4e84-9f7e-8336a195a96c
\.


--
-- Data for Name: event_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_log (id, event_type, match_id, judge_id, epoch, detail, created_at) FROM stdin;
242	E5	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"slot": null, "epoch": 1, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "saved_at": "2025-12-15T15:52:10.939Z", "match_code": "khb2026-exam-1", "slot_label": null}	2025-12-15 15:52:11.234312+00
243	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2025-12-15 15:54:06.453064+00
244	SET_MATCH	f493e31b-5acd-4307-b51d-f5f62823c196	\N	3	{"epoch": 3, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "match_code": "khb2026-exam-1"}	2025-12-15 15:55:54.582791+00
245	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2025-12-15 15:58:51.601999+00
246	SET_MATCH	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"epoch": 1, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "match_code": "khb2026-exam-1"}	2025-12-15 15:59:49.269329+00
247	E5	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"slot": null, "epoch": 1, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "saved_at": "2025-12-15T20:15:14.244Z", "match_code": "khb2026-exam-1", "slot_label": null}	2025-12-15 20:15:14.571932+00
248	E5	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"slot": null, "epoch": 1, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "saved_at": "2025-12-15T20:15:31.487Z", "match_code": "khb2026-exam-1", "slot_label": null}	2025-12-15 20:15:31.742326+00
249	E5	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"slot": null, "epoch": 1, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "saved_at": "2025-12-15T20:16:36.082Z", "match_code": "khb2026-exam-1", "slot_label": null}	2025-12-15 20:16:36.361961+00
250	SET_MATCH	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"epoch": 1, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "match_code": "khb2026-exam-1"}	2025-12-15 20:22:50.501517+00
251	E5	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "red_wins": 0, "saved_at": "2025-12-16T07:25:35.007Z", "match_code": "khb2026-exam-1", "slot_label": null, "white_wins": 1}	2025-12-16 07:25:35.411667+00
252	E1	f493e31b-5acd-4307-b51d-f5f62823c196	d8377aee-df86-476a-aab6-f0bf960cf057	1	{"red": {"app": 2, "flag": false, "work": 6, "total": 8}, "white": {"app": 0, "flag": true, "work": 9, "total": 9}, "isEdit": true}	2025-12-16 07:46:47.452877+00
253	E3	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"epoch": 1, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196"}	2025-12-16 07:46:48.024154+00
254	E5	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "red_wins": 0, "saved_at": "2025-12-16T07:48:16.434Z", "match_code": "khb2026-exam-1", "slot_label": null, "white_wins": 1}	2025-12-16 07:48:16.790169+00
255	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2025-12-16 12:11:50.793297+00
256	E1	f493e31b-5acd-4307-b51d-f5f62823c196	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 2, "flag": true, "work": 10, "total": 12}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": false}	2025-12-16 12:13:59.138611+00
257	E2	f493e31b-5acd-4307-b51d-f5f62823c196	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 2, "flag": true, "work": 10, "total": 12}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": true}	2025-12-16 12:21:10.102093+00
258	E1	f493e31b-5acd-4307-b51d-f5f62823c196	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2025-12-16 12:21:58.706897+00
259	E2	f493e31b-5acd-4307-b51d-f5f62823c196	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	{"red": {"app": 1, "flag": true, "work": 6, "total": 7}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": true}	2025-12-16 12:22:14.846012+00
260	E1	f493e31b-5acd-4307-b51d-f5f62823c196	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2025-12-16 12:22:22.220602+00
261	E1	f493e31b-5acd-4307-b51d-f5f62823c196	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 0, "flag": true, "work": 7, "total": 7}, "white": {"app": 2, "flag": false, "work": 5, "total": 7}, "isEdit": false}	2025-12-16 12:24:00.227761+00
262	E1	f493e31b-5acd-4307-b51d-f5f62823c196	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 2, "flag": true, "work": 6, "total": 8}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": false}	2025-12-16 12:24:19.249971+00
263	E1	f493e31b-5acd-4307-b51d-f5f62823c196	d8377aee-df86-476a-aab6-f0bf960cf057	2	{"red": {"app": 0, "flag": false, "work": 5, "total": 5}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2025-12-16 12:24:42.827488+00
264	E2	f493e31b-5acd-4307-b51d-f5f62823c196	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 2, "flag": true, "work": 5, "total": 7}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": true}	2025-12-16 12:26:26.282057+00
265	E1	f493e31b-5acd-4307-b51d-f5f62823c196	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 2, "flag": true, "work": 10, "total": 12}, "white": {"app": 0, "flag": false, "work": 10, "total": 10}, "isEdit": false}	2025-12-16 12:27:42.870724+00
266	E3	f493e31b-5acd-4307-b51d-f5f62823c196	\N	2	{"epoch": 2, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196"}	2025-12-16 12:27:43.424244+00
267	E2	f493e31b-5acd-4307-b51d-f5f62823c196	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 1, "flag": false, "work": 6, "total": 7}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": true}	2025-12-16 12:31:19.813315+00
268	SET_MATCH	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"epoch": 1, "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "match_code": "khb2026-exam2-1"}	2025-12-16 12:33:08.29806+00
269	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": false, "work": 5, "total": 6}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": false}	2025-12-16 12:34:11.126429+00
270	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 2, "flag": true, "work": 9, "total": 11}, "isEdit": false}	2025-12-16 12:34:43.420238+00
271	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": true, "work": 10, "total": 10}, "white": {"app": 2, "flag": false, "work": 6, "total": 8}, "isEdit": false}	2025-12-16 12:34:46.056761+00
272	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": false, "work": 6, "total": 7}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": true}	2025-12-16 12:34:51.619574+00
273	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 0, "flag": false, "work": 5, "total": 5}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2025-12-16 12:35:26.361085+00
542	E3	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	3	{"epoch": 3, "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859"}	2026-01-04 06:26:38.981072+00
274	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": true}	2025-12-16 12:36:10.548234+00
275	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 2, "flag": false, "work": 4, "total": 6}, "white": {"app": 0, "flag": true, "work": 7, "total": 7}, "isEdit": true}	2025-12-16 12:36:14.658679+00
276	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": false, "work": 6, "total": 7}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": true}	2025-12-16 12:36:44.001208+00
277	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": false, "work": 6, "total": 7}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": true}	2025-12-16 12:40:55.071547+00
278	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": false, "work": 6, "total": 7}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": true}	2025-12-16 12:41:22.07647+00
283	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 0, "flag": false, "work": 9, "total": 9}, "white": {"app": 1, "flag": true, "work": 10, "total": 11}, "isEdit": false}	2025-12-16 12:48:25.760752+00
284	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 2, "flag": true, "work": 8, "total": 10}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": false}	2025-12-16 12:48:31.595997+00
285	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 2, "flag": true, "work": 10, "total": 12}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": false}	2025-12-16 12:48:39.804304+00
287	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	{"red": {"app": 1, "flag": true, "work": 6, "total": 7}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": false}	2025-12-16 12:48:42.284481+00
279	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 2, "flag": true, "work": 8, "total": 10}, "white": {"app": 0, "flag": false, "work": 6, "total": 6}, "isEdit": false}	2025-12-16 12:42:56.22123+00
280	E3	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"epoch": 1, "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc"}	2025-12-16 12:42:56.756056+00
281	E5	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "red_wins": 0, "saved_at": "2025-12-16T12:47:45.041Z", "match_code": "khb2026-exam2-1", "slot_label": null, "white_wins": 1}	2025-12-16 12:47:45.40453+00
282	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2025-12-16 12:48:11.25335+00
286	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 0, "flag": true, "work": 7, "total": 7}, "white": {"app": 2, "flag": false, "work": 5, "total": 7}, "isEdit": false}	2025-12-16 12:48:41.302535+00
288	E3	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	2	{"epoch": 2, "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc"}	2025-12-16 12:48:42.81966+00
289	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 2, "flag": true, "work": 8, "total": 10}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": true}	2025-12-16 12:51:08.198389+00
290	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 2, "flag": true, "work": 8, "total": 10}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": true}	2025-12-16 12:51:11.431805+00
291	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 2, "flag": false, "work": 5, "total": 7}, "isEdit": true}	2025-12-16 12:51:19.598463+00
292	E5	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	2	{"slot": null, "epoch": 2, "winner": "red", "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "red_wins": 1, "saved_at": "2025-12-16T12:51:47.819Z", "match_code": "khb2026-exam2-1", "slot_label": null, "white_wins": 1}	2025-12-16 12:51:48.143715+00
293	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2025-12-16 12:54:16.430996+00
294	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 2, "flag": true, "work": 6, "total": 8}, "isEdit": false}	2025-12-16 12:54:39.375721+00
295	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 2, "flag": true, "work": 9, "total": 11}, "white": {"app": 0, "flag": false, "work": 10, "total": 10}, "isEdit": false}	2025-12-16 12:54:44.725838+00
296	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	f9bc634b-8340-4b67-81e1-23550ef8fff9	3	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2025-12-16 12:54:54.061248+00
297	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 6, "total": 6}, "isEdit": true}	2025-12-16 12:55:03.200025+00
298	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 2, "flag": false, "work": 6, "total": 8}, "white": {"app": 0, "flag": true, "work": 9, "total": 9}, "isEdit": false}	2025-12-16 12:55:05.337911+00
299	E2	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 2, "flag": true, "work": 9, "total": 11}, "white": {"app": 0, "flag": false, "work": 10, "total": 10}, "isEdit": true}	2025-12-16 12:55:12.662186+00
300	E1	ab21ec4e-8d97-41e9-b133-606c854129fc	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 1, "flag": false, "work": 5, "total": 6}, "white": {"app": 0, "flag": true, "work": 7, "total": 7}, "isEdit": false}	2025-12-16 12:56:48.926353+00
301	E3	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	3	{"epoch": 3, "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc"}	2025-12-16 12:56:49.439815+00
302	E5	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "red_wins": 1, "saved_at": "2025-12-16T12:57:03.182Z", "match_code": "khb2026-exam2-1", "slot_label": null, "white_wins": 2}	2025-12-16 12:57:03.529977+00
303	SET_MATCH	8d933b7c-771c-4447-8624-eda6b48e829a	\N	1	{"epoch": 1, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "match_code": "khb2026-exam2-2"}	2025-12-16 13:01:08.453563+00
304	E1	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": false}	2025-12-16 13:08:10.528919+00
305	E1	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	{"red": {"app": 2, "flag": true, "work": 9, "total": 11}, "white": {"app": 0, "flag": false, "work": 10, "total": 10}, "isEdit": false}	2025-12-16 13:08:17.282968+00
306	E1	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 6, "total": 6}, "isEdit": false}	2025-12-16 13:08:19.453594+00
307	E1	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 0, "flag": false, "work": 6, "total": 6}, "white": {"app": 2, "flag": true, "work": 8, "total": 10}, "isEdit": false}	2025-12-16 13:08:24.316854+00
308	E1	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": true, "work": 10, "total": 10}, "white": {"app": 1, "flag": false, "work": 8, "total": 9}, "isEdit": false}	2025-12-16 13:08:32.687012+00
309	E3	8d933b7c-771c-4447-8624-eda6b48e829a	\N	1	{"epoch": 1, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a"}	2025-12-16 13:08:33.200409+00
310	E2	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 0, "flag": true, "work": 7, "total": 7}, "white": {"app": 1, "flag": false, "work": 6, "total": 7}, "isEdit": true}	2025-12-16 13:09:23.841278+00
311	E5	8d933b7c-771c-4447-8624-eda6b48e829a	\N	1	{"slot": null, "epoch": 1, "winner": "red", "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "red_wins": 1, "saved_at": "2025-12-16T13:09:44.408Z", "match_code": "khb2026-exam2-2", "slot_label": null, "white_wins": 0}	2025-12-16 13:09:44.760538+00
312	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2025-12-16 13:14:43.605806+00
313	SET_MATCH	8d933b7c-771c-4447-8624-eda6b48e829a	\N	3	{"epoch": 3, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "match_code": "khb2026-exam2-2"}	2025-12-16 13:14:51.895108+00
314	E1	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	3	{"red": {"app": 1, "flag": false, "work": 5, "total": 6}, "white": {"app": 0, "flag": true, "work": 6, "total": 6}, "isEdit": false}	2025-12-16 13:15:03.028907+00
315	E1	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 1, "flag": true, "work": 10, "total": 11}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": false}	2025-12-16 13:15:07.860371+00
317	E1	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 2, "flag": true, "work": 7, "total": 9}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": false}	2025-12-16 13:15:28.663751+00
318	SET_MATCH	8d933b7c-771c-4447-8624-eda6b48e829a	\N	2	{"epoch": 2, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "match_code": "khb2026-exam2-2"}	2025-12-16 13:15:39.123011+00
319	E1	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	{"red": {"app": 1, "flag": false, "work": 5, "total": 6}, "white": {"app": 0, "flag": true, "work": 6, "total": 6}, "isEdit": false}	2025-12-16 13:16:00.069448+00
321	E1	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 0, "flag": true, "work": 9, "total": 9}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2025-12-16 13:16:07.696546+00
322	E1	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 2, "flag": true, "work": 8, "total": 10}, "white": {"app": 0, "flag": false, "work": 6, "total": 6}, "isEdit": false}	2025-12-16 13:16:19.386658+00
326	E5	8d933b7c-771c-4447-8624-eda6b48e829a	\N	2	{"slot": null, "epoch": 2, "winner": "red", "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "red_wins": 2, "saved_at": "2025-12-16T13:18:44.887Z", "match_code": "khb2026-exam2-2", "slot_label": null, "white_wins": 0}	2025-12-16 13:18:45.252516+00
340	E1	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	4	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": false}	2025-12-16 13:26:42.190243+00
341	E1	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	4	{"red": {"app": 2, "flag": true, "work": 8, "total": 10}, "white": {"app": 0, "flag": false, "work": 6, "total": 6}, "isEdit": false}	2025-12-16 13:27:27.753545+00
345	E1	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	5	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 2, "flag": true, "work": 9, "total": 11}, "isEdit": false}	2025-12-16 13:31:53.472818+00
316	E1	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 0, "flag": false, "work": 5, "total": 5}, "white": {"app": 2, "flag": true, "work": 10, "total": 12}, "isEdit": false}	2025-12-16 13:15:19.105102+00
320	E1	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 1, "flag": true, "work": 10, "total": 11}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": false}	2025-12-16 13:16:07.13524+00
323	E1	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": false}	2025-12-16 13:17:10.330748+00
324	E3	8d933b7c-771c-4447-8624-eda6b48e829a	\N	2	{"epoch": 2, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a"}	2025-12-16 13:17:10.874689+00
325	E2	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 2, "flag": true, "work": 7, "total": 9}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": true}	2025-12-16 13:18:11.73996+00
327	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2025-12-16 13:20:18.780692+00
328	E1	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 2, "flag": false, "work": 6, "total": 8}, "white": {"app": 0, "flag": true, "work": 10, "total": 10}, "isEdit": false}	2025-12-16 13:20:41.155646+00
329	E3	8d933b7c-771c-4447-8624-eda6b48e829a	\N	3	{"epoch": 3, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a"}	2025-12-16 13:20:41.71223+00
334	E2	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": true}	2025-12-16 13:23:22.732655+00
335	E5	8d933b7c-771c-4447-8624-eda6b48e829a	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "red_wins": 2, "saved_at": "2025-12-16T13:24:24.481Z", "match_code": "khb2026-exam2-2", "slot_label": null, "white_wins": 1}	2025-12-16 13:24:24.849871+00
336	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2025-12-16 13:26:02.903232+00
338	E1	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	4	{"red": {"app": 1, "flag": false, "work": 5, "total": 6}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": false}	2025-12-16 13:26:20.922755+00
339	E1	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	4	{"red": {"app": 2, "flag": true, "work": 7, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": false}	2025-12-16 13:26:29.855792+00
342	E3	8d933b7c-771c-4447-8624-eda6b48e829a	\N	4	{"epoch": 4, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a"}	2025-12-16 13:27:28.331259+00
344	E6	\N	\N	5	{"to_epoch": 5, "from_epoch": 4}	2025-12-16 13:31:33.125965+00
346	E1	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	5	{"red": {"app": 0, "flag": false, "work": 6, "total": 6}, "white": {"app": 1, "flag": true, "work": 9, "total": 10}, "isEdit": false}	2025-12-16 13:31:55.242096+00
347	E1	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	5	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 2, "flag": true, "work": 7, "total": 9}, "isEdit": false}	2025-12-16 13:32:03.082958+00
330	E2	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	3	{"red": {"app": 0, "flag": true, "work": 10, "total": 10}, "white": {"app": 2, "flag": false, "work": 7, "total": 9}, "isEdit": true}	2025-12-16 13:21:02.91394+00
331	E2	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 0, "flag": false, "work": 5, "total": 5}, "white": {"app": 2, "flag": true, "work": 7, "total": 9}, "isEdit": true}	2025-12-16 13:21:12.734722+00
332	E2	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": true}	2025-12-16 13:23:07.88856+00
333	E2	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": true}	2025-12-16 13:23:12.742127+00
337	E1	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	4	{"red": {"app": 0, "flag": true, "work": 10, "total": 10}, "white": {"app": 1, "flag": false, "work": 6, "total": 7}, "isEdit": false}	2025-12-16 13:26:19.742835+00
343	E5	8d933b7c-771c-4447-8624-eda6b48e829a	\N	4	{"slot": null, "epoch": 4, "winner": "red", "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "red_wins": 3, "saved_at": "2025-12-16T13:29:04.904Z", "match_code": "khb2026-exam2-2", "slot_label": null, "white_wins": 1}	2025-12-16 13:29:05.274733+00
348	E1	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	5	{"red": {"app": 0, "flag": false, "work": 6, "total": 6}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2025-12-16 13:32:06.717706+00
349	E1	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	5	{"red": {"app": 0, "flag": false, "work": 9, "total": 9}, "white": {"app": 1, "flag": true, "work": 9, "total": 10}, "isEdit": false}	2025-12-16 13:34:03.89867+00
350	E3	8d933b7c-771c-4447-8624-eda6b48e829a	\N	5	{"epoch": 5, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a"}	2025-12-16 13:34:04.497616+00
351	E5	8d933b7c-771c-4447-8624-eda6b48e829a	\N	5	{"slot": null, "epoch": 5, "winner": "white", "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "red_wins": 3, "saved_at": "2025-12-16T13:37:57.094Z", "match_code": "khb2026-exam2-2", "slot_label": null, "white_wins": 2}	2025-12-16 13:37:57.459964+00
352	E5	8d933b7c-771c-4447-8624-eda6b48e829a	\N	5	{"slot": null, "epoch": 5, "winner": "white", "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "red_wins": 3, "saved_at": "2025-12-16T13:38:19.173Z", "match_code": "khb2026-exam2-2", "slot_label": null, "white_wins": 2}	2025-12-16 13:38:19.548164+00
353	SET_MATCH	f493e31b-5acd-4307-b51d-f5f62823c196	\N	1	{"epoch": 1, "match_id": "f493e31b-5acd-4307-b51d-f5f62823c196", "match_code": "khb2026-exam-1"}	2025-12-20 06:49:32.084236+00
354	SET_MATCH	cf263988-bb8f-4610-befc-5bb144e17202	\N	1	{"epoch": 1, "match_id": "cf263988-bb8f-4610-befc-5bb144e17202", "match_code": "khb2026-exam3-1"}	2025-12-20 08:00:00.982929+00
355	E1	cf263988-bb8f-4610-befc-5bb144e17202	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 0, "flag": true, "work": 10, "total": 10}, "white": {"app": 1, "flag": false, "work": 9, "total": 10}, "isEdit": false}	2025-12-20 08:12:13.573043+00
356	E3	cf263988-bb8f-4610-befc-5bb144e17202	\N	1	{"epoch": 1, "match_id": "cf263988-bb8f-4610-befc-5bb144e17202"}	2025-12-20 08:12:14.151267+00
357	E5	cf263988-bb8f-4610-befc-5bb144e17202	\N	1	{"slot": null, "epoch": 1, "winner": "red", "match_id": "cf263988-bb8f-4610-befc-5bb144e17202", "red_wins": 1, "saved_at": "2025-12-20T08:12:34.955Z", "match_code": "khb2026-exam3-1", "slot_label": null, "white_wins": 0}	2025-12-20 08:12:35.344465+00
358	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2025-12-20 08:13:14.571501+00
359	E1	cf263988-bb8f-4610-befc-5bb144e17202	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 0, "flag": true, "work": 7, "total": 7}, "white": {"app": 2, "flag": false, "work": 5, "total": 7}, "isEdit": false}	2025-12-20 08:14:47.178644+00
360	E3	cf263988-bb8f-4610-befc-5bb144e17202	\N	2	{"epoch": 2, "match_id": "cf263988-bb8f-4610-befc-5bb144e17202"}	2025-12-20 08:14:47.773099+00
361	E5	cf263988-bb8f-4610-befc-5bb144e17202	\N	2	{"slot": null, "epoch": 2, "winner": "red", "match_id": "cf263988-bb8f-4610-befc-5bb144e17202", "red_wins": 2, "saved_at": "2025-12-20T08:15:05.516Z", "match_code": "khb2026-exam3-1", "slot_label": null, "white_wins": 0}	2025-12-20 08:15:05.997529+00
362	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2025-12-20 08:15:54.904491+00
363	E1	cf263988-bb8f-4610-befc-5bb144e17202	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 0, "flag": false, "work": 10, "total": 10}, "white": {"app": 2, "flag": true, "work": 10, "total": 12}, "isEdit": false}	2025-12-20 08:17:33.005301+00
364	E3	cf263988-bb8f-4610-befc-5bb144e17202	\N	3	{"epoch": 3, "match_id": "cf263988-bb8f-4610-befc-5bb144e17202"}	2025-12-20 08:17:33.51708+00
365	E5	cf263988-bb8f-4610-befc-5bb144e17202	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "cf263988-bb8f-4610-befc-5bb144e17202", "red_wins": 2, "saved_at": "2025-12-20T08:17:49.403Z", "match_code": "khb2026-exam3-1", "slot_label": null, "white_wins": 1}	2025-12-20 08:17:49.78524+00
366	SET_MATCH	cf263988-bb8f-4610-befc-5bb144e17202	\N	3	{"epoch": 3, "match_id": "cf263988-bb8f-4610-befc-5bb144e17202", "match_code": "khb2026-exam3-1"}	2025-12-24 21:54:04.257154+00
367	E5	cf263988-bb8f-4610-befc-5bb144e17202	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "cf263988-bb8f-4610-befc-5bb144e17202", "red_wins": 2, "saved_at": "2025-12-24T21:54:06.948Z", "match_code": "khb2026-exam3-1", "slot_label": null, "white_wins": 1}	2025-12-24 21:54:07.33857+00
368	E5	cf263988-bb8f-4610-befc-5bb144e17202	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "cf263988-bb8f-4610-befc-5bb144e17202", "red_wins": 2, "saved_at": "2025-12-24T21:58:47.222Z", "match_code": "khb2026-exam3-1", "slot_label": null, "white_wins": 1}	2025-12-24 21:58:47.629239+00
369	E5	cf263988-bb8f-4610-befc-5bb144e17202	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "cf263988-bb8f-4610-befc-5bb144e17202", "red_wins": 2, "saved_at": "2025-12-24T21:58:52.500Z", "match_code": "khb2026-exam3-1", "slot_label": null, "white_wins": 1}	2025-12-24 21:58:52.862887+00
370	SET_MATCH	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"epoch": 1, "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "match_code": "khb2026-exam2-1"}	2025-12-24 22:03:51.196515+00
371	E5	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "red_wins": 1, "saved_at": "2025-12-24T22:03:54.705Z", "match_code": "khb2026-exam2-1", "slot_label": null, "white_wins": 2}	2025-12-24 22:03:55.092384+00
372	E5	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "red_wins": 1, "saved_at": "2025-12-24T22:04:00.248Z", "match_code": "khb2026-exam2-1", "slot_label": null, "white_wins": 2}	2025-12-24 22:04:00.617164+00
373	E5	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "red_wins": 1, "saved_at": "2025-12-24T22:04:05.214Z", "match_code": "khb2026-exam2-1", "slot_label": null, "white_wins": 2}	2025-12-24 22:04:05.60093+00
374	E5	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "red_wins": 1, "saved_at": "2025-12-24T22:05:40.919Z", "match_code": "khb2026-exam2-1", "slot_label": null, "white_wins": 2}	2025-12-24 22:05:41.286511+00
375	E5	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "red_wins": 1, "saved_at": "2025-12-24T22:05:45.757Z", "match_code": "khb2026-exam2-1", "slot_label": null, "white_wins": 2}	2025-12-24 22:05:46.153926+00
376	SET_MATCH	8d933b7c-771c-4447-8624-eda6b48e829a	\N	1	{"epoch": 1, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "match_code": "khb2026-exam2-2"}	2026-01-03 16:18:39.162337+00
377	SET_MATCH	8d933b7c-771c-4447-8624-eda6b48e829a	\N	1	{"epoch": 1, "match_id": "8d933b7c-771c-4447-8624-eda6b48e829a", "match_code": "khb2026-exam2-2"}	2026-01-03 16:24:42.754849+00
378	SET_MATCH	ab21ec4e-8d97-41e9-b133-606c854129fc	\N	1	{"epoch": 1, "match_id": "ab21ec4e-8d97-41e9-b133-606c854129fc", "match_code": "khb2026-exam2-1"}	2026-01-03 16:24:56.588003+00
379	SET_MATCH	f063db48-65e5-4a4e-b05a-f7649b35d3a5	\N	1	{"epoch": 1, "match_id": "f063db48-65e5-4a4e-b05a-f7649b35d3a5", "match_code": "khb2026-0"}	2026-01-03 19:03:08.148807+00
380	E1	f063db48-65e5-4a4e-b05a-f7649b35d3a5	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": false, "work": 9, "total": 9}, "white": {"app": 1, "flag": true, "work": 9, "total": 10}, "isEdit": false}	2026-01-04 01:11:01.524056+00
381	E1	f063db48-65e5-4a4e-b05a-f7649b35d3a5	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 01:11:09.264283+00
382	E1	f063db48-65e5-4a4e-b05a-f7649b35d3a5	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 01:11:09.538155+00
383	E1	f063db48-65e5-4a4e-b05a-f7649b35d3a5	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 1, "flag": true, "work": 10, "total": 11}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": false}	2026-01-04 01:11:23.186935+00
384	E2	f063db48-65e5-4a4e-b05a-f7649b35d3a5	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 5, "total": 5}, "isEdit": true}	2026-01-04 01:11:51.608987+00
385	E1	f063db48-65e5-4a4e-b05a-f7649b35d3a5	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 01:11:57.044683+00
386	E2	f063db48-65e5-4a4e-b05a-f7649b35d3a5	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": true}	2026-01-04 01:12:27.173176+00
387	E2	f063db48-65e5-4a4e-b05a-f7649b35d3a5	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	{"red": {"app": 0, "flag": true, "work": 9, "total": 9}, "white": {"app": 2, "flag": false, "work": 7, "total": 9}, "isEdit": true}	2026-01-04 01:32:47.497236+00
388	E2	f063db48-65e5-4a4e-b05a-f7649b35d3a5	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	{"red": {"app": 0, "flag": false, "work": 9, "total": 9}, "white": {"app": 2, "flag": true, "work": 8, "total": 10}, "isEdit": true}	2026-01-04 01:32:53.711293+00
389	E2	f063db48-65e5-4a4e-b05a-f7649b35d3a5	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": true}	2026-01-04 01:35:20.749278+00
390	SET_MATCH	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	\N	1	{"epoch": 1, "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "match_code": "khb2026-1"}	2026-01-04 01:42:32.21954+00
391	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:07:59.948356+00
392	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:08:06.096904+00
393	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:08:07.23012+00
394	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 1, "flag": false, "work": 7, "total": 8}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 02:08:11.175647+00
395	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 0, "flag": true, "work": 9, "total": 9}, "white": {"app": 1, "flag": false, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 02:08:29.768013+00
396	E2	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": true}	2026-01-04 02:08:49.256933+00
397	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:09:01.157021+00
398	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	d8377aee-df86-476a-aab6-f0bf960cf057	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:09:29.060672+00
399	E3	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	\N	1	{"epoch": 1, "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a"}	2026-01-04 02:09:29.61092+00
400	E5	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	\N	1	{"slot": null, "epoch": 1, "winner": "red", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "red_wins": 1, "saved_at": "2026-01-04T02:09:49.259Z", "match_code": "khb2026-1", "slot_label": null, "white_wins": 0}	2026-01-04 02:09:49.687808+00
401	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2026-01-04 02:13:20.939228+00
402	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:20:15.800014+00
544	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2026-01-04 06:30:24.477136+00
403	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 9, "total": 10}, "isEdit": false}	2026-01-04 02:20:19.309139+00
406	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:20:41.438544+00
409	E3	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	\N	2	{"epoch": 2, "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a"}	2026-01-04 02:21:08.088782+00
404	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:20:22.263325+00
405	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:20:24.308689+00
407	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:20:55.503901+00
408	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	d8377aee-df86-476a-aab6-f0bf960cf057	2	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:21:07.618159+00
410	E5	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	\N	2	{"slot": null, "epoch": 2, "winner": "red", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "red_wins": 2, "saved_at": "2026-01-04T02:21:34.521Z", "match_code": "khb2026-1", "slot_label": null, "white_wins": 0}	2026-01-04 02:21:34.86255+00
411	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2026-01-04 02:24:25.372237+00
412	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	f9bc634b-8340-4b67-81e1-23550ef8fff9	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:29:14.946244+00
413	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:29:18.55005+00
414	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:31:30.71917+00
415	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:31:37.37268+00
416	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:31:45.381491+00
417	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	5e8f949d-9ef8-42a9-848e-26246417509d	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:31:55.251455+00
418	E1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	d8377aee-df86-476a-aab6-f0bf960cf057	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:32:08.082117+00
419	E3	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	\N	3	{"epoch": 3, "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a"}	2026-01-04 02:32:08.620794+00
420	E5	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	\N	3	{"slot": null, "epoch": 3, "winner": "red", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "red_wins": 3, "saved_at": "2026-01-04T02:32:26.445Z", "match_code": "khb2026-1", "slot_label": null, "white_wins": 0}	2026-01-04 02:32:26.838019+00
421	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2026-01-04 02:36:08.082626+00
422	SET_MATCH	34fa2107-5761-4004-978a-b6cad952ccee	\N	1	{"epoch": 1, "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "match_code": "khb2026-2"}	2026-01-04 02:45:40.825587+00
423	E1	34fa2107-5761-4004-978a-b6cad952ccee	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:55:32.091097+00
424	E1	34fa2107-5761-4004-978a-b6cad952ccee	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:55:32.18189+00
425	E1	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 02:55:36.29305+00
426	E2	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": true}	2026-01-04 02:55:52.433885+00
427	E1	34fa2107-5761-4004-978a-b6cad952ccee	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 02:55:52.762625+00
428	E2	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": true}	2026-01-04 02:55:59.620562+00
429	E1	34fa2107-5761-4004-978a-b6cad952ccee	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 02:56:04.290549+00
430	E1	34fa2107-5761-4004-978a-b6cad952ccee	d8377aee-df86-476a-aab6-f0bf960cf057	1	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 02:56:21.871232+00
431	E3	34fa2107-5761-4004-978a-b6cad952ccee	\N	1	{"epoch": 1, "match_id": "34fa2107-5761-4004-978a-b6cad952ccee"}	2026-01-04 02:56:22.3919+00
432	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2026-01-04 03:02:29.185228+00
433	E1	34fa2107-5761-4004-978a-b6cad952ccee	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 03:09:43.483876+00
434	E1	34fa2107-5761-4004-978a-b6cad952ccee	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 1, "flag": false, "work": 7, "total": 8}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 03:09:49.375795+00
435	E1	34fa2107-5761-4004-978a-b6cad952ccee	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 03:09:52.543785+00
436	E1	34fa2107-5761-4004-978a-b6cad952ccee	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:10:04.649444+00
437	E1	34fa2107-5761-4004-978a-b6cad952ccee	d8377aee-df86-476a-aab6-f0bf960cf057	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 03:10:21.566918+00
438	E1	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 9, "total": 10}, "isEdit": false}	2026-01-04 03:11:06.219536+00
439	E3	34fa2107-5761-4004-978a-b6cad952ccee	\N	2	{"epoch": 2, "match_id": "34fa2107-5761-4004-978a-b6cad952ccee"}	2026-01-04 03:11:06.757755+00
440	E5	34fa2107-5761-4004-978a-b6cad952ccee	\N	2	{"slot": null, "epoch": 2, "winner": "white", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "red_wins": 0, "saved_at": "2026-01-04T03:11:28.287Z", "match_code": "khb2026-2", "slot_label": null, "white_wins": 1}	2026-01-04 03:11:28.71086+00
441	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2026-01-04 03:17:20.094218+00
442	E1	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 03:23:39.781751+00
443	E2	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": true}	2026-01-04 03:24:06.324175+00
444	E1	34fa2107-5761-4004-978a-b6cad952ccee	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:24:18.52849+00
445	E1	34fa2107-5761-4004-978a-b6cad952ccee	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 03:24:18.88138+00
446	E2	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": true}	2026-01-04 03:24:27.650254+00
447	E1	34fa2107-5761-4004-978a-b6cad952ccee	5e8f949d-9ef8-42a9-848e-26246417509d	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 03:24:29.766507+00
448	E1	34fa2107-5761-4004-978a-b6cad952ccee	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 03:24:37.567411+00
449	E1	34fa2107-5761-4004-978a-b6cad952ccee	d8377aee-df86-476a-aab6-f0bf960cf057	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:25:01.25245+00
450	E3	34fa2107-5761-4004-978a-b6cad952ccee	\N	3	{"epoch": 3, "match_id": "34fa2107-5761-4004-978a-b6cad952ccee"}	2026-01-04 03:25:01.747604+00
451	E5	34fa2107-5761-4004-978a-b6cad952ccee	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "red_wins": 0, "saved_at": "2026-01-04T03:25:20.592Z", "match_code": "khb2026-2", "slot_label": null, "white_wins": 2}	2026-01-04 03:25:21.033423+00
452	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2026-01-04 03:30:00.237719+00
453	SET_MATCH	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	\N	1	{"epoch": 1, "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "match_code": "khb2026-3"}	2026-01-04 03:30:59.459144+00
454	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:47:38.568587+00
455	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:47:39.24168+00
456	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:47:45.703387+00
457	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:47:58.797028+00
458	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:48:01.095531+00
459	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	d8377aee-df86-476a-aab6-f0bf960cf057	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:48:21.873963+00
460	E3	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	\N	1	{"epoch": 1, "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e"}	2026-01-04 03:48:22.371583+00
461	E5	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	\N	1	{"slot": null, "epoch": 1, "winner": "red", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "red_wins": 1, "saved_at": "2026-01-04T03:48:39.055Z", "match_code": "khb2026-3", "slot_label": null, "white_wins": 0}	2026-01-04 03:48:39.426948+00
462	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2026-01-04 03:51:50.783346+00
463	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:58:52.657098+00
464	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:58:59.384513+00
465	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:59:08.99938+00
466	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:59:10.158348+00
467	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 03:59:12.406523+00
468	E2	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": true}	2026-01-04 03:59:23.650049+00
469	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	d8377aee-df86-476a-aab6-f0bf960cf057	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 04:00:00.059221+00
470	E3	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	\N	2	{"epoch": 2, "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e"}	2026-01-04 04:00:00.783674+00
472	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2026-01-04 04:03:32.809271+00
471	E5	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	\N	2	{"slot": null, "epoch": 2, "winner": "red", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "red_wins": 2, "saved_at": "2026-01-04T04:00:22.055Z", "match_code": "khb2026-3", "slot_label": null, "white_wins": 0}	2026-01-04 04:00:22.448854+00
473	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 04:12:02.636274+00
474	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 04:12:03.088246+00
475	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 04:12:06.843242+00
476	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	5e8f949d-9ef8-42a9-848e-26246417509d	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 04:12:16.531823+00
477	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 04:12:37.895687+00
478	E1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	d8377aee-df86-476a-aab6-f0bf960cf057	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 04:12:52.271074+00
479	E3	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	\N	3	{"epoch": 3, "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e"}	2026-01-04 04:12:52.827455+00
480	E5	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	\N	3	{"slot": null, "epoch": 3, "winner": "red", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "red_wins": 3, "saved_at": "2026-01-04T04:13:08.734Z", "match_code": "khb2026-3", "slot_label": null, "white_wins": 0}	2026-01-04 04:13:09.113342+00
481	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2026-01-04 04:16:30.199614+00
482	SET_MATCH	e0e9792e-26e5-4137-9f07-b96fba55dafa	\N	1	{"epoch": 1, "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "match_code": "khb2026-4"}	2026-01-04 04:45:33.35782+00
483	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 05:21:31.882608+00
484	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 05:21:34.452639+00
485	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 05:21:36.325004+00
486	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 05:21:44.135675+00
487	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 05:22:39.61641+00
488	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	d8377aee-df86-476a-aab6-f0bf960cf057	1	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 05:23:02.253769+00
489	E3	e0e9792e-26e5-4137-9f07-b96fba55dafa	\N	1	{"epoch": 1, "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa"}	2026-01-04 05:23:02.780223+00
490	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2026-01-04 05:25:56.801738+00
491	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 05:32:21.269746+00
492	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 1, "flag": false, "work": 6, "total": 7}, "white": {"app": 0, "flag": true, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 05:32:54.159033+00
493	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 05:32:56.410702+00
494	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 05:33:12.305091+00
495	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 05:33:18.853611+00
496	E2	e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": true}	2026-01-04 05:33:23.372667+00
497	E2	e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": true}	2026-01-04 05:33:32.759664+00
498	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	d8377aee-df86-476a-aab6-f0bf960cf057	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 05:33:33.292393+00
499	E3	e0e9792e-26e5-4137-9f07-b96fba55dafa	\N	2	{"epoch": 2, "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa"}	2026-01-04 05:33:33.870776+00
500	E2	e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": true}	2026-01-04 05:33:36.682261+00
501	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2026-01-04 05:37:54.779425+00
502	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 05:41:53.99211+00
503	E2	e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": true}	2026-01-04 05:44:59.744667+00
511	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2026-01-04 05:49:38.667105+00
504	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 05:45:05.003995+00
505	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 05:45:09.598617+00
507	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 05:45:34.885954+00
508	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	d8377aee-df86-476a-aab6-f0bf960cf057	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 05:45:55.294091+00
506	E1	e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	3	{"red": {"app": 1, "flag": false, "work": 7, "total": 8}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 05:45:25.631274+00
509	E3	e0e9792e-26e5-4137-9f07-b96fba55dafa	\N	3	{"epoch": 3, "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa"}	2026-01-04 05:45:55.808241+00
510	E5	e0e9792e-26e5-4137-9f07-b96fba55dafa	\N	3	{"slot": null, "epoch": 3, "winner": "red", "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "red_wins": 1, "saved_at": "2026-01-04T05:46:12.613Z", "match_code": "khb2026-4", "slot_label": null, "white_wins": 0}	2026-01-04 05:46:13.030064+00
512	SET_MATCH	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	1	{"epoch": 1, "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "match_code": "khb2026-5"}	2026-01-04 05:53:51.709098+00
513	SET_MATCH	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	1	{"epoch": 1, "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "match_code": "khb2026-5"}	2026-01-04 05:54:13.740753+00
514	SET_MATCH	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	1	{"epoch": 1, "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "match_code": "khb2026-5"}	2026-01-04 05:54:13.813519+00
515	SET_MATCH	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	1	{"epoch": 1, "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "match_code": "khb2026-5"}	2026-01-04 05:54:13.985821+00
516	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:01:41.251796+00
517	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:01:41.654235+00
518	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:01:42.632966+00
519	E2	577c54f4-7f18-4410-86cd-5146cb1e1859	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": true}	2026-01-04 06:01:49.338709+00
520	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:01:53.188849+00
521	E2	577c54f4-7f18-4410-86cd-5146cb1e1859	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": true}	2026-01-04 06:02:14.992658+00
522	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:02:16.715707+00
523	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	d8377aee-df86-476a-aab6-f0bf960cf057	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:03:11.945352+00
524	E3	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	1	{"epoch": 1, "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859"}	2026-01-04 06:03:12.470537+00
525	E5	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	1	{"slot": null, "epoch": 1, "winner": "white", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "red_wins": 0, "saved_at": "2026-01-04T06:03:29.713Z", "match_code": "khb2026-5", "slot_label": null, "white_wins": 1}	2026-01-04 06:03:30.173975+00
526	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2026-01-04 06:06:41.293813+00
527	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:12:54.187565+00
528	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 9, "total": 10}, "isEdit": false}	2026-01-04 06:13:12.564647+00
529	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:13:15.189061+00
530	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:13:23.468713+00
531	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:13:36.459887+00
532	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	d8377aee-df86-476a-aab6-f0bf960cf057	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:13:47.064717+00
533	E3	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	2	{"epoch": 2, "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859"}	2026-01-04 06:13:47.571587+00
534	E5	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	2	{"slot": null, "epoch": 2, "winner": "white", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "red_wins": 0, "saved_at": "2026-01-04T06:14:07.585Z", "match_code": "khb2026-5", "slot_label": null, "white_wins": 2}	2026-01-04 06:14:07.994137+00
535	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2026-01-04 06:18:59.070224+00
536	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:25:58.257596+00
537	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:26:03.552994+00
538	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:26:03.821818+00
539	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	5e8f949d-9ef8-42a9-848e-26246417509d	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:26:15.772985+00
540	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 0, "flag": false, "work": 6, "total": 6}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:26:21.126179+00
541	E1	577c54f4-7f18-4410-86cd-5146cb1e1859	d8377aee-df86-476a-aab6-f0bf960cf057	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:26:38.462233+00
551	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 9, "total": 9}, "isEdit": false}	2026-01-04 06:43:49.229262+00
543	E5	577c54f4-7f18-4410-86cd-5146cb1e1859	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "red_wins": 0, "saved_at": "2026-01-04T06:26:57.382Z", "match_code": "khb2026-5", "slot_label": null, "white_wins": 3}	2026-01-04 06:26:57.761543+00
545	SET_MATCH	adfe23f7-d3e4-4c7c-b475-e9470c722548	\N	1	{"epoch": 1, "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "match_code": "khb2026-6"}	2026-01-04 06:36:49.89233+00
546	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:42:58.024949+00
549	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 06:43:28.458411+00
550	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	d8377aee-df86-476a-aab6-f0bf960cf057	1	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:43:49.216771+00
547	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 0, "flag": true, "work": 9, "total": 9}, "white": {"app": 1, "flag": false, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:42:59.649493+00
548	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 06:43:02.075334+00
552	E3	adfe23f7-d3e4-4c7c-b475-e9470c722548	\N	1	{"epoch": 1, "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548"}	2026-01-04 06:43:49.828883+00
553	E3	adfe23f7-d3e4-4c7c-b475-e9470c722548	\N	1	{"epoch": 1, "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548"}	2026-01-04 06:43:49.864185+00
554	E5	adfe23f7-d3e4-4c7c-b475-e9470c722548	\N	1	{"slot": null, "epoch": 1, "winner": "red", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "red_wins": 1, "saved_at": "2026-01-04T06:44:08.828Z", "match_code": "khb2026-6", "slot_label": null, "white_wins": 0}	2026-01-04 06:44:09.305822+00
555	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2026-01-04 06:49:27.480819+00
556	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:56:08.407625+00
557	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:56:19.601513+00
558	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:56:22.652593+00
559	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 06:56:43.836627+00
560	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:56:43.952585+00
561	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	d8377aee-df86-476a-aab6-f0bf960cf057	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 06:58:26.896499+00
562	E3	adfe23f7-d3e4-4c7c-b475-e9470c722548	\N	2	{"epoch": 2, "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548"}	2026-01-04 06:58:27.402985+00
563	E5	adfe23f7-d3e4-4c7c-b475-e9470c722548	\N	2	{"slot": null, "epoch": 2, "winner": "white", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "red_wins": 1, "saved_at": "2026-01-04T06:58:44.423Z", "match_code": "khb2026-6", "slot_label": null, "white_wins": 1}	2026-01-04 06:58:44.807672+00
564	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2026-01-04 07:01:55.652113+00
565	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 07:08:43.212389+00
566	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 0, "flag": false, "work": 8, "total": 8}, "white": {"app": 1, "flag": true, "work": 9, "total": 10}, "isEdit": false}	2026-01-04 07:09:15.172432+00
567	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 07:09:30.869364+00
568	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	5e8f949d-9ef8-42a9-848e-26246417509d	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 07:09:38.520239+00
569	E2	adfe23f7-d3e4-4c7c-b475-e9470c722548	5e8f949d-9ef8-42a9-848e-26246417509d	3	{"red": {"app": 1, "flag": false, "work": 7, "total": 8}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": true}	2026-01-04 07:09:52.135316+00
570	E2	adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": true}	2026-01-04 07:09:53.9796+00
571	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	d8377aee-df86-476a-aab6-f0bf960cf057	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 07:10:06.34094+00
572	E2	adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": true}	2026-01-04 07:10:10.931323+00
573	E1	adfe23f7-d3e4-4c7c-b475-e9470c722548	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 07:10:19.376325+00
574	E3	adfe23f7-d3e4-4c7c-b475-e9470c722548	\N	3	{"epoch": 3, "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548"}	2026-01-04 07:10:19.877016+00
575	E5	adfe23f7-d3e4-4c7c-b475-e9470c722548	\N	3	{"slot": null, "epoch": 3, "winner": "white", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "red_wins": 1, "saved_at": "2026-01-04T07:10:34.368Z", "match_code": "khb2026-6", "slot_label": null, "white_wins": 2}	2026-01-04 07:10:34.766019+00
576	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2026-01-04 07:13:52.231074+00
577	SET_MATCH	d02b5a03-97ed-485a-be39-334d835747fb	\N	1	{"epoch": 1, "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "match_code": "khb2026-7"}	2026-01-04 07:15:20.548486+00
578	E1	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 07:35:03.48856+00
579	E1	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 07:35:05.339455+00
580	E1	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 07:35:07.619151+00
581	E2	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": true}	2026-01-04 07:35:09.743011+00
582	E1	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 07:35:36.002982+00
583	E1	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	1	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 07:35:36.730236+00
589	E1	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 07:47:19.991906+00
591	E1	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 07:47:36.170991+00
593	E1	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 07:48:07.289654+00
594	E3	d02b5a03-97ed-485a-be39-334d835747fb	\N	2	{"epoch": 2, "match_id": "d02b5a03-97ed-485a-be39-334d835747fb"}	2026-01-04 07:48:07.790868+00
584	E1	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	1	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 07:35:53.078031+00
585	E3	d02b5a03-97ed-485a-be39-334d835747fb	\N	1	{"epoch": 1, "match_id": "d02b5a03-97ed-485a-be39-334d835747fb"}	2026-01-04 07:35:53.585674+00
586	E5	d02b5a03-97ed-485a-be39-334d835747fb	\N	1	{"slot": null, "epoch": 1, "winner": "red", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "red_wins": 1, "saved_at": "2026-01-04T07:36:13.597Z", "match_code": "khb2026-7", "slot_label": null, "white_wins": 0}	2026-01-04 07:36:13.972842+00
587	E6	\N	\N	2	{"to_epoch": 2, "from_epoch": 1}	2026-01-04 07:40:10.899383+00
588	E1	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 07:47:12.24736+00
590	E1	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	2	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 07:47:28.569718+00
592	E1	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	2	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 07:47:49.216236+00
595	E5	d02b5a03-97ed-485a-be39-334d835747fb	\N	2	{"slot": null, "epoch": 2, "winner": "red", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "red_wins": 2, "saved_at": "2026-01-04T07:48:28.912Z", "match_code": "khb2026-7", "slot_label": null, "white_wins": 0}	2026-01-04 07:48:29.308502+00
596	E6	\N	\N	3	{"to_epoch": 3, "from_epoch": 2}	2026-01-04 07:53:18.841887+00
597	E1	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	{"red": {"app": 0, "flag": true, "work": 8, "total": 8}, "white": {"app": 1, "flag": false, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 08:00:23.088608+00
598	E1	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 08:00:24.148348+00
599	E1	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:00:33.551913+00
600	E1	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:00:41.125107+00
601	E1	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	3	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:00:59.146947+00
602	E1	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	3	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:01:29.183235+00
603	E3	d02b5a03-97ed-485a-be39-334d835747fb	\N	3	{"epoch": 3, "match_id": "d02b5a03-97ed-485a-be39-334d835747fb"}	2026-01-04 08:01:29.71375+00
604	E5	d02b5a03-97ed-485a-be39-334d835747fb	\N	3	{"slot": null, "epoch": 3, "winner": "red", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "red_wins": 3, "saved_at": "2026-01-04T08:02:23.606Z", "match_code": "khb2026-7", "slot_label": null, "white_wins": 0}	2026-01-04 08:02:24.114991+00
605	E6	\N	\N	4	{"to_epoch": 4, "from_epoch": 3}	2026-01-04 08:08:53.311537+00
606	E1	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	4	{"red": {"app": 1, "flag": false, "work": 7, "total": 8}, "white": {"app": 0, "flag": true, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 08:16:01.981325+00
607	E1	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	4	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 08:16:14.696571+00
608	E1	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	4	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:16:15.863947+00
609	E1	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	4	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:16:26.572943+00
610	E1	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	4	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": false}	2026-01-04 08:16:28.02035+00
611	E1	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	4	{"red": {"app": 1, "flag": true, "work": 9, "total": 10}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:16:41.496997+00
612	E3	d02b5a03-97ed-485a-be39-334d835747fb	\N	4	{"epoch": 4, "match_id": "d02b5a03-97ed-485a-be39-334d835747fb"}	2026-01-04 08:16:41.977338+00
613	E2	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	4	{"red": {"app": 1, "flag": true, "work": 8, "total": 9}, "white": {"app": 0, "flag": false, "work": 8, "total": 8}, "isEdit": true}	2026-01-04 08:16:42.106903+00
614	E5	d02b5a03-97ed-485a-be39-334d835747fb	\N	4	{"slot": null, "epoch": 4, "winner": "red", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "red_wins": 4, "saved_at": "2026-01-04T08:17:02.752Z", "match_code": "khb2026-7", "slot_label": null, "white_wins": 0}	2026-01-04 08:17:03.190834+00
615	E6	\N	\N	5	{"to_epoch": 5, "from_epoch": 4}	2026-01-04 08:21:37.484551+00
616	E1	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	5	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:28:38.200528+00
617	E1	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	5	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 08:28:52.896691+00
618	E1	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	5	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 08:28:53.657143+00
622	E3	d02b5a03-97ed-485a-be39-334d835747fb	\N	5	{"epoch": 5, "match_id": "d02b5a03-97ed-485a-be39-334d835747fb"}	2026-01-04 08:29:41.513184+00
619	E1	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	5	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 7, "total": 8}, "isEdit": false}	2026-01-04 08:29:18.225063+00
624	E6	\N	\N	6	{"to_epoch": 6, "from_epoch": 5}	2026-01-04 08:33:11.383+00
620	E1	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	5	{"red": {"app": 0, "flag": false, "work": 7, "total": 7}, "white": {"app": 1, "flag": true, "work": 8, "total": 9}, "isEdit": false}	2026-01-04 08:29:18.579513+00
621	E1	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	5	{"red": {"app": 1, "flag": true, "work": 7, "total": 8}, "white": {"app": 0, "flag": false, "work": 7, "total": 7}, "isEdit": false}	2026-01-04 08:29:40.996513+00
623	E5	d02b5a03-97ed-485a-be39-334d835747fb	\N	5	{"slot": null, "epoch": 5, "winner": "white", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "red_wins": 4, "saved_at": "2026-01-04T08:30:00.097Z", "match_code": "khb2026-7", "slot_label": null, "white_wins": 1}	2026-01-04 08:30:00.461934+00
\.


--
-- Data for Name: expected_judges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expected_judges (match_id, judge_id, sort_order) FROM stdin;
f493e31b-5acd-4307-b51d-f5f62823c196	4cd8c381-ba46-42d8-afff-d557d8f71834	1
f493e31b-5acd-4307-b51d-f5f62823c196	f9bc634b-8340-4b67-81e1-23550ef8fff9	2
f493e31b-5acd-4307-b51d-f5f62823c196	277e5bec-0c15-4362-844f-ce3052497ec3	3
f493e31b-5acd-4307-b51d-f5f62823c196	fd23e6be-a987-48a4-b89e-8bec50864cdd	4
f493e31b-5acd-4307-b51d-f5f62823c196	0fabf2a5-eab2-4382-a268-d649464cf5d7	5
f493e31b-5acd-4307-b51d-f5f62823c196	5e8f949d-9ef8-42a9-848e-26246417509d	6
f493e31b-5acd-4307-b51d-f5f62823c196	d8377aee-df86-476a-aab6-f0bf960cf057	7
ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	1
ab21ec4e-8d97-41e9-b133-606c854129fc	f9bc634b-8340-4b67-81e1-23550ef8fff9	2
ab21ec4e-8d97-41e9-b133-606c854129fc	277e5bec-0c15-4362-844f-ce3052497ec3	3
ab21ec4e-8d97-41e9-b133-606c854129fc	fd23e6be-a987-48a4-b89e-8bec50864cdd	4
ab21ec4e-8d97-41e9-b133-606c854129fc	0fabf2a5-eab2-4382-a268-d649464cf5d7	5
8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	1
8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	2
8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	3
8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	4
8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	5
cf263988-bb8f-4610-befc-5bb144e17202	4cd8c381-ba46-42d8-afff-d557d8f71834	1
f063db48-65e5-4a4e-b05a-f7649b35d3a5	0fabf2a5-eab2-4382-a268-d649464cf5d7	1
f063db48-65e5-4a4e-b05a-f7649b35d3a5	277e5bec-0c15-4362-844f-ce3052497ec3	2
f063db48-65e5-4a4e-b05a-f7649b35d3a5	f9bc634b-8340-4b67-81e1-23550ef8fff9	3
f063db48-65e5-4a4e-b05a-f7649b35d3a5	4cd8c381-ba46-42d8-afff-d557d8f71834	4
f063db48-65e5-4a4e-b05a-f7649b35d3a5	5e8f949d-9ef8-42a9-848e-26246417509d	5
f063db48-65e5-4a4e-b05a-f7649b35d3a5	fd23e6be-a987-48a4-b89e-8bec50864cdd	6
f063db48-65e5-4a4e-b05a-f7649b35d3a5	d8377aee-df86-476a-aab6-f0bf960cf057	7
a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	f9bc634b-8340-4b67-81e1-23550ef8fff9	1
a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	277e5bec-0c15-4362-844f-ce3052497ec3	2
a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	5e8f949d-9ef8-42a9-848e-26246417509d	3
a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	fd23e6be-a987-48a4-b89e-8bec50864cdd	4
a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	d8377aee-df86-476a-aab6-f0bf960cf057	5
a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	0fabf2a5-eab2-4382-a268-d649464cf5d7	6
a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	4cd8c381-ba46-42d8-afff-d557d8f71834	7
34fa2107-5761-4004-978a-b6cad952ccee	277e5bec-0c15-4362-844f-ce3052497ec3	1
34fa2107-5761-4004-978a-b6cad952ccee	5e8f949d-9ef8-42a9-848e-26246417509d	2
34fa2107-5761-4004-978a-b6cad952ccee	fd23e6be-a987-48a4-b89e-8bec50864cdd	3
34fa2107-5761-4004-978a-b6cad952ccee	d8377aee-df86-476a-aab6-f0bf960cf057	4
34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	5
34fa2107-5761-4004-978a-b6cad952ccee	4cd8c381-ba46-42d8-afff-d557d8f71834	6
78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	277e5bec-0c15-4362-844f-ce3052497ec3	1
78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	5e8f949d-9ef8-42a9-848e-26246417509d	2
78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	fd23e6be-a987-48a4-b89e-8bec50864cdd	3
78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	d8377aee-df86-476a-aab6-f0bf960cf057	4
78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	0fabf2a5-eab2-4382-a268-d649464cf5d7	5
78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	4cd8c381-ba46-42d8-afff-d557d8f71834	6
e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	1
e0e9792e-26e5-4137-9f07-b96fba55dafa	277e5bec-0c15-4362-844f-ce3052497ec3	2
e0e9792e-26e5-4137-9f07-b96fba55dafa	fd23e6be-a987-48a4-b89e-8bec50864cdd	3
e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	4
e0e9792e-26e5-4137-9f07-b96fba55dafa	d8377aee-df86-476a-aab6-f0bf960cf057	5
e0e9792e-26e5-4137-9f07-b96fba55dafa	4cd8c381-ba46-42d8-afff-d557d8f71834	6
577c54f4-7f18-4410-86cd-5146cb1e1859	0fabf2a5-eab2-4382-a268-d649464cf5d7	1
577c54f4-7f18-4410-86cd-5146cb1e1859	277e5bec-0c15-4362-844f-ce3052497ec3	2
577c54f4-7f18-4410-86cd-5146cb1e1859	fd23e6be-a987-48a4-b89e-8bec50864cdd	3
577c54f4-7f18-4410-86cd-5146cb1e1859	5e8f949d-9ef8-42a9-848e-26246417509d	4
577c54f4-7f18-4410-86cd-5146cb1e1859	d8377aee-df86-476a-aab6-f0bf960cf057	5
577c54f4-7f18-4410-86cd-5146cb1e1859	4cd8c381-ba46-42d8-afff-d557d8f71834	6
adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	1
adfe23f7-d3e4-4c7c-b475-e9470c722548	277e5bec-0c15-4362-844f-ce3052497ec3	2
adfe23f7-d3e4-4c7c-b475-e9470c722548	fd23e6be-a987-48a4-b89e-8bec50864cdd	3
adfe23f7-d3e4-4c7c-b475-e9470c722548	5e8f949d-9ef8-42a9-848e-26246417509d	4
adfe23f7-d3e4-4c7c-b475-e9470c722548	d8377aee-df86-476a-aab6-f0bf960cf057	5
adfe23f7-d3e4-4c7c-b475-e9470c722548	4cd8c381-ba46-42d8-afff-d557d8f71834	6
d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	1
d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	2
d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	3
d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	4
d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	5
d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	6
\.


--
-- Data for Name: judges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.judges (id, name, created_at, voice_key) FROM stdin;
4cd8c381-ba46-42d8-afff-d557d8f71834	堀田　季何	2025-11-16 02:48:39.206741+00	hotta
277e5bec-0c15-4362-844f-ce3052497ec3	久留島　元	2025-11-25 08:58:39.857211+00	kurushima
0fabf2a5-eab2-4382-a268-d649464cf5d7	岩田　奎	2025-11-25 09:47:25.682249+00	iwata
5e8f949d-9ef8-42a9-848e-26246417509d	森賀　まり	2025-11-25 09:47:31.010177+00	moriga
d8377aee-df86-476a-aab6-f0bf960cf057	辻　恵美子	2025-11-25 09:47:43.925432+00	tsuji
fd23e6be-a987-48a4-b89e-8bec50864cdd	若林　哲哉	2025-11-25 09:47:19.298911+00	wakabayashi
f9bc634b-8340-4b67-81e1-23550ef8fff9	塩見　恵介	2025-11-16 02:48:38.278438+00	shiomi
\.


--
-- Data for Name: match_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_snapshots (id, match_id, epoch, snapshot, created_at, github_path, github_pushed_at, winner) FROM stdin;
63	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	3	{"bout": {"slot": null, "label": null}, "epoch": 3, "items": [{"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "f9bc634b-8340-4b67-81e1-23550ef8fff9", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "塩見　恵介", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}], "match": {"id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "code": "khb2026-1", "name": "Ａブロック　第１試合"}, "saved_at": "2026-01-04T02:32:26.445Z", "spec_version": "v2.8-bout"}	2026-01-04 02:32:26.50635+00	\N	\N	red
65	34fa2107-5761-4004-978a-b6cad952ccee	2	{"bout": {"slot": null, "label": null}, "epoch": 2, "items": [{"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 10, "app_point": 1, "work_point": 9}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}], "match": {"id": "34fa2107-5761-4004-978a-b6cad952ccee", "code": "khb2026-2", "name": "Ｂブロック　第１試合"}, "saved_at": "2026-01-04T03:11:28.287Z", "spec_version": "v2.8-bout"}	2026-01-04 03:11:28.341374+00	\N	\N	white
61	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	1	{"bout": {"slot": null, "label": null}, "epoch": 1, "items": [{"red": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 1, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 2, "judge_name": "岩田　奎", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 1, "white": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 0, "work_point": 9}, "epoch": 1, "white": {"flag": false, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "f9bc634b-8340-4b67-81e1-23550ef8fff9", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "塩見　恵介", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 1, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}], "match": {"id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "code": "khb2026-1", "name": "Ａブロック　第１試合"}, "saved_at": "2026-01-04T02:09:49.259Z", "spec_version": "v2.8-bout"}	2026-01-04 02:09:49.31346+00	\N	\N	red
62	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	2	{"bout": {"slot": null, "label": null}, "epoch": 2, "items": [{"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 2, "white": {"flag": true, "total": 10, "app_point": 1, "work_point": 9}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "f9bc634b-8340-4b67-81e1-23550ef8fff9", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "塩見　恵介", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}, {"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-1", "match_name": "Ａブロック　第１試合"}], "match": {"id": "a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a", "code": "khb2026-1", "name": "Ａブロック　第１試合"}, "saved_at": "2026-01-04T02:21:34.521Z", "spec_version": "v2.8-bout"}	2026-01-04 02:21:34.571007+00	\N	\N	red
66	34fa2107-5761-4004-978a-b6cad952ccee	3	{"bout": {"slot": null, "label": null}, "epoch": 3, "items": [{"red": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 3, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 3, "judge_name": "岩田　奎", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "34fa2107-5761-4004-978a-b6cad952ccee", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-2", "match_name": "Ｂブロック　第１試合"}], "match": {"id": "34fa2107-5761-4004-978a-b6cad952ccee", "code": "khb2026-2", "name": "Ｂブロック　第１試合"}, "saved_at": "2026-01-04T03:25:20.592Z", "spec_version": "v2.8-bout"}	2026-01-04 03:25:20.670004+00	\N	\N	white
67	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	1	{"bout": {"slot": null, "label": null}, "epoch": 1, "items": [{"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}], "match": {"id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "code": "khb2026-3", "name": "Ａブロック　第２試合"}, "saved_at": "2026-01-04T03:48:39.055Z", "spec_version": "v2.8-bout"}	2026-01-04 03:48:39.111349+00	\N	\N	red
68	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	2	{"bout": {"slot": null, "label": null}, "epoch": 2, "items": [{"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 2, "judge_name": "森賀　まり", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}], "match": {"id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "code": "khb2026-3", "name": "Ａブロック　第２試合"}, "saved_at": "2026-01-04T04:00:22.055Z", "spec_version": "v2.8-bout"}	2026-01-04 04:00:22.109125+00	\N	\N	red
69	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	3	{"bout": {"slot": null, "label": null}, "epoch": 3, "items": [{"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-3", "match_name": "Ａブロック　第２試合"}], "match": {"id": "78c87ecb-0a8b-4c5f-bfa9-76dc5342383e", "code": "khb2026-3", "name": "Ａブロック　第２試合"}, "saved_at": "2026-01-04T04:13:08.734Z", "spec_version": "v2.8-bout"}	2026-01-04 04:13:08.788733+00	\N	\N	red
72	e0e9792e-26e5-4137-9f07-b96fba55dafa	3	{"bout": {"slot": null, "label": null}, "epoch": 3, "items": [{"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "revision": 2, "judge_name": "岩田　奎", "match_code": "khb2026-4", "match_name": "Ｂブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-4", "match_name": "Ｂブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-4", "match_name": "Ｂブロック　第２試合"}, {"red": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-4", "match_name": "Ｂブロック　第２試合"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-4", "match_name": "Ｂブロック　第２試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-4", "match_name": "Ｂブロック　第２試合"}], "match": {"id": "e0e9792e-26e5-4137-9f07-b96fba55dafa", "code": "khb2026-4", "name": "Ｂブロック　第２試合"}, "saved_at": "2026-01-04T05:46:12.613Z", "spec_version": "v2.8-bout"}	2026-01-04 05:46:12.679639+00	\N	\N	red
73	577c54f4-7f18-4410-86cd-5146cb1e1859	1	{"bout": {"slot": null, "label": null}, "epoch": 1, "items": [{"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 1, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 1, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 1, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 2, "judge_name": "森賀　まり", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 1, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 1, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 2, "judge_name": "若林　哲哉", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}], "match": {"id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "code": "khb2026-5", "name": "Ａブロック　第３試合"}, "saved_at": "2026-01-04T06:03:29.713Z", "spec_version": "v2.8-bout"}	2026-01-04 06:03:29.782569+00	\N	\N	white
74	577c54f4-7f18-4410-86cd-5146cb1e1859	2	{"bout": {"slot": null, "label": null}, "epoch": 2, "items": [{"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 2, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 10, "app_point": 1, "work_point": 9}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}], "match": {"id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "code": "khb2026-5", "name": "Ａブロック　第３試合"}, "saved_at": "2026-01-04T06:14:07.585Z", "spec_version": "v2.8-bout"}	2026-01-04 06:14:07.646371+00	\N	\N	white
75	577c54f4-7f18-4410-86cd-5146cb1e1859	3	{"bout": {"slot": null, "label": null}, "epoch": 3, "items": [{"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 6, "app_point": 0, "work_point": 6}, "epoch": 3, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-5", "match_name": "Ａブロック　第３試合"}], "match": {"id": "577c54f4-7f18-4410-86cd-5146cb1e1859", "code": "khb2026-5", "name": "Ａブロック　第３試合"}, "saved_at": "2026-01-04T06:26:57.382Z", "spec_version": "v2.8-bout"}	2026-01-04 06:26:57.439226+00	\N	\N	white
76	adfe23f7-d3e4-4c7c-b475-e9470c722548	1	{"bout": {"slot": null, "label": null}, "epoch": 1, "items": [{"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 1, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": true, "total": 10, "app_point": 1, "work_point": 9}, "epoch": 1, "white": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": true, "total": 10, "app_point": 1, "work_point": 9}, "epoch": 1, "white": {"flag": false, "total": 9, "app_point": 0, "work_point": 9}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": true, "total": 9, "app_point": 0, "work_point": 9}, "epoch": 1, "white": {"flag": false, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}], "match": {"id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "code": "khb2026-6", "name": "Ｂブロック　第３試合"}, "saved_at": "2026-01-04T06:44:08.828Z", "spec_version": "v2.8-bout"}	2026-01-04 06:44:08.902205+00	\N	\N	red
77	adfe23f7-d3e4-4c7c-b475-e9470c722548	2	{"bout": {"slot": null, "label": null}, "epoch": 2, "items": [{"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 2, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}], "match": {"id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "code": "khb2026-6", "name": "Ｂブロック　第３試合"}, "saved_at": "2026-01-04T06:58:44.423Z", "spec_version": "v2.8-bout"}	2026-01-04 06:58:44.482033+00	\N	\N	white
78	adfe23f7-d3e4-4c7c-b475-e9470c722548	3	{"bout": {"slot": null, "label": null}, "epoch": 3, "items": [{"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 3, "judge_name": "岩田　奎", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 3, "white": {"flag": true, "total": 10, "app_point": 1, "work_point": 9}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 2, "judge_name": "森賀　まり", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-6", "match_name": "Ｂブロック　第３試合"}], "match": {"id": "adfe23f7-d3e4-4c7c-b475-e9470c722548", "code": "khb2026-6", "name": "Ｂブロック　第３試合"}, "saved_at": "2026-01-04T07:10:34.368Z", "spec_version": "v2.8-bout"}	2026-01-04 07:10:34.422262+00	\N	\N	white
79	d02b5a03-97ed-485a-be39-334d835747fb	1	{"bout": {"slot": null, "label": null}, "epoch": 1, "items": [{"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 1, "white": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 2, "judge_name": "若林　哲哉", "match_code": "khb2026-7", "match_name": "決勝戦"}], "match": {"id": "d02b5a03-97ed-485a-be39-334d835747fb", "code": "khb2026-7", "name": "決勝戦"}, "saved_at": "2026-01-04T07:36:13.597Z", "spec_version": "v2.8-bout"}	2026-01-04 07:36:13.645124+00	\N	\N	red
80	d02b5a03-97ed-485a-be39-334d835747fb	2	{"bout": {"slot": null, "label": null}, "epoch": 2, "items": [{"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 2, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 2, "white": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-7", "match_name": "決勝戦"}], "match": {"id": "d02b5a03-97ed-485a-be39-334d835747fb", "code": "khb2026-7", "name": "決勝戦"}, "saved_at": "2026-01-04T07:48:28.912Z", "spec_version": "v2.8-bout"}	2026-01-04 07:48:28.963642+00	\N	\N	red
81	d02b5a03-97ed-485a-be39-334d835747fb	3	{"bout": {"slot": null, "label": null}, "epoch": 3, "items": [{"red": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 3, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 3, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-7", "match_name": "決勝戦"}], "match": {"id": "d02b5a03-97ed-485a-be39-334d835747fb", "code": "khb2026-7", "name": "決勝戦"}, "saved_at": "2026-01-04T08:02:23.606Z", "spec_version": "v2.8-bout"}	2026-01-04 08:02:23.668687+00	\N	\N	red
82	d02b5a03-97ed-485a-be39-334d835747fb	4	{"bout": {"slot": null, "label": null}, "epoch": 4, "items": [{"red": {"flag": false, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 4, "white": {"flag": true, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 4, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 4, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "epoch": 4, "white": {"flag": false, "total": 8, "app_point": 0, "work_point": 8}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 2, "judge_name": "森賀　まり", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 10, "app_point": 1, "work_point": 9}, "epoch": 4, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 4, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-7", "match_name": "決勝戦"}], "match": {"id": "d02b5a03-97ed-485a-be39-334d835747fb", "code": "khb2026-7", "name": "決勝戦"}, "saved_at": "2026-01-04T08:17:02.752Z", "spec_version": "v2.8-bout"}	2026-01-04 08:17:02.803054+00	\N	\N	red
83	d02b5a03-97ed-485a-be39-334d835747fb	5	{"bout": {"slot": null, "label": null}, "epoch": 5, "items": [{"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 5, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "0fabf2a5-eab2-4382-a268-d649464cf5d7", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "岩田　奎", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 5, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "277e5bec-0c15-4362-844f-ce3052497ec3", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "久留島　元", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 5, "white": {"flag": true, "total": 9, "app_point": 1, "work_point": 8}, "judge_id": "4cd8c381-ba46-42d8-afff-d557d8f71834", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "堀田　季何", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 5, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "5e8f949d-9ef8-42a9-848e-26246417509d", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "森賀　まり", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "epoch": 5, "white": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "judge_id": "d8377aee-df86-476a-aab6-f0bf960cf057", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "辻　恵美子", "match_code": "khb2026-7", "match_name": "決勝戦"}, {"red": {"flag": false, "total": 7, "app_point": 0, "work_point": 7}, "epoch": 5, "white": {"flag": true, "total": 8, "app_point": 1, "work_point": 7}, "judge_id": "fd23e6be-a987-48a4-b89e-8bec50864cdd", "match_id": "d02b5a03-97ed-485a-be39-334d835747fb", "revision": 1, "judge_name": "若林　哲哉", "match_code": "khb2026-7", "match_name": "決勝戦"}], "match": {"id": "d02b5a03-97ed-485a-be39-334d835747fb", "code": "khb2026-7", "name": "決勝戦"}, "saved_at": "2026-01-04T08:30:00.097Z", "spec_version": "v2.8-bout"}	2026-01-04 08:30:00.151979+00	\N	\N	white
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matches (id, code, name, created_at, red_team_name, white_team_name, num_bouts) FROM stdin;
cf263988-bb8f-4610-befc-5bb144e17202	khb2026-exam3-1	ライブ配信　実証実験	2025-12-20 07:59:57.383402+00	実証実験学園Ａ	実証実験学園Ｂ	3
f063db48-65e5-4a4e-b05a-f7649b35d3a5	khb2026-0	当日テスト	2026-01-03 19:02:34.284558+00	テスト高校Ａ	テスト高校Ｂ	3
a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	khb2026-1	Ａブロック　第１試合	2026-01-04 01:42:06.797431+00	洛南Ａ	灘	3
34fa2107-5761-4004-978a-b6cad952ccee	khb2026-2	Ｂブロック　第１試合	2026-01-04 02:37:45.054311+00	名古屋	京都共栄Ａ	3
78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	khb2026-3	Ａブロック　第２試合	2026-01-04 03:30:44.814514+00	灘	京都共栄Ｂ	3
e0e9792e-26e5-4137-9f07-b96fba55dafa	khb2026-4	Ｂブロック　第２試合	2026-01-04 04:44:26.534271+00	京都共栄Ａ	洛南Ｂ	3
577c54f4-7f18-4410-86cd-5146cb1e1859	khb2026-5	Ａブロック　第３試合	2026-01-04 04:45:04.707247+00	京都共栄Ｂ	洛南Ａ	3
adfe23f7-d3e4-4c7c-b475-e9470c722548	khb2026-6	Ｂブロック　第３試合	2026-01-04 04:45:25.271022+00	洛南Ｂ	名古屋	3
d02b5a03-97ed-485a-be39-334d835747fb	khb2026-7	決勝戦	2026-01-04 07:15:11.937783+00	洛南Ａ	京都共栄Ａ	5
f493e31b-5acd-4307-b51d-f5f62823c196	khb2026-exam-1	実証実験　試験イ	2025-11-26 10:25:27.230383+00	実証実験学園Ａ	実証実験学園Ｂ	3
349d7440-cb3d-4ba0-9b15-8d75802c37fd	khb2026-exam-2	実証実験　試験ロ	2025-11-26 10:26:36.01204+00	実証実験学園Ｃ	実証実験学園Ｄ	5
ab21ec4e-8d97-41e9-b133-606c854129fc	khb2026-exam2-1	追試験イ	2025-12-16 12:31:59.130467+00	実証実験学園Ａ	実証実験学園Ｂ	3
8d933b7c-771c-4447-8624-eda6b48e829a	khb2026-exam2-2	追試験ロ	2025-12-16 13:01:03.60006+00	実証実験学園Ｃ	実証実験学園Ｄ	5
\.


--
-- Data for Name: state; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.state (id, epoch, accepting, e3_reached, updated_at, current_match_id, scoreboard_visible, red_wins, white_wins, wins_updated_at, venue_id) FROM stdin;
1	6	f	f	2026-01-04 08:33:11.221+00	d02b5a03-97ed-485a-be39-334d835747fb	f	4	1	2026-01-04 08:30:00.097+00	5508a68c-eaf4-4e84-9f7e-8336a195a96c
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, match_id, judge_id, epoch, revision, red_work, red_app, red_total, red_flag, white_work, white_app, white_total, white_flag, created_at, updated_at) FROM stdin;
780b70b7-6095-4584-b4d5-19a1c02a3e8e	f493e31b-5acd-4307-b51d-f5f62823c196	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	6	1	7	f	8	0	8	t	2025-12-15 09:19:40.9+00	2025-12-15 09:19:40.9+00
e7985436-542d-43b5-b858-90eda8702427	f493e31b-5acd-4307-b51d-f5f62823c196	277e5bec-0c15-4362-844f-ce3052497ec3	1	2	8	2	10	t	6	0	6	f	2025-12-15 09:20:20.292+00	2025-12-15 09:20:50.231+00
52306fdf-4396-400f-9720-8a7c7331f0d7	f493e31b-5acd-4307-b51d-f5f62823c196	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	1	7	0	7	f	9	2	11	t	2025-12-15 09:21:04.022+00	2025-12-15 09:21:04.022+00
a03df293-fbb7-453a-82b3-13d16ded1432	f493e31b-5acd-4307-b51d-f5f62823c196	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	5	0	5	f	8	1	9	t	2025-12-15 09:21:18.683+00	2025-12-15 09:21:18.683+00
64725a56-5c1d-4f8d-b917-b75b5c38e53a	f493e31b-5acd-4307-b51d-f5f62823c196	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	1	9	1	10	t	7	0	7	f	2025-12-15 09:21:31.299+00	2025-12-15 09:21:31.299+00
48df5e13-4e50-4627-8d0e-41a1bfc7a675	f493e31b-5acd-4307-b51d-f5f62823c196	5e8f949d-9ef8-42a9-848e-26246417509d	1	1	10	0	10	t	6	2	8	f	2025-12-15 09:21:38.616+00	2025-12-15 09:21:38.616+00
57e9760e-6e86-44a0-9e76-a1109a7c6a94	f493e31b-5acd-4307-b51d-f5f62823c196	d8377aee-df86-476a-aab6-f0bf960cf057	1	1	6	2	8	f	9	0	9	t	2025-12-16 07:46:47.208+00	2025-12-16 07:46:47.208+00
dacf8282-f280-4385-bc43-68be5d3fe2c1	f493e31b-5acd-4307-b51d-f5f62823c196	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	2	10	2	12	t	9	0	9	f	2025-12-16 12:13:58.872+00	2025-12-16 12:21:09.824+00
d573d343-d8d9-429c-8df1-161db065f028	f493e31b-5acd-4307-b51d-f5f62823c196	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	2	6	1	7	t	5	0	5	f	2025-12-16 12:21:58.45+00	2025-12-16 12:22:14.593+00
3720f28a-d963-4d73-aea2-ee4354541bec	f493e31b-5acd-4307-b51d-f5f62823c196	5e8f949d-9ef8-42a9-848e-26246417509d	2	1	8	1	9	t	7	0	7	f	2025-12-16 12:22:21.977+00	2025-12-16 12:22:21.977+00
96aaf629-9105-46bc-b9f6-0cd37509e57a	f493e31b-5acd-4307-b51d-f5f62823c196	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	7	0	7	t	5	2	7	f	2025-12-16 12:23:59.971+00	2025-12-16 12:23:59.971+00
9e6563a1-1b72-466f-ab7b-9791ae1e3528	f493e31b-5acd-4307-b51d-f5f62823c196	d8377aee-df86-476a-aab6-f0bf960cf057	2	1	5	0	5	f	7	1	8	t	2025-12-16 12:24:42.539+00	2025-12-16 12:24:42.539+00
53f561da-9f45-4e2e-a05e-5d0391540a6d	f493e31b-5acd-4307-b51d-f5f62823c196	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	10	2	12	t	10	0	10	f	2025-12-16 12:27:42.623+00	2025-12-16 12:27:42.623+00
87f5baea-3a1a-4cd1-bbe7-8e6b4ef88c3d	f493e31b-5acd-4307-b51d-f5f62823c196	4cd8c381-ba46-42d8-afff-d557d8f71834	2	3	6	1	7	f	8	0	8	t	2025-12-16 12:24:19.024+00	2025-12-16 12:31:19.523+00
b1ed4e57-3bbc-433b-acde-5926812ef3f0	ab21ec4e-8d97-41e9-b133-606c854129fc	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	1	7	0	7	f	9	2	11	t	2025-12-16 12:34:43.17+00	2025-12-16 12:34:43.17+00
ceada173-4bff-40ff-bc58-8392c010d43c	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	1	5	0	5	f	10	2	12	t	2025-12-16 13:15:18.847+00	2025-12-16 13:15:18.847+00
c15e4755-11bf-482a-8252-5acf390a9ecd	ab21ec4e-8d97-41e9-b133-606c854129fc	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	5	0	5	f	8	1	9	t	2025-12-16 12:35:26.123+00	2025-12-16 12:35:26.123+00
4a509823-b890-4b3c-ab0f-315b20b8ed5a	ab21ec4e-8d97-41e9-b133-606c854129fc	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	2	9	1	10	t	7	0	7	f	2025-12-16 12:34:45.822+00	2025-12-16 12:36:10.318+00
92fad1b6-5812-4ef7-8c1f-0132f6cf79a9	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	1	5	1	6	f	6	0	6	t	2025-12-16 13:15:59.827+00	2025-12-16 13:15:59.827+00
e3d6fd6c-a22f-4ead-a77b-e17f93e2f0de	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	10	1	11	t	9	0	9	f	2025-12-16 13:16:06.875+00	2025-12-16 13:16:06.875+00
895ac0fe-3de2-4678-841a-7fb2e651e895	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	1	6	6	1	7	f	8	0	8	t	2025-12-16 12:34:10.871+00	2025-12-16 12:41:21.849+00
a78b6b32-831e-4c6b-971d-56d29c5e2b57	ab21ec4e-8d97-41e9-b133-606c854129fc	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	8	2	10	t	6	0	6	f	2025-12-16 12:42:55.966+00	2025-12-16 12:42:55.966+00
04d034b5-a53d-49cc-b0ec-76d264f5e652	ab21ec4e-8d97-41e9-b133-606c854129fc	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	9	0	9	f	10	1	11	t	2025-12-16 12:48:25.531+00	2025-12-16 12:48:25.531+00
5a92d587-0926-4441-acd8-a855499adefa	ab21ec4e-8d97-41e9-b133-606c854129fc	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	10	2	12	t	9	0	9	f	2025-12-16 12:48:39.552+00	2025-12-16 12:48:39.552+00
2f9091f1-3989-4317-aeff-0d27de6b71c4	ab21ec4e-8d97-41e9-b133-606c854129fc	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	7	0	7	t	5	2	7	f	2025-12-16 12:48:41.05+00	2025-12-16 12:48:41.05+00
4889c640-1300-490c-a7f1-50db45bb04d2	ab21ec4e-8d97-41e9-b133-606c854129fc	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	1	6	1	7	t	5	0	5	f	2025-12-16 12:48:42.044+00	2025-12-16 12:48:42.044+00
ef9b6265-920f-4fdc-baa3-aba1f625fce6	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	9	0	9	t	7	1	8	f	2025-12-16 13:16:07.458+00	2025-12-16 13:16:07.458+00
07109f85-f537-48c4-9525-1cf07a2fb6c9	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	8	2	10	t	6	0	6	f	2025-12-16 13:16:19.097+00	2025-12-16 13:16:19.097+00
956cf4bb-2e22-4886-bd09-0f75bdd8186a	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	2	4	8	0	8	t	5	2	7	f	2025-12-16 12:48:31.363+00	2025-12-16 12:51:19.302+00
69c50c92-e11a-45b3-8b73-ab3ed781d29b	ab21ec4e-8d97-41e9-b133-606c854129fc	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	7	0	7	f	6	2	8	t	2025-12-16 12:54:39.04+00	2025-12-16 12:54:39.04+00
05d07c2e-424c-4fc0-a04b-3f5c55fb9274	ab21ec4e-8d97-41e9-b133-606c854129fc	f9bc634b-8340-4b67-81e1-23550ef8fff9	3	1	8	0	8	f	8	1	9	t	2025-12-16 12:54:53.835+00	2025-12-16 12:54:53.835+00
d39f072a-5cb9-4722-8ca3-f65baf8d057c	ab21ec4e-8d97-41e9-b133-606c854129fc	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	1	6	2	8	f	9	0	9	t	2025-12-16 12:55:05.122+00	2025-12-16 12:55:05.122+00
788ed58d-6a68-4624-9c2f-7f6f635fed77	ab21ec4e-8d97-41e9-b133-606c854129fc	4cd8c381-ba46-42d8-afff-d557d8f71834	3	3	9	2	11	t	10	0	10	f	2025-12-16 12:54:44.476+00	2025-12-16 12:55:12.433+00
7335f838-d767-4f7c-ac4e-a26f172ab53e	ab21ec4e-8d97-41e9-b133-606c854129fc	277e5bec-0c15-4362-844f-ce3052497ec3	3	1	5	1	6	f	7	0	7	t	2025-12-16 12:56:48.713+00	2025-12-16 12:56:48.713+00
89f13988-6618-42fa-b227-84816ee394a7	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	8	1	9	t	5	0	5	f	2025-12-16 13:08:10.262+00	2025-12-16 13:08:10.262+00
ced602e5-81c2-449f-86cd-d587b72122eb	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	1	9	2	11	t	10	0	10	f	2025-12-16 13:08:17.027+00	2025-12-16 13:08:17.027+00
606b334c-13ec-4479-840f-79bd66849634	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	6	0	6	f	8	2	10	t	2025-12-16 13:08:24.025+00	2025-12-16 13:08:24.025+00
8ffc4633-5061-4ba5-bee0-94736a3ec9ca	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	1	10	0	10	t	8	1	9	f	2025-12-16 13:08:32.466+00	2025-12-16 13:08:32.466+00
a680d5f0-484d-4683-be69-bb98163e5381	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	1	2	7	0	7	t	6	1	7	f	2025-12-16 13:08:19.206+00	2025-12-16 13:09:23.579+00
71f74fd1-72f6-4244-ba24-290ef2aec627	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	2	2	7	2	9	t	5	0	5	f	2025-12-16 13:17:10.104+00	2025-12-16 13:18:11.491+00
9727ae76-2ab2-46ca-b578-495badf8ca87	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	6	2	8	f	10	0	10	t	2025-12-16 13:20:40.895+00	2025-12-16 13:20:40.895+00
bf0ade49-caef-4d4f-9ded-90b5138e2089	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	3	2	10	0	10	t	7	2	9	f	2025-12-16 13:15:02.765+00	2025-12-16 13:21:02.236+00
93964dda-78cd-40e9-89ef-c5a6730c6728	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	3	2	5	0	5	f	7	2	9	t	2025-12-16 13:15:07.626+00	2025-12-16 13:21:12.492+00
149d91b5-0460-479e-bfae-0822b288c080	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	4	1	9	1	10	t	5	0	5	f	2025-12-16 13:26:41.907+00	2025-12-16 13:26:41.907+00
0f553de6-b181-43f2-b7fd-f61702d9c66b	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	4	1	8	2	10	t	6	0	6	f	2025-12-16 13:27:27.477+00	2025-12-16 13:27:27.477+00
55e0c55b-b3e3-45b8-9d31-75f86d8fef15	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	3	4	9	1	10	t	9	0	9	f	2025-12-16 13:15:28.434+00	2025-12-16 13:23:22.483+00
931220d6-95ae-48b7-91d4-0a2e8bba311d	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	4	1	10	0	10	t	6	1	7	f	2025-12-16 13:26:19.482+00	2025-12-16 13:26:19.482+00
8ef35b60-e82b-4cb4-910e-8d496a766757	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	4	1	5	1	6	f	8	0	8	t	2025-12-16 13:26:20.703+00	2025-12-16 13:26:20.703+00
99800d2f-9cdc-41d7-a5e0-14d86bad3141	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	4	1	7	2	9	t	8	0	8	f	2025-12-16 13:26:29.611+00	2025-12-16 13:26:29.611+00
6789de4d-7569-4ac5-bc3e-e7d6ad39ff0d	8d933b7c-771c-4447-8624-eda6b48e829a	fd23e6be-a987-48a4-b89e-8bec50864cdd	5	1	7	0	7	f	9	2	11	t	2025-12-16 13:31:53.256+00	2025-12-16 13:31:53.256+00
3effc6f9-eb00-4ae3-abc6-7d2f871da7b7	8d933b7c-771c-4447-8624-eda6b48e829a	f9bc634b-8340-4b67-81e1-23550ef8fff9	5	1	6	0	6	f	9	1	10	t	2025-12-16 13:31:54.961+00	2025-12-16 13:31:54.961+00
0e9c85be-83a0-430e-9348-3cac4f449fc4	8d933b7c-771c-4447-8624-eda6b48e829a	277e5bec-0c15-4362-844f-ce3052497ec3	5	1	8	0	8	f	7	2	9	t	2025-12-16 13:32:02.822+00	2025-12-16 13:32:02.822+00
0530c296-ce7a-4e39-ad6c-5589c1c80db7	8d933b7c-771c-4447-8624-eda6b48e829a	0fabf2a5-eab2-4382-a268-d649464cf5d7	5	1	6	0	6	f	7	1	8	t	2025-12-16 13:32:06.453+00	2025-12-16 13:32:06.453+00
9966f61b-1ac2-41f2-a606-ad045e4b8f6d	8d933b7c-771c-4447-8624-eda6b48e829a	4cd8c381-ba46-42d8-afff-d557d8f71834	5	1	9	0	9	f	9	1	10	t	2025-12-16 13:34:03.621+00	2025-12-16 13:34:03.621+00
29ce1792-be23-49e0-8bb4-3c166e45579f	cf263988-bb8f-4610-befc-5bb144e17202	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	10	0	10	t	9	1	10	f	2025-12-20 08:12:13.291+00	2025-12-20 08:12:13.291+00
ae14fec7-a1d6-4eca-b989-0c6ea8f1daed	cf263988-bb8f-4610-befc-5bb144e17202	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	7	0	7	t	5	2	7	f	2025-12-20 08:14:46.908+00	2025-12-20 08:14:46.908+00
bbd819db-96a1-4122-8b4b-bb35cfa7d4b6	cf263988-bb8f-4610-befc-5bb144e17202	4cd8c381-ba46-42d8-afff-d557d8f71834	3	1	10	0	10	f	10	2	12	t	2025-12-20 08:17:32.751+00	2025-12-20 08:17:32.751+00
60e068b1-be69-4bf4-87eb-87a46874ab14	f063db48-65e5-4a4e-b05a-f7649b35d3a5	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	8	0	8	f	8	1	9	t	2026-01-04 01:11:09.285+00	2026-01-04 01:11:09.285+00
ba9cc425-b53a-42bb-b1d8-dfb52aeabab3	f063db48-65e5-4a4e-b05a-f7649b35d3a5	277e5bec-0c15-4362-844f-ce3052497ec3	1	2	8	1	9	t	5	0	5	f	2026-01-04 01:11:22.942+00	2026-01-04 01:11:51.342+00
30e77855-5d01-4168-bc09-65ea7fc83f39	f063db48-65e5-4a4e-b05a-f7649b35d3a5	5e8f949d-9ef8-42a9-848e-26246417509d	1	2	8	1	9	t	7	0	7	f	2026-01-04 01:11:09.015+00	2026-01-04 01:12:26.928+00
e782d9f2-37e3-40d7-a0bd-5033daf319b1	34fa2107-5761-4004-978a-b6cad952ccee	d8377aee-df86-476a-aab6-f0bf960cf057	3	1	8	1	9	t	7	0	7	f	2026-01-04 03:25:00.927+00	2026-01-04 03:25:00.927+00
013d1e4e-e33a-44f3-b830-8b618b703b1c	f063db48-65e5-4a4e-b05a-f7649b35d3a5	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	3	9	0	9	f	8	2	10	t	2026-01-04 01:11:56.778+00	2026-01-04 01:32:53.476+00
9990e329-b062-4760-a07c-9b0ac89fd0d8	f063db48-65e5-4a4e-b05a-f7649b35d3a5	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	2	9	1	10	t	9	0	9	f	2026-01-04 01:11:01.249+00	2026-01-04 01:35:20.423+00
91766ecd-978e-4227-8ad9-70680f417fdd	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	7	0	7	f	7	1	8	t	2026-01-04 02:08:05.774+00	2026-01-04 02:08:05.774+00
35ebcfda-bbfc-4327-9552-b24085ebc9d0	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	f9bc634b-8340-4b67-81e1-23550ef8fff9	1	1	8	1	9	t	7	0	7	f	2026-01-04 02:08:06.963+00	2026-01-04 02:08:06.963+00
f0397c4b-9381-43d5-95c1-9437fb8958a6	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	7	1	8	f	8	0	8	t	2026-01-04 02:08:10.925+00	2026-01-04 02:08:10.925+00
2cfb2b41-e44e-4856-b704-58d3e3fd60f1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	5e8f949d-9ef8-42a9-848e-26246417509d	1	1	9	0	9	t	8	1	9	f	2026-01-04 02:08:29.499+00	2026-01-04 02:08:29.499+00
a72fa0d4-7b92-468f-8fd5-eb6e545692cf	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	2	8	0	8	f	8	1	9	t	2026-01-04 02:07:59.611+00	2026-01-04 02:08:49.004+00
ad9f7d46-bce3-4604-b011-f69bc039ca15	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	7	1	8	t	7	0	7	f	2026-01-04 02:09:00.901+00	2026-01-04 02:09:00.901+00
d75fc50a-6449-4b00-a7a6-f3c2c268d5b1	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	d8377aee-df86-476a-aab6-f0bf960cf057	1	1	8	1	9	t	7	0	7	f	2026-01-04 02:09:28.792+00	2026-01-04 02:09:28.792+00
934f6a06-94d6-4e98-bbfb-96ca690f9c91	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	7	1	8	t	7	0	7	f	2026-01-04 02:20:15.525+00	2026-01-04 02:20:15.525+00
8d7f13c9-ddb8-49ac-938a-16db7f66a78f	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	8	0	8	f	9	1	10	t	2026-01-04 02:20:19.076+00	2026-01-04 02:20:19.076+00
ef024aa1-e09a-4689-90a6-efb47e4b8653	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	8	1	9	t	7	0	7	f	2026-01-04 02:20:21.992+00	2026-01-04 02:20:21.992+00
1277c637-e544-46b1-8b2c-5975e5ad358d	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	f9bc634b-8340-4b67-81e1-23550ef8fff9	2	1	7	0	7	f	7	1	8	t	2026-01-04 02:20:24.045+00	2026-01-04 02:20:24.045+00
1de340d8-5cc2-405a-9461-6e8ec3707f46	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	5e8f949d-9ef8-42a9-848e-26246417509d	2	1	8	1	9	t	7	0	7	f	2026-01-04 02:20:41.153+00	2026-01-04 02:20:41.153+00
8046f8a7-00cb-40cd-8cf5-bc158505befa	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	7	0	7	f	7	1	8	t	2026-01-04 02:20:55.261+00	2026-01-04 02:20:55.261+00
627cf5d7-7cbd-4e8e-adbd-224b2e992f0a	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	d8377aee-df86-476a-aab6-f0bf960cf057	2	1	8	0	8	t	7	1	8	f	2026-01-04 02:21:07.383+00	2026-01-04 02:21:07.383+00
ddae33f1-7888-445a-9be1-6f281fd35aba	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	f9bc634b-8340-4b67-81e1-23550ef8fff9	3	1	7	0	7	f	7	1	8	t	2026-01-04 02:29:14.649+00	2026-01-04 02:29:14.649+00
7f506a13-8abe-4f9f-90d1-4b8320ce6656	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	1	8	1	9	t	7	0	7	f	2026-01-04 02:29:18.201+00	2026-01-04 02:29:18.201+00
1f08dd14-c47b-4284-a52b-c50399bfdedc	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	8	1	9	t	7	0	7	f	2026-01-04 02:31:30.463+00	2026-01-04 02:31:30.463+00
0b83a1b0-099a-43cf-a249-cecf68eb7ef7	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	277e5bec-0c15-4362-844f-ce3052497ec3	3	1	7	0	7	f	7	1	8	t	2026-01-04 02:31:37.075+00	2026-01-04 02:31:37.075+00
3240cca6-190e-43ff-abd8-a277a1d88f63	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	4cd8c381-ba46-42d8-afff-d557d8f71834	3	1	7	1	8	t	7	0	7	f	2026-01-04 02:31:45.131+00	2026-01-04 02:31:45.131+00
3a9e7091-ae80-45ec-abeb-516e57409c7b	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	5e8f949d-9ef8-42a9-848e-26246417509d	3	1	7	0	7	f	7	1	8	t	2026-01-04 02:31:54.993+00	2026-01-04 02:31:54.993+00
89ac9eaf-c0e7-41a2-b86d-378b67368260	a6ba7f0f-5deb-4c4b-b77b-9998e13e8c4a	d8377aee-df86-476a-aab6-f0bf960cf057	3	1	7	1	8	t	7	0	7	f	2026-01-04 02:32:07.841+00	2026-01-04 02:32:07.841+00
d00d3299-aa30-4cb7-9473-1355db9a50a8	34fa2107-5761-4004-978a-b6cad952ccee	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	8	0	8	t	7	1	8	f	2026-01-04 02:55:31.755+00	2026-01-04 02:55:31.755+00
8ea83740-a500-4cd3-b264-d32f278630d8	34fa2107-5761-4004-978a-b6cad952ccee	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	7	0	7	f	7	1	8	t	2026-01-04 02:55:31.9+00	2026-01-04 02:55:31.9+00
26120902-2c1b-47c8-a1dc-ea24764093e5	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	1	7	1	8	t	7	0	7	f	2026-01-04 03:47:38.277+00	2026-01-04 03:47:38.277+00
ef2531c7-4d23-4bbc-96a5-124339d29759	34fa2107-5761-4004-978a-b6cad952ccee	5e8f949d-9ef8-42a9-848e-26246417509d	1	1	8	0	8	t	7	1	8	f	2026-01-04 02:55:52.471+00	2026-01-04 02:55:52.471+00
afe7891a-82a6-450a-a2a8-2e2c28ea3a8d	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	3	8	0	8	f	8	1	9	t	2026-01-04 02:55:36.011+00	2026-01-04 02:55:59.361+00
f8a0ffe8-d552-4f1f-b5df-dc95d111e881	34fa2107-5761-4004-978a-b6cad952ccee	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	7	0	7	f	8	1	9	t	2026-01-04 02:56:04.005+00	2026-01-04 02:56:04.005+00
5b0ca02b-e614-42e8-abd3-a4dcff3a929d	34fa2107-5761-4004-978a-b6cad952ccee	d8377aee-df86-476a-aab6-f0bf960cf057	1	1	7	1	8	t	7	0	7	f	2026-01-04 02:56:21.607+00	2026-01-04 02:56:21.607+00
924cb4d4-41a8-4eec-9826-ab252f44aae1	34fa2107-5761-4004-978a-b6cad952ccee	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	7	0	7	f	7	1	8	t	2026-01-04 03:09:43.149+00	2026-01-04 03:09:43.149+00
cc2281cd-a8e1-478c-831d-ca58c65b1c60	34fa2107-5761-4004-978a-b6cad952ccee	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	7	1	8	f	8	0	8	t	2026-01-04 03:09:49.094+00	2026-01-04 03:09:49.094+00
95682786-d787-4847-8b25-8ef658e02bc0	34fa2107-5761-4004-978a-b6cad952ccee	5e8f949d-9ef8-42a9-848e-26246417509d	2	1	8	0	8	t	7	1	8	f	2026-01-04 03:09:52.293+00	2026-01-04 03:09:52.293+00
1ad512c7-1297-4229-80f6-e74e97a1aab7	34fa2107-5761-4004-978a-b6cad952ccee	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	8	1	9	t	7	0	7	f	2026-01-04 03:10:04.385+00	2026-01-04 03:10:04.385+00
04b0b152-b381-41c3-8699-1ade3e9264f5	34fa2107-5761-4004-978a-b6cad952ccee	d8377aee-df86-476a-aab6-f0bf960cf057	2	1	7	0	7	f	7	1	8	t	2026-01-04 03:10:21.279+00	2026-01-04 03:10:21.279+00
3fb98e12-62ea-4e31-a876-6bcd9d966711	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	7	0	7	f	9	1	10	t	2026-01-04 03:11:05.926+00	2026-01-04 03:11:05.926+00
12d44a2d-14a5-427a-8574-fa2deeca1e85	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	8	1	9	t	7	0	7	f	2026-01-04 03:47:38.982+00	2026-01-04 03:47:38.982+00
1170bbe5-7cf7-413f-b3ae-a62680ac6b5e	34fa2107-5761-4004-978a-b6cad952ccee	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	7	1	8	t	7	0	7	f	2026-01-04 03:24:18.262+00	2026-01-04 03:24:18.262+00
76132516-6ced-4be7-a947-13f499ec2629	34fa2107-5761-4004-978a-b6cad952ccee	277e5bec-0c15-4362-844f-ce3052497ec3	3	1	7	0	7	f	7	1	8	t	2026-01-04 03:24:18.618+00	2026-01-04 03:24:18.618+00
4cb012f1-6fda-49ae-a1cb-5c83a18c8ed2	34fa2107-5761-4004-978a-b6cad952ccee	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	3	8	0	8	f	8	1	9	t	2026-01-04 03:23:39.457+00	2026-01-04 03:24:27.377+00
6278ea35-d672-4b08-ae48-518f8c5dfce4	34fa2107-5761-4004-978a-b6cad952ccee	5e8f949d-9ef8-42a9-848e-26246417509d	3	1	7	0	7	f	7	1	8	t	2026-01-04 03:24:29.516+00	2026-01-04 03:24:29.516+00
49b424d1-9206-4ab3-98ba-57476e28b54f	34fa2107-5761-4004-978a-b6cad952ccee	4cd8c381-ba46-42d8-afff-d557d8f71834	3	1	7	0	7	f	7	1	8	t	2026-01-04 03:24:37.299+00	2026-01-04 03:24:37.299+00
49c47a8f-81ca-4a25-8ef3-e88dc6176ca1	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	8	1	9	t	7	0	7	f	2026-01-04 03:47:45.446+00	2026-01-04 03:47:45.446+00
0d9e0574-8298-4fae-8728-0712dafac38a	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	7	1	8	t	7	0	7	f	2026-01-04 03:47:58.534+00	2026-01-04 03:47:58.534+00
b4e0d753-6a11-497b-9e7d-f0713a8b841e	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	5e8f949d-9ef8-42a9-848e-26246417509d	1	1	8	1	9	t	7	0	7	f	2026-01-04 03:48:00.817+00	2026-01-04 03:48:00.817+00
5062106d-baa2-411a-8fc1-0934316f4f0d	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	d8377aee-df86-476a-aab6-f0bf960cf057	1	1	8	1	9	t	7	0	7	f	2026-01-04 03:48:21.632+00	2026-01-04 03:48:21.632+00
fbb5fe4e-4e5d-4634-bf6c-415045b09721	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	7	1	8	t	7	0	7	f	2026-01-04 03:58:52.354+00	2026-01-04 03:58:52.354+00
dc3a1aea-6f8b-4a30-91f5-a196480d7b05	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	7	1	8	t	7	0	7	f	2026-01-04 03:58:59.032+00	2026-01-04 03:58:59.032+00
7c441aeb-871f-4ffa-8440-2cebd7b9e647	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	7	1	8	t	7	0	7	f	2026-01-04 03:59:08.737+00	2026-01-04 03:59:08.737+00
0c32a813-a2a8-4fcb-9dbb-3fe9757ca533	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	7	1	8	t	7	0	7	f	2026-01-04 03:59:12.151+00	2026-01-04 03:59:12.151+00
af05e542-8574-49dd-9dd5-34e250f38c26	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	5e8f949d-9ef8-42a9-848e-26246417509d	2	2	7	1	8	t	7	0	7	f	2026-01-04 03:59:09.89+00	2026-01-04 03:59:23.376+00
2c542e05-81e6-45ab-ad3e-72f76b287c9e	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	d8377aee-df86-476a-aab6-f0bf960cf057	2	1	7	1	8	t	7	0	7	f	2026-01-04 03:59:59.572+00	2026-01-04 03:59:59.572+00
702fc69e-c987-4847-9dac-159fc0c8fe2f	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	1	8	1	9	t	7	0	7	f	2026-01-04 04:12:02.315+00	2026-01-04 04:12:02.315+00
98f97b66-c0f4-4183-bb15-2badc83c7b63	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	8	1	9	t	7	0	7	f	2026-01-04 04:12:02.812+00	2026-01-04 04:12:02.812+00
8cabb655-b7fa-4948-881a-fa5064c27825	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	277e5bec-0c15-4362-844f-ce3052497ec3	3	1	7	0	7	f	7	1	8	t	2026-01-04 04:12:06.563+00	2026-01-04 04:12:06.563+00
e07dc8b8-4fe5-46c4-8512-3c720b9370e8	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	5e8f949d-9ef8-42a9-848e-26246417509d	3	1	8	1	9	t	7	0	7	f	2026-01-04 04:12:16.275+00	2026-01-04 04:12:16.275+00
7e1d2b01-0fc0-4af9-997c-2515ba51359f	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	4cd8c381-ba46-42d8-afff-d557d8f71834	3	1	8	1	9	t	7	0	7	f	2026-01-04 04:12:37.659+00	2026-01-04 04:12:37.659+00
23a30ee6-2f35-4549-94b1-e1b6e2312033	78c87ecb-0a8b-4c5f-bfa9-76dc5342383e	d8377aee-df86-476a-aab6-f0bf960cf057	3	1	7	1	8	t	7	0	7	f	2026-01-04 04:12:52.024+00	2026-01-04 04:12:52.024+00
8b08a897-36a0-4bbd-bc7d-075b8f6d8fb4	e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	1	7	0	7	f	8	1	9	t	2026-01-04 05:21:31.607+00	2026-01-04 05:21:31.607+00
e432e6d3-3851-4005-8d71-f29cce26ce10	e0e9792e-26e5-4137-9f07-b96fba55dafa	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	7	1	8	t	7	0	7	f	2026-01-04 05:21:34.16+00	2026-01-04 05:21:34.16+00
37195cff-ee4e-46ff-afec-3aec71034239	e0e9792e-26e5-4137-9f07-b96fba55dafa	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	7	0	7	f	7	1	8	t	2026-01-04 05:21:36.079+00	2026-01-04 05:21:36.079+00
ae5220c5-5adb-486f-8a21-60df11dbed1c	e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	1	1	7	0	7	f	8	1	9	t	2026-01-04 05:21:43.901+00	2026-01-04 05:21:43.901+00
4fbf97f8-df17-437a-bfc9-e6a5ca0ad62c	e0e9792e-26e5-4137-9f07-b96fba55dafa	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	7	1	8	t	7	0	7	f	2026-01-04 05:22:39.282+00	2026-01-04 05:22:39.282+00
43a4189e-ae17-44fb-9e93-cb03b82f9458	e0e9792e-26e5-4137-9f07-b96fba55dafa	d8377aee-df86-476a-aab6-f0bf960cf057	1	1	7	1	8	t	7	0	7	f	2026-01-04 05:23:01.997+00	2026-01-04 05:23:01.997+00
18a4d82e-5d0f-4c2a-a329-bb4e43f60c51	e0e9792e-26e5-4137-9f07-b96fba55dafa	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	6	1	7	f	7	0	7	t	2026-01-04 05:32:53.894+00	2026-01-04 05:32:53.894+00
bf3fbe45-3ece-46c4-9288-e53da1dd06f9	e0e9792e-26e5-4137-9f07-b96fba55dafa	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	7	0	7	f	8	1	9	t	2026-01-04 05:32:56.121+00	2026-01-04 05:32:56.121+00
7705341e-39a4-4bc7-96d3-f8596bfd589f	e0e9792e-26e5-4137-9f07-b96fba55dafa	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	7	1	8	t	7	0	7	f	2026-01-04 05:33:18.573+00	2026-01-04 05:33:18.573+00
0d431026-382d-4e71-b3cd-f43cff054513	e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	2	7	0	7	f	8	1	9	t	2026-01-04 05:32:21.005+00	2026-01-04 05:33:23.07+00
f272e5fa-65de-4dfb-b86a-4c86928ca82a	adfe23f7-d3e4-4c7c-b475-e9470c722548	5e8f949d-9ef8-42a9-848e-26246417509d	2	1	8	0	8	t	7	1	8	f	2026-01-04 06:56:43.562+00	2026-01-04 06:56:43.562+00
a142ba47-afcd-4479-b5e4-71a0ad84aa75	e0e9792e-26e5-4137-9f07-b96fba55dafa	d8377aee-df86-476a-aab6-f0bf960cf057	2	1	8	1	9	t	7	0	7	f	2026-01-04 05:33:32.969+00	2026-01-04 05:33:32.969+00
08ceb304-dd44-4855-b55b-f22a2804f8e2	e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	2	3	7	1	8	t	7	0	7	f	2026-01-04 05:33:11.994+00	2026-01-04 05:33:36.427+00
dfa2b432-83db-4d3d-a11f-1033dd81922f	e0e9792e-26e5-4137-9f07-b96fba55dafa	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	2	8	0	8	t	7	1	8	f	2026-01-04 05:41:53.691+00	2026-01-04 05:44:59.489+00
c4df6e14-f05c-4fc5-9ea1-fda958f757a0	e0e9792e-26e5-4137-9f07-b96fba55dafa	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	8	1	9	t	8	0	8	f	2026-01-04 05:45:04.697+00	2026-01-04 05:45:04.697+00
1c0c9f04-c587-45d8-a76b-0221ab756174	e0e9792e-26e5-4137-9f07-b96fba55dafa	277e5bec-0c15-4362-844f-ce3052497ec3	3	1	8	0	8	t	7	1	8	f	2026-01-04 05:45:09.279+00	2026-01-04 05:45:09.279+00
fd866ae2-939a-4fd5-85dc-aa0dc14fbe20	e0e9792e-26e5-4137-9f07-b96fba55dafa	5e8f949d-9ef8-42a9-848e-26246417509d	3	1	7	1	8	f	8	0	8	t	2026-01-04 05:45:25.351+00	2026-01-04 05:45:25.351+00
5e144bb5-f787-4fff-8666-c722698b23f0	e0e9792e-26e5-4137-9f07-b96fba55dafa	4cd8c381-ba46-42d8-afff-d557d8f71834	3	1	7	1	8	t	7	0	7	f	2026-01-04 05:45:34.584+00	2026-01-04 05:45:34.584+00
ff7079dd-90d0-42a0-8241-7c00b517ea7b	e0e9792e-26e5-4137-9f07-b96fba55dafa	d8377aee-df86-476a-aab6-f0bf960cf057	3	1	7	1	8	t	7	0	7	f	2026-01-04 05:45:55.043+00	2026-01-04 05:45:55.043+00
5b945766-db95-4914-95ba-1af4407a6a29	577c54f4-7f18-4410-86cd-5146cb1e1859	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	7	0	7	f	7	1	8	t	2026-01-04 06:01:40.972+00	2026-01-04 06:01:40.972+00
ab464350-2928-4bd5-b54a-2ed750109508	577c54f4-7f18-4410-86cd-5146cb1e1859	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	1	8	0	8	t	7	1	8	f	2026-01-04 06:01:41.37+00	2026-01-04 06:01:41.37+00
f146c0a6-e215-438b-985b-05ec8a23619e	577c54f4-7f18-4410-86cd-5146cb1e1859	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	2	7	0	7	f	8	1	9	t	2026-01-04 06:01:42.387+00	2026-01-04 06:01:49.068+00
3d352ae5-d530-4d5d-aa22-76aa88d79bdc	577c54f4-7f18-4410-86cd-5146cb1e1859	5e8f949d-9ef8-42a9-848e-26246417509d	1	2	8	0	8	f	8	1	9	t	2026-01-04 06:01:52.899+00	2026-01-04 06:02:14.704+00
fe26c30a-58d7-4fb4-83f8-ae9352ec8ba3	577c54f4-7f18-4410-86cd-5146cb1e1859	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	7	0	7	f	7	1	8	t	2026-01-04 06:02:16.463+00	2026-01-04 06:02:16.463+00
ff7398ec-180b-489a-8653-0e57469f6697	577c54f4-7f18-4410-86cd-5146cb1e1859	d8377aee-df86-476a-aab6-f0bf960cf057	1	1	7	0	7	f	8	1	9	t	2026-01-04 06:03:11.636+00	2026-01-04 06:03:11.636+00
6c000733-29e8-463c-89ff-a5a70a97ea86	577c54f4-7f18-4410-86cd-5146cb1e1859	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	7	0	7	f	7	1	8	t	2026-01-04 06:12:53.875+00	2026-01-04 06:12:53.875+00
d6e3f879-e532-4d47-a19a-07436fcfda64	577c54f4-7f18-4410-86cd-5146cb1e1859	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	7	0	7	f	9	1	10	t	2026-01-04 06:13:12.287+00	2026-01-04 06:13:12.287+00
1b00e348-4fb3-4da6-a112-e514938a5ea1	577c54f4-7f18-4410-86cd-5146cb1e1859	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	7	0	7	f	7	1	8	t	2026-01-04 06:13:14.894+00	2026-01-04 06:13:14.894+00
7ca2ab32-eea6-4e7e-a8c6-5426e2c12f42	577c54f4-7f18-4410-86cd-5146cb1e1859	5e8f949d-9ef8-42a9-848e-26246417509d	2	1	7	0	7	f	8	1	9	t	2026-01-04 06:13:22.926+00	2026-01-04 06:13:22.926+00
fb2e67a4-eacd-4441-89ef-85f6c104158f	577c54f4-7f18-4410-86cd-5146cb1e1859	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	8	0	8	f	8	1	9	t	2026-01-04 06:13:36.163+00	2026-01-04 06:13:36.163+00
dae61742-93b9-4ccf-94c6-7bf2aac16a8e	577c54f4-7f18-4410-86cd-5146cb1e1859	d8377aee-df86-476a-aab6-f0bf960cf057	2	1	7	0	7	f	7	1	8	t	2026-01-04 06:13:46.813+00	2026-01-04 06:13:46.813+00
512802bb-6c66-4c30-8d2c-e8c8a54a3397	577c54f4-7f18-4410-86cd-5146cb1e1859	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	7	0	7	f	7	1	8	t	2026-01-04 06:25:57.968+00	2026-01-04 06:25:57.968+00
477e9c1b-a860-486e-a3d3-d5a3b5bbcfcd	577c54f4-7f18-4410-86cd-5146cb1e1859	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	1	7	0	7	f	8	1	9	t	2026-01-04 06:26:03.288+00	2026-01-04 06:26:03.288+00
c060713b-4ab6-4bff-8a1a-3fd5e924aaaf	577c54f4-7f18-4410-86cd-5146cb1e1859	277e5bec-0c15-4362-844f-ce3052497ec3	3	1	7	0	7	f	8	1	9	t	2026-01-04 06:26:03.552+00	2026-01-04 06:26:03.552+00
587fc920-de5c-45f3-8b8b-a3a0b804f372	577c54f4-7f18-4410-86cd-5146cb1e1859	5e8f949d-9ef8-42a9-848e-26246417509d	3	1	7	0	7	f	8	1	9	t	2026-01-04 06:26:15.514+00	2026-01-04 06:26:15.514+00
e6bb44c0-51f4-4a4b-be5d-b0d4af736bfa	577c54f4-7f18-4410-86cd-5146cb1e1859	4cd8c381-ba46-42d8-afff-d557d8f71834	3	1	6	0	6	f	8	1	9	t	2026-01-04 06:26:20.881+00	2026-01-04 06:26:20.881+00
d28d9b11-05d0-4150-b9bf-05b171f336ba	577c54f4-7f18-4410-86cd-5146cb1e1859	d8377aee-df86-476a-aab6-f0bf960cf057	3	1	7	0	7	f	7	1	8	t	2026-01-04 06:26:38.194+00	2026-01-04 06:26:38.194+00
77093fa2-4560-4392-9fce-309eec00569a	adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	1	7	0	7	f	8	1	9	t	2026-01-04 06:42:57.693+00	2026-01-04 06:42:57.693+00
57df8316-3421-44ae-a7b5-47df85e98102	adfe23f7-d3e4-4c7c-b475-e9470c722548	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	1	9	0	9	t	8	1	9	f	2026-01-04 06:42:59.339+00	2026-01-04 06:42:59.339+00
64660eb8-e6ac-4a9d-9bd7-822bb3721224	adfe23f7-d3e4-4c7c-b475-e9470c722548	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	9	1	10	t	8	0	8	f	2026-01-04 06:43:01.79+00	2026-01-04 06:43:01.79+00
9231340c-0887-42e3-88d6-cefa697a7bd5	adfe23f7-d3e4-4c7c-b475-e9470c722548	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	8	1	9	t	7	0	7	f	2026-01-04 06:43:28.219+00	2026-01-04 06:43:28.219+00
a59a03e0-146f-48b4-8ab4-e92f1f24543e	adfe23f7-d3e4-4c7c-b475-e9470c722548	d8377aee-df86-476a-aab6-f0bf960cf057	1	1	8	0	8	t	7	1	8	f	2026-01-04 06:43:48.886+00	2026-01-04 06:43:48.886+00
9b4b959d-aa27-41df-8afd-72f39f244875	adfe23f7-d3e4-4c7c-b475-e9470c722548	5e8f949d-9ef8-42a9-848e-26246417509d	1	1	9	1	10	t	9	0	9	f	2026-01-04 06:43:48.902+00	2026-01-04 06:43:48.902+00
051cb839-337a-4773-b8ab-865519cb9667	adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	7	0	7	f	8	1	9	t	2026-01-04 06:56:08.087+00	2026-01-04 06:56:08.087+00
626dd0af-2688-45a9-8576-c42ea6670010	adfe23f7-d3e4-4c7c-b475-e9470c722548	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	7	0	7	f	8	1	9	t	2026-01-04 06:56:19.323+00	2026-01-04 06:56:19.323+00
de3c4da5-2490-4b1a-b555-67fbd011ce41	adfe23f7-d3e4-4c7c-b475-e9470c722548	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	8	0	8	f	8	1	9	t	2026-01-04 06:56:22.367+00	2026-01-04 06:56:22.367+00
77852c4d-c421-477c-9456-cdf5cfbe118b	adfe23f7-d3e4-4c7c-b475-e9470c722548	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	7	0	7	f	8	1	9	t	2026-01-04 06:56:43.638+00	2026-01-04 06:56:43.638+00
803ea8a5-8a8f-4c85-b73a-4a22eb24d929	adfe23f7-d3e4-4c7c-b475-e9470c722548	d8377aee-df86-476a-aab6-f0bf960cf057	2	1	7	0	7	f	8	1	9	t	2026-01-04 06:58:26.639+00	2026-01-04 06:58:26.639+00
e5ba9f42-e91a-4ce9-b70b-9f22c7a10cf1	adfe23f7-d3e4-4c7c-b475-e9470c722548	277e5bec-0c15-4362-844f-ce3052497ec3	3	1	8	0	8	f	9	1	10	t	2026-01-04 07:09:14.917+00	2026-01-04 07:09:14.917+00
3e16a233-f867-4580-9965-1ac42c9f6f3c	adfe23f7-d3e4-4c7c-b475-e9470c722548	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	8	1	9	t	8	0	8	f	2026-01-04 07:09:30.601+00	2026-01-04 07:09:30.601+00
cf7ab068-1ff5-4f4a-bfb6-d9e2eea5a44e	adfe23f7-d3e4-4c7c-b475-e9470c722548	5e8f949d-9ef8-42a9-848e-26246417509d	3	2	7	1	8	f	8	0	8	t	2026-01-04 07:09:38.207+00	2026-01-04 07:09:51.784+00
64f2e83b-d7fa-42e3-aa11-1904174dc2d1	adfe23f7-d3e4-4c7c-b475-e9470c722548	4cd8c381-ba46-42d8-afff-d557d8f71834	3	1	7	0	7	f	7	1	8	t	2026-01-04 07:10:19.121+00	2026-01-04 07:10:19.121+00
36e8ceb5-a390-4fa6-89ce-cb28e5751c07	adfe23f7-d3e4-4c7c-b475-e9470c722548	d8377aee-df86-476a-aab6-f0bf960cf057	3	1	7	0	7	f	8	1	9	t	2026-01-04 07:10:06.082+00	2026-01-04 07:10:06.082+00
9c6f6da5-2237-4c72-824e-8b2d42947d41	adfe23f7-d3e4-4c7c-b475-e9470c722548	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	3	7	1	8	t	7	0	7	f	2026-01-04 07:08:42.892+00	2026-01-04 07:10:10.654+00
ee863840-31ee-466c-abfe-c507fcd80153	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	1	1	8	1	9	t	8	0	8	f	2026-01-04 07:35:05.07+00	2026-01-04 07:35:05.07+00
9e8486c0-785e-489d-80a1-55d6bf6644ce	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	1	1	8	0	8	t	7	1	8	f	2026-01-04 07:35:07.323+00	2026-01-04 07:35:07.323+00
96e0d466-992d-481f-99d7-2d2438735f77	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	2	1	8	1	9	t	7	0	7	f	2026-01-04 07:47:11.945+00	2026-01-04 07:47:11.945+00
c14c39f8-dbdf-486b-b4ea-488708540218	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	2	1	7	0	7	f	7	1	8	t	2026-01-04 07:47:28.294+00	2026-01-04 07:47:28.294+00
fbc1996c-2346-4771-93f0-582629c2babc	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	2	1	7	1	8	t	7	0	7	f	2026-01-04 07:47:35.887+00	2026-01-04 07:47:35.887+00
1ae83119-ff32-462d-acc0-53b0d3955c6f	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	1	2	8	1	9	t	8	0	8	f	2026-01-04 07:35:03.123+00	2026-01-04 07:35:09.43+00
03f8d99c-47f4-4181-a11c-9148b3cb76a9	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	1	1	8	1	9	t	7	0	7	f	2026-01-04 07:35:35.444+00	2026-01-04 07:35:35.444+00
9cd653c4-160b-469b-b19c-a0f404b84fb8	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	1	1	8	0	8	t	7	1	8	f	2026-01-04 07:35:36.425+00	2026-01-04 07:35:36.425+00
a9fd6d8b-324f-4035-8bb3-bd4be5b2cd57	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	1	1	8	1	9	t	7	0	7	f	2026-01-04 07:35:52.811+00	2026-01-04 07:35:52.811+00
28bcdf27-51e3-4d63-809a-b9fdd106267d	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	2	1	8	1	9	t	8	0	8	f	2026-01-04 07:47:19.72+00	2026-01-04 07:47:19.72+00
cf529279-1948-4e3b-bb6d-03e590c7ea8b	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	2	1	7	1	8	t	7	0	7	f	2026-01-04 07:47:48.954+00	2026-01-04 07:47:48.954+00
16fcc81c-a3bf-4d90-942e-f0f07bd9db43	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	2	1	8	1	9	t	7	0	7	f	2026-01-04 07:48:07.008+00	2026-01-04 07:48:07.008+00
b43e8c82-b6b8-42bb-b4c5-a5a281689ca1	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	3	1	8	0	8	t	7	1	8	f	2026-01-04 08:00:22.811+00	2026-01-04 08:00:22.811+00
32458571-7f70-4349-9a3c-8719956feb01	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	3	1	7	0	7	f	8	1	9	t	2026-01-04 08:00:23.852+00	2026-01-04 08:00:23.852+00
739a04ae-edba-436f-a3dc-62b4a69e4e1d	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	3	1	7	1	8	t	7	0	7	f	2026-01-04 08:00:33.3+00	2026-01-04 08:00:33.3+00
9724d995-6d25-4bc8-864f-d74f65d1fd1d	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	3	1	8	1	9	t	7	0	7	f	2026-01-04 08:00:40.863+00	2026-01-04 08:00:40.863+00
4ec3c50b-d616-46a9-99ec-928e5385e03b	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	3	1	7	1	8	t	7	0	7	f	2026-01-04 08:00:58.889+00	2026-01-04 08:00:58.889+00
49932853-b4c5-402e-b81d-971800467df0	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	3	1	8	1	9	t	7	0	7	f	2026-01-04 08:01:28.899+00	2026-01-04 08:01:28.899+00
c33c67ce-9e68-44a7-abae-8862a703be7c	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	4	1	7	1	8	f	8	0	8	t	2026-01-04 08:16:01.687+00	2026-01-04 08:16:01.687+00
dadd19af-a93d-4767-ad4d-3122b7a098c0	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	4	1	7	0	7	f	7	1	8	t	2026-01-04 08:16:14.417+00	2026-01-04 08:16:14.417+00
a56d2b82-c000-4324-865f-7a5e94020ef6	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	4	1	7	1	8	t	7	0	7	f	2026-01-04 08:16:15.59+00	2026-01-04 08:16:15.59+00
072d9139-3122-48e8-b354-d31d45c89207	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	4	1	8	1	9	t	7	0	7	f	2026-01-04 08:16:26.332+00	2026-01-04 08:16:26.332+00
aa515e24-9a21-46be-b9b3-5f3f34a356bc	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	4	1	9	1	10	t	7	0	7	f	2026-01-04 08:16:41.258+00	2026-01-04 08:16:41.258+00
59b89a53-9f29-472e-8dbb-3fee80999501	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	4	2	8	1	9	t	8	0	8	f	2026-01-04 08:16:27.794+00	2026-01-04 08:16:41.81+00
c5ed1851-2f87-4605-9f5d-b67133038798	d02b5a03-97ed-485a-be39-334d835747fb	0fabf2a5-eab2-4382-a268-d649464cf5d7	5	1	7	1	8	t	7	0	7	f	2026-01-04 08:28:37.867+00	2026-01-04 08:28:37.867+00
b74b09ce-e14b-4a5d-9fc3-7beaa004f048	d02b5a03-97ed-485a-be39-334d835747fb	fd23e6be-a987-48a4-b89e-8bec50864cdd	5	1	7	0	7	f	7	1	8	t	2026-01-04 08:28:52.653+00	2026-01-04 08:28:52.653+00
485740ff-b82a-4120-a193-2c9f2c40156f	d02b5a03-97ed-485a-be39-334d835747fb	277e5bec-0c15-4362-844f-ce3052497ec3	5	1	7	0	7	f	8	1	9	t	2026-01-04 08:28:53.392+00	2026-01-04 08:28:53.392+00
14aca6f5-bfd8-4eac-bf25-ff6e435e1d07	d02b5a03-97ed-485a-be39-334d835747fb	5e8f949d-9ef8-42a9-848e-26246417509d	5	1	7	0	7	f	7	1	8	t	2026-01-04 08:29:17.987+00	2026-01-04 08:29:17.987+00
7b838893-c592-4a85-80e5-7d71fd290828	d02b5a03-97ed-485a-be39-334d835747fb	4cd8c381-ba46-42d8-afff-d557d8f71834	5	1	7	0	7	f	8	1	9	t	2026-01-04 08:29:18.32+00	2026-01-04 08:29:18.32+00
4f4ab6d4-1554-4a63-ad91-4638b53747a0	d02b5a03-97ed-485a-be39-334d835747fb	d8377aee-df86-476a-aab6-f0bf960cf057	5	1	7	1	8	t	7	0	7	f	2026-01-04 08:29:40.735+00	2026-01-04 08:29:40.735+00
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.venues (id, code, name, created_at) FROM stdin;
5508a68c-eaf4-4e84-9f7e-8336a195a96c	default	メイン会場	2026-03-04 21:48:27.612027+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-11-05 16:27:47
20211116045059	2025-11-05 16:27:47
20211116050929	2025-11-05 16:27:47
20211116051442	2025-11-05 16:27:47
20211116212300	2025-11-05 16:27:47
20211116213355	2025-11-05 16:27:47
20211116213934	2025-11-05 16:27:47
20211116214523	2025-11-05 16:27:48
20211122062447	2025-11-05 16:27:48
20211124070109	2025-11-05 16:27:48
20211202204204	2025-11-05 16:27:48
20211202204605	2025-11-05 16:27:48
20211210212804	2025-11-05 16:27:48
20211228014915	2025-11-05 16:27:48
20220107221237	2025-11-05 16:27:48
20220228202821	2025-11-05 16:27:48
20220312004840	2025-11-05 16:27:48
20220603231003	2025-11-05 16:27:48
20220603232444	2025-11-05 16:27:48
20220615214548	2025-11-05 16:27:48
20220712093339	2025-11-05 16:27:48
20220908172859	2025-11-05 16:27:48
20220916233421	2025-11-05 16:27:48
20230119133233	2025-11-05 16:27:48
20230128025114	2025-11-05 16:27:48
20230128025212	2025-11-05 16:27:48
20230227211149	2025-11-05 16:27:48
20230228184745	2025-11-05 16:27:48
20230308225145	2025-11-05 16:27:48
20230328144023	2025-11-05 16:27:48
20231018144023	2025-11-05 16:27:48
20231204144023	2025-11-05 16:27:48
20231204144024	2025-11-05 16:27:48
20231204144025	2025-11-05 16:27:48
20240108234812	2025-11-05 16:27:48
20240109165339	2025-11-05 16:27:48
20240227174441	2025-11-05 16:27:48
20240311171622	2025-11-05 16:27:48
20240321100241	2025-11-05 16:27:48
20240401105812	2025-11-05 16:27:48
20240418121054	2025-11-05 16:27:48
20240523004032	2025-11-05 16:27:48
20240618124746	2025-11-05 16:27:48
20240801235015	2025-11-05 16:27:48
20240805133720	2025-11-05 16:27:48
20240827160934	2025-11-05 16:27:48
20240919163303	2025-11-05 16:27:48
20240919163305	2025-11-05 16:27:48
20241019105805	2025-11-05 16:27:48
20241030150047	2025-11-05 16:27:48
20241108114728	2025-11-05 16:27:48
20241121104152	2025-11-05 16:27:48
20241130184212	2025-11-05 16:27:48
20241220035512	2025-11-05 16:27:48
20241220123912	2025-11-05 16:27:48
20241224161212	2025-11-05 16:27:48
20250107150512	2025-11-05 16:27:48
20250110162412	2025-11-05 16:27:48
20250123174212	2025-11-05 16:27:48
20250128220012	2025-11-05 16:27:48
20250506224012	2025-11-05 16:27:48
20250523164012	2025-11-05 16:27:48
20250714121412	2025-11-05 16:27:48
20250905041441	2025-11-05 16:27:48
20251103001201	2025-11-14 04:14:08
20251120212548	2026-02-08 03:12:59
20251120215549	2026-02-08 03:12:59
20260218120000	2026-03-21 05:32:01
20260326120000	2026-04-13 08:36:39
20260514120000	2026-06-17 06:23:16
20260527120000	2026-06-17 06:23:16
20260528120000	2026-06-17 06:23:16
20260603120000	2026-06-17 06:23:16
20260605120000	2026-06-17 06:23:16
20260606110000	2026-06-17 06:23:16
20260616120000	2026-07-07 16:10:25
20260624120000	2026-07-07 16:10:25
20260626120000	2026-07-07 16:10:25
20260706120000	2026-07-07 16:10:25
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-11-05 16:27:47.461937
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-11-05 16:27:47.477833
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-11-05 16:27:47.542914
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-11-05 16:27:47.667784
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-11-05 16:27:47.674953
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-11-05 16:27:47.69248
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-11-05 16:27:47.698576
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-11-05 16:27:47.720536
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-11-05 16:27:47.729061
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-11-05 16:27:47.738947
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-11-05 16:27:47.747004
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-11-05 16:27:47.790889
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-11-05 16:27:47.801592
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-11-05 16:27:47.80843
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-11-05 16:27:47.843551
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-11-05 16:27:47.854151
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-11-05 16:27:47.863459
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-11-05 16:27:47.878287
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-11-05 16:27:47.901529
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-11-05 16:27:47.921854
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-11-05 16:27:47.930785
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-11-05 16:27:47.939403
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-11-05 16:27:48.773808
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2025-11-19 09:53:15.636082
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2025-11-19 09:53:15.644584
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2025-11-19 09:53:15.666394
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2025-11-19 09:53:15.670659
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-01-04 02:57:31.731446
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2025-11-05 16:27:47.485385
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2025-11-05 16:27:47.683063
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2025-11-05 16:27:47.706245
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2025-11-05 16:27:47.713944
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2025-11-05 16:27:47.946881
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2025-11-05 16:27:47.968668
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2025-11-05 16:27:48.698937
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2025-11-05 16:27:48.70874
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2025-11-05 16:27:48.721757
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2025-11-05 16:27:48.729683
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2025-11-05 16:27:48.737407
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2025-11-05 16:27:48.746497
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2025-11-05 16:27:48.748789
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2025-11-05 16:27:48.757517
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2025-11-05 16:27:48.763712
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2025-11-05 16:27:48.780276
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2025-11-05 16:27:48.792412
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2025-11-05 16:27:48.799768
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2025-11-05 16:27:48.809793
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2025-11-05 16:27:48.816698
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2025-11-05 16:27:48.824408
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2025-11-19 09:53:15.67438
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-02-11 06:46:00.90653
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-02-11 06:46:01.001811
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-02-11 06:46:01.003195
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-02-11 06:46:01.153647
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-02-11 06:46:01.157221
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-02-11 06:46:01.158652
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-07 03:21:10.575405
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-07 03:21:10.59764
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-02-11 06:46:01.170335
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-05-14 06:10:51.46801
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-05-14 06:10:51.499713
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY supabase_migrations.schema_migrations (version, statements, name) FROM stdin;
20260208041306	{"SET statement_timeout = 0","SET lock_timeout = 0","SET idle_in_transaction_session_timeout = 0","SET client_encoding = 'UTF8'","SET standard_conforming_strings = on","SELECT pg_catalog.set_config('search_path', '', false)","SET check_function_bodies = false","SET xmloption = content","SET client_min_messages = warning","SET row_security = off","COMMENT ON SCHEMA \\"public\\" IS 'standard public schema'","CREATE EXTENSION IF NOT EXISTS \\"pg_graphql\\" WITH SCHEMA \\"graphql\\"","CREATE EXTENSION IF NOT EXISTS \\"pg_stat_statements\\" WITH SCHEMA \\"extensions\\"","CREATE EXTENSION IF NOT EXISTS \\"pgcrypto\\" WITH SCHEMA \\"extensions\\"","CREATE EXTENSION IF NOT EXISTS \\"supabase_vault\\" WITH SCHEMA \\"vault\\"","CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\" WITH SCHEMA \\"extensions\\"","SET default_tablespace = ''","SET default_table_access_method = \\"heap\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"access_tokens\\" (\n    \\"token\\" \\"text\\" NOT NULL,\n    \\"judge_id\\" \\"uuid\\" NOT NULL,\n    \\"role\\" \\"text\\" DEFAULT 'judge'::\\"text\\" NOT NULL,\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"()\n)","ALTER TABLE \\"public\\".\\"access_tokens\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"event_log\\" (\n    \\"id\\" bigint NOT NULL,\n    \\"event_type\\" \\"text\\" NOT NULL,\n    \\"match_id\\" \\"uuid\\",\n    \\"judge_id\\" \\"uuid\\",\n    \\"epoch\\" integer,\n    \\"detail\\" \\"jsonb\\",\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"()\n)","ALTER TABLE \\"public\\".\\"event_log\\" OWNER TO \\"postgres\\"","CREATE SEQUENCE IF NOT EXISTS \\"public\\".\\"event_log_id_seq\\"\n    START WITH 1\n    INCREMENT BY 1\n    NO MINVALUE\n    NO MAXVALUE\n    CACHE 1","ALTER SEQUENCE \\"public\\".\\"event_log_id_seq\\" OWNER TO \\"postgres\\"","ALTER SEQUENCE \\"public\\".\\"event_log_id_seq\\" OWNED BY \\"public\\".\\"event_log\\".\\"id\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"expected_judges\\" (\n    \\"match_id\\" \\"uuid\\" NOT NULL,\n    \\"judge_id\\" \\"uuid\\" NOT NULL,\n    \\"sort_order\\" integer DEFAULT 0\n)","ALTER TABLE \\"public\\".\\"expected_judges\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"judges\\" (\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\n    \\"name\\" \\"text\\" NOT NULL,\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\n    \\"voice_key\\" \\"text\\"\n)","ALTER TABLE \\"public\\".\\"judges\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"match_snapshots\\" (\n    \\"id\\" bigint NOT NULL,\n    \\"match_id\\" \\"uuid\\" NOT NULL,\n    \\"epoch\\" integer NOT NULL,\n    \\"snapshot\\" \\"jsonb\\" NOT NULL,\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"() NOT NULL,\n    \\"github_path\\" \\"text\\",\n    \\"github_pushed_at\\" timestamp with time zone,\n    \\"winner\\" \\"text\\",\n    CONSTRAINT \\"match_snapshots_winner_check\\" CHECK ((\\"winner\\" = ANY (ARRAY['red'::\\"text\\", 'white'::\\"text\\"])))\n)","ALTER TABLE \\"public\\".\\"match_snapshots\\" OWNER TO \\"postgres\\"","CREATE SEQUENCE IF NOT EXISTS \\"public\\".\\"match_snapshots_id_seq\\"\n    START WITH 1\n    INCREMENT BY 1\n    NO MINVALUE\n    NO MAXVALUE\n    CACHE 1","ALTER SEQUENCE \\"public\\".\\"match_snapshots_id_seq\\" OWNER TO \\"postgres\\"","ALTER SEQUENCE \\"public\\".\\"match_snapshots_id_seq\\" OWNED BY \\"public\\".\\"match_snapshots\\".\\"id\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"matches\\" (\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\n    \\"code\\" \\"text\\",\n    \\"name\\" \\"text\\",\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\n    \\"red_team_name\\" \\"text\\",\n    \\"white_team_name\\" \\"text\\",\n    \\"num_bouts\\" integer\n)","ALTER TABLE \\"public\\".\\"matches\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"state\\" (\n    \\"id\\" integer DEFAULT 1 NOT NULL,\n    \\"epoch\\" integer DEFAULT 1 NOT NULL,\n    \\"accepting\\" boolean DEFAULT false NOT NULL,\n    \\"e3_reached\\" boolean DEFAULT false NOT NULL,\n    \\"updated_at\\" timestamp with time zone DEFAULT \\"now\\"(),\n    \\"current_match_id\\" \\"uuid\\",\n    \\"scoreboard_visible\\" boolean DEFAULT false,\n    \\"red_wins\\" integer DEFAULT 0 NOT NULL,\n    \\"white_wins\\" integer DEFAULT 0 NOT NULL,\n    \\"wins_updated_at\\" timestamp with time zone DEFAULT \\"now\\"() NOT NULL\n)","ALTER TABLE \\"public\\".\\"state\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"submissions\\" (\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\n    \\"match_id\\" \\"uuid\\" NOT NULL,\n    \\"judge_id\\" \\"uuid\\" NOT NULL,\n    \\"epoch\\" integer NOT NULL,\n    \\"revision\\" integer DEFAULT 1 NOT NULL,\n    \\"red_work\\" integer NOT NULL,\n    \\"red_app\\" integer NOT NULL,\n    \\"red_total\\" integer NOT NULL,\n    \\"red_flag\\" boolean NOT NULL,\n    \\"white_work\\" integer NOT NULL,\n    \\"white_app\\" integer NOT NULL,\n    \\"white_total\\" integer NOT NULL,\n    \\"white_flag\\" boolean NOT NULL,\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\n    \\"updated_at\\" timestamp with time zone DEFAULT \\"now\\"()\n)","ALTER TABLE \\"public\\".\\"submissions\\" OWNER TO \\"postgres\\"","ALTER TABLE ONLY \\"public\\".\\"event_log\\" ALTER COLUMN \\"id\\" SET DEFAULT \\"nextval\\"('\\"public\\".\\"event_log_id_seq\\"'::\\"regclass\\")","ALTER TABLE ONLY \\"public\\".\\"match_snapshots\\" ALTER COLUMN \\"id\\" SET DEFAULT \\"nextval\\"('\\"public\\".\\"match_snapshots_id_seq\\"'::\\"regclass\\")","ALTER TABLE ONLY \\"public\\".\\"access_tokens\\"\n    ADD CONSTRAINT \\"access_tokens_pkey\\" PRIMARY KEY (\\"token\\")","ALTER TABLE ONLY \\"public\\".\\"event_log\\"\n    ADD CONSTRAINT \\"event_log_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"expected_judges\\"\n    ADD CONSTRAINT \\"expected_judges_pkey\\" PRIMARY KEY (\\"match_id\\", \\"judge_id\\")","ALTER TABLE ONLY \\"public\\".\\"judges\\"\n    ADD CONSTRAINT \\"judges_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"judges\\"\n    ADD CONSTRAINT \\"judges_voice_key_key\\" UNIQUE (\\"voice_key\\")","ALTER TABLE ONLY \\"public\\".\\"match_snapshots\\"\n    ADD CONSTRAINT \\"match_snapshots_match_epoch_unique\\" UNIQUE (\\"match_id\\", \\"epoch\\")","ALTER TABLE ONLY \\"public\\".\\"match_snapshots\\"\n    ADD CONSTRAINT \\"match_snapshots_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"matches\\"\n    ADD CONSTRAINT \\"matches_code_key\\" UNIQUE (\\"code\\")","ALTER TABLE ONLY \\"public\\".\\"matches\\"\n    ADD CONSTRAINT \\"matches_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"state\\"\n    ADD CONSTRAINT \\"state_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"submissions\\"\n    ADD CONSTRAINT \\"submissions_pkey\\" PRIMARY KEY (\\"id\\")","CREATE UNIQUE INDEX \\"idx_match_snapshots_unique\\" ON \\"public\\".\\"match_snapshots\\" USING \\"btree\\" (\\"match_id\\", \\"epoch\\")","CREATE UNIQUE INDEX \\"submissions_match_judge_epoch_idx\\" ON \\"public\\".\\"submissions\\" USING \\"btree\\" (\\"match_id\\", \\"judge_id\\", \\"epoch\\")","ALTER TABLE ONLY \\"public\\".\\"access_tokens\\"\n    ADD CONSTRAINT \\"access_tokens_judge_id_fkey\\" FOREIGN KEY (\\"judge_id\\") REFERENCES \\"public\\".\\"judges\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"expected_judges\\"\n    ADD CONSTRAINT \\"expected_judges_judge_id_fkey\\" FOREIGN KEY (\\"judge_id\\") REFERENCES \\"public\\".\\"judges\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"expected_judges\\"\n    ADD CONSTRAINT \\"expected_judges_match_id_fkey\\" FOREIGN KEY (\\"match_id\\") REFERENCES \\"public\\".\\"matches\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"match_snapshots\\"\n    ADD CONSTRAINT \\"match_snapshots_match_id_fkey\\" FOREIGN KEY (\\"match_id\\") REFERENCES \\"public\\".\\"matches\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"state\\"\n    ADD CONSTRAINT \\"state_current_match_id_fkey\\" FOREIGN KEY (\\"current_match_id\\") REFERENCES \\"public\\".\\"matches\\"(\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"submissions\\"\n    ADD CONSTRAINT \\"submissions_judge_id_fkey\\" FOREIGN KEY (\\"judge_id\\") REFERENCES \\"public\\".\\"judges\\"(\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"submissions\\"\n    ADD CONSTRAINT \\"submissions_match_id_fkey\\" FOREIGN KEY (\\"match_id\\") REFERENCES \\"public\\".\\"matches\\"(\\"id\\") ON DELETE CASCADE","ALTER PUBLICATION \\"supabase_realtime\\" OWNER TO \\"postgres\\"","GRANT USAGE ON SCHEMA \\"public\\" TO \\"postgres\\"","GRANT USAGE ON SCHEMA \\"public\\" TO \\"anon\\"","GRANT USAGE ON SCHEMA \\"public\\" TO \\"authenticated\\"","GRANT USAGE ON SCHEMA \\"public\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"access_tokens\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"access_tokens\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"access_tokens\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"event_log\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"event_log\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"event_log\\" TO \\"service_role\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"event_log_id_seq\\" TO \\"anon\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"event_log_id_seq\\" TO \\"authenticated\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"event_log_id_seq\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"expected_judges\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"expected_judges\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"expected_judges\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"judges\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"judges\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"judges\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"match_snapshots\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"match_snapshots\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"match_snapshots\\" TO \\"service_role\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"match_snapshots_id_seq\\" TO \\"anon\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"match_snapshots_id_seq\\" TO \\"authenticated\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"match_snapshots_id_seq\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"matches\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"matches\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"matches\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"state\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"state\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"state\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"submissions\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"submissions\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"submissions\\" TO \\"service_role\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON SEQUENCES TO \\"postgres\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON SEQUENCES TO \\"anon\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON SEQUENCES TO \\"authenticated\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON SEQUENCES TO \\"service_role\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON FUNCTIONS TO \\"postgres\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON FUNCTIONS TO \\"anon\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON FUNCTIONS TO \\"authenticated\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON FUNCTIONS TO \\"service_role\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON TABLES TO \\"postgres\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON TABLES TO \\"anon\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON TABLES TO \\"authenticated\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON TABLES TO \\"service_role\\"","drop extension if exists \\"pg_net\\"","CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()","CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger()","CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger()","CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger()","CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()"}	remote_schema
20260304000001	{"-- 20260304000001_enable_rls.sql\r\n-- ① RLS 有効化（フェーズ1）\r\n--\r\n-- 適用タイミング: 即座に適用可能。管理画面・Edge Function への影響なし。\r\n-- 主なセキュリティ効果:\r\n--   - access_tokens を anon から完全に隠蔽（トークン盗用を防止）\r\n--   - submissions への直接 INSERT/UPDATE を block（偽スコア注入を防止）\r\n--   - event_log を anon から完全に隠蔽\r\n--   - match_snapshots への直接書き込みを block\r\n-- 暫定措置（フェーズ2の20260304000003で削除）:\r\n--   - state / matches / judges / expected_judges の anon 書き込みを暫定許可\r\n--     （管理画面の直接REST呼び出しが残っているため。フェーズ2でEdge Function化後に削除）\r\n\r\n-- ================================================================\r\n-- 全テーブルに RLS を有効化\r\n-- ================================================================\r\nALTER TABLE public.access_tokens        ENABLE ROW LEVEL SECURITY","ALTER TABLE public.event_log            ENABLE ROW LEVEL SECURITY","ALTER TABLE public.expected_judges      ENABLE ROW LEVEL SECURITY","ALTER TABLE public.judges               ENABLE ROW LEVEL SECURITY","ALTER TABLE public.match_snapshots      ENABLE ROW LEVEL SECURITY","ALTER TABLE public.matches              ENABLE ROW LEVEL SECURITY","ALTER TABLE public.state                ENABLE ROW LEVEL SECURITY","ALTER TABLE public.submissions          ENABLE ROW LEVEL SECURITY","-- ================================================================\r\n-- access_tokens: anon/authenticated アクセス完全禁止\r\n-- （service_role = Edge Functions はRLSをバイパスするため問題なし）\r\n-- ================================================================\r\n-- ポリシーなし = deny all for anon/authenticated\r\n\r\n-- ================================================================\r\n-- event_log: anon/authenticated アクセス完全禁止\r\n-- ================================================================\r\n-- ポリシーなし = deny all for anon/authenticated\r\n\r\n-- ================================================================\r\n-- submissions: anon は SELECT のみ（スコアボード表示に必要）\r\n--   INSERT / UPDATE / DELETE は service_role (Edge Function) のみ\r\n-- ================================================================\r\nCREATE POLICY \\"submissions_select\\"\r\n  ON public.submissions\r\n  FOR SELECT TO anon, authenticated\r\n  USING (true)","-- ================================================================\r\n-- match_snapshots: anon は SELECT のみ（スコアボード・履歴表示に必要）\r\n-- ================================================================\r\nCREATE POLICY \\"match_snapshots_select\\"\r\n  ON public.match_snapshots\r\n  FOR SELECT TO anon, authenticated\r\n  USING (true)","-- ================================================================\r\n-- state: SELECT オープン（スコアボード・管理画面で必要）\r\n--        UPDATE 暫定許可（管理画面の patchState() / scoreboard_visible 操作に必要）\r\n--        ※ フェーズ2 migration 20260304000003 で UPDATE policy を削除\r\n-- ================================================================\r\nCREATE POLICY \\"state_select\\"\r\n  ON public.state\r\n  FOR SELECT TO anon, authenticated\r\n  USING (true)","CREATE POLICY \\"state_update_temp\\"\r\n  ON public.state\r\n  FOR UPDATE TO anon\r\n  USING (true)\r\n  WITH CHECK (true)","-- ================================================================\r\n-- matches: SELECT オープン（管理画面・OBSで必要）\r\n--          INSERT/UPDATE 暫定許可（管理画面の直接REST呼び出しに必要）\r\n--          ※ フェーズ2 migration 20260304000003 で書き込みポリシーを削除\r\n-- ================================================================\r\nCREATE POLICY \\"matches_select\\"\r\n  ON public.matches\r\n  FOR SELECT TO anon, authenticated\r\n  USING (true)","CREATE POLICY \\"matches_insert_temp\\"\r\n  ON public.matches\r\n  FOR INSERT TO anon\r\n  WITH CHECK (true)","CREATE POLICY \\"matches_update_temp\\"\r\n  ON public.matches\r\n  FOR UPDATE TO anon\r\n  USING (true)\r\n  WITH CHECK (true)","-- ================================================================\r\n-- judges: SELECT オープン（審査員名表示に必要）\r\n--         INSERT/UPDATE 暫定許可（管理画面の直接REST呼び出しに必要）\r\n--         ※ フェーズ2 migration 20260304000003 で書き込みポリシーを削除\r\n-- ================================================================\r\nCREATE POLICY \\"judges_select\\"\r\n  ON public.judges\r\n  FOR SELECT TO anon, authenticated\r\n  USING (true)","CREATE POLICY \\"judges_insert_temp\\"\r\n  ON public.judges\r\n  FOR INSERT TO anon\r\n  WITH CHECK (true)","CREATE POLICY \\"judges_update_temp\\"\r\n  ON public.judges\r\n  FOR UPDATE TO anon\r\n  USING (true)\r\n  WITH CHECK (true)","-- ================================================================\r\n-- expected_judges: SELECT オープン（管理画面・審査員情報表示に必要）\r\n--                  INSERT/DELETE 暫定許可（管理画面の直接REST呼び出しに必要）\r\n--                  ※ フェーズ2 migration 20260304000003 で書き込みポリシーを削除\r\n-- ================================================================\r\nCREATE POLICY \\"expected_judges_select\\"\r\n  ON public.expected_judges\r\n  FOR SELECT TO anon, authenticated\r\n  USING (true)","CREATE POLICY \\"expected_judges_insert_temp\\"\r\n  ON public.expected_judges\r\n  FOR INSERT TO anon\r\n  WITH CHECK (true)","CREATE POLICY \\"expected_judges_delete_temp\\"\r\n  ON public.expected_judges\r\n  FOR DELETE TO anon\r\n  USING (true)"}	enable_rls
20260304000002	{"-- 20260304000002_add_venues.sql\r\n-- ② 会場（venues）テーブルの追加とスキーマ変更\r\n--\r\n-- 適用タイミング: 新Edge Functions (admin-add-judge, admin-set-match-judges,\r\n--                 admin-patch-state) のデプロイ と 管理画面更新の前後に適用。\r\n--                 ただし 20260304000003 の適用は更新デプロイ完了後。\r\n--\r\n-- 変更内容:\r\n--   1. venues テーブル新設\r\n--   2. venues テーブルに RLS + anon SELECT ポリシー\r\n--   3. state テーブルに venue_id 列追加（NOT NULL, UNIQUE, FK→venues）\r\n--   4. access_tokens テーブルに venue_id 列追加（NOT NULL, FK→venues）\r\n--   5. デフォルト会場 \\"default\\" を挿入し、既存データを紐付け\r\n\r\n-- ================================================================\r\n-- 1. venues テーブル作成\r\n-- ================================================================\r\nCREATE TABLE IF NOT EXISTS public.venues (\r\n    id          uuid        DEFAULT gen_random_uuid() NOT NULL,\r\n    code        text        NOT NULL,\r\n    name        text        NOT NULL,\r\n    created_at  timestamptz DEFAULT now(),\r\n    CONSTRAINT venues_pkey     PRIMARY KEY (id),\r\n    CONSTRAINT venues_code_key UNIQUE (code)\r\n)","ALTER TABLE public.venues OWNER TO postgres","GRANT ALL ON TABLE public.venues TO anon","GRANT ALL ON TABLE public.venues TO authenticated","GRANT ALL ON TABLE public.venues TO service_role","-- ================================================================\r\n-- 2. venues に RLS を有効化し、anon は SELECT のみ許可\r\n-- ================================================================\r\nALTER TABLE public.venues ENABLE ROW LEVEL SECURITY","CREATE POLICY \\"venues_select\\"\r\n  ON public.venues\r\n  FOR SELECT TO anon, authenticated\r\n  USING (true)","-- ================================================================\r\n-- 3. デフォルト会場 \\"default\\" を挿入（既存Supabaseプロジェクトとの互換）\r\n-- ================================================================\r\nINSERT INTO public.venues (code, name)\r\nVALUES ('default', 'メイン会場')\r\nON CONFLICT (code) DO NOTHING","-- ================================================================\r\n-- 4. state テーブルに venue_id 列を追加\r\n--    - 既存の id=1 行はデフォルト会場に紐付け\r\n--    - UNIQUE 制約: 会場ごとに state 行が1つ\r\n-- ================================================================\r\nALTER TABLE public.state\r\n    ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues (id)","UPDATE public.state\r\nSET venue_id = (SELECT id FROM public.venues WHERE code = 'default')\r\nWHERE venue_id IS NULL","ALTER TABLE public.state\r\n    ALTER COLUMN venue_id SET NOT NULL","ALTER TABLE public.state\r\n    ADD CONSTRAINT state_venue_id_key UNIQUE (venue_id)","-- ================================================================\r\n-- 5. access_tokens テーブルに venue_id 列を追加\r\n--    - 既存トークンはデフォルト会場に紐付け\r\n-- ================================================================\r\nALTER TABLE public.access_tokens\r\n    ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues (id)","UPDATE public.access_tokens\r\nSET venue_id = (SELECT id FROM public.venues WHERE code = 'default')\r\nWHERE venue_id IS NULL","ALTER TABLE public.access_tokens\r\n    ALTER COLUMN venue_id SET NOT NULL","-- ================================================================\r\n-- 備考: anon による state/matches/judges/expected_judges への直接書き込みは\r\n-- 引き続き 20260304000001 の暫定ポリシーで許可されています。\r\n-- Edge Functions と管理画面の更新完了後に 20260304000003 を適用し、\r\n-- それらの暫定ポリシーを削除してください。\r\n-- ================================================================"}	add_venues
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: event_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_log_id_seq', 624, true);


--
-- Name: match_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_snapshots_id_seq', 83, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: access_tokens access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_tokens
    ADD CONSTRAINT access_tokens_pkey PRIMARY KEY (token);


--
-- Name: event_log event_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_log
    ADD CONSTRAINT event_log_pkey PRIMARY KEY (id);


--
-- Name: expected_judges expected_judges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expected_judges
    ADD CONSTRAINT expected_judges_pkey PRIMARY KEY (match_id, judge_id);


--
-- Name: judges judges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.judges
    ADD CONSTRAINT judges_pkey PRIMARY KEY (id);


--
-- Name: judges judges_voice_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.judges
    ADD CONSTRAINT judges_voice_key_key UNIQUE (voice_key);


--
-- Name: match_snapshots match_snapshots_match_epoch_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_snapshots
    ADD CONSTRAINT match_snapshots_match_epoch_unique UNIQUE (match_id, epoch);


--
-- Name: match_snapshots match_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_snapshots
    ADD CONSTRAINT match_snapshots_pkey PRIMARY KEY (id);


--
-- Name: matches matches_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_code_key UNIQUE (code);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: state state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state
    ADD CONSTRAINT state_pkey PRIMARY KEY (id);


--
-- Name: state state_venue_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state
    ADD CONSTRAINT state_venue_id_key UNIQUE (venue_id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: venues venues_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_code_key UNIQUE (code);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: idx_match_snapshots_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_match_snapshots_unique ON public.match_snapshots USING btree (match_id, epoch);


--
-- Name: submissions_match_judge_epoch_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX submissions_match_judge_epoch_idx ON public.submissions USING btree (match_id, judge_id, epoch);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: access_tokens access_tokens_judge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_tokens
    ADD CONSTRAINT access_tokens_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.judges(id) ON DELETE CASCADE;


--
-- Name: access_tokens access_tokens_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_tokens
    ADD CONSTRAINT access_tokens_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id);


--
-- Name: expected_judges expected_judges_judge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expected_judges
    ADD CONSTRAINT expected_judges_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.judges(id) ON DELETE CASCADE;


--
-- Name: expected_judges expected_judges_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expected_judges
    ADD CONSTRAINT expected_judges_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_snapshots match_snapshots_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_snapshots
    ADD CONSTRAINT match_snapshots_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: state state_current_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state
    ADD CONSTRAINT state_current_match_id_fkey FOREIGN KEY (current_match_id) REFERENCES public.matches(id);


--
-- Name: state state_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state
    ADD CONSTRAINT state_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id);


--
-- Name: submissions submissions_judge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES public.judges(id);


--
-- Name: submissions submissions_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: access_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: event_log; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

--
-- Name: expected_judges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.expected_judges ENABLE ROW LEVEL SECURITY;

--
-- Name: expected_judges expected_judges_delete_temp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY expected_judges_delete_temp ON public.expected_judges FOR DELETE TO anon USING (true);


--
-- Name: expected_judges expected_judges_insert_temp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY expected_judges_insert_temp ON public.expected_judges FOR INSERT TO anon WITH CHECK (true);


--
-- Name: expected_judges expected_judges_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY expected_judges_select ON public.expected_judges FOR SELECT TO authenticated, anon USING (true);


--
-- Name: judges; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;

--
-- Name: judges judges_insert_temp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY judges_insert_temp ON public.judges FOR INSERT TO anon WITH CHECK (true);


--
-- Name: judges judges_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY judges_select ON public.judges FOR SELECT TO authenticated, anon USING (true);


--
-- Name: judges judges_update_temp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY judges_update_temp ON public.judges FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: match_snapshots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.match_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: match_snapshots match_snapshots_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY match_snapshots_select ON public.match_snapshots FOR SELECT TO authenticated, anon USING (true);


--
-- Name: matches; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

--
-- Name: matches matches_insert_temp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY matches_insert_temp ON public.matches FOR INSERT TO anon WITH CHECK (true);


--
-- Name: matches matches_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY matches_select ON public.matches FOR SELECT TO authenticated, anon USING (true);


--
-- Name: matches matches_update_temp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY matches_update_temp ON public.matches FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: state; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.state ENABLE ROW LEVEL SECURITY;

--
-- Name: state state_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY state_select ON public.state FOR SELECT TO authenticated, anon USING (true);


--
-- Name: state state_update_temp; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY state_update_temp ON public.state FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: submissions submissions_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY submissions_select ON public.submissions FOR SELECT TO authenticated, anon USING (true);


--
-- Name: venues; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

--
-- Name: venues venues_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY venues_select ON public.venues FOR SELECT TO authenticated, anon USING (true);


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO service_role;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE access_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.access_tokens TO anon;
GRANT ALL ON TABLE public.access_tokens TO authenticated;
GRANT ALL ON TABLE public.access_tokens TO service_role;


--
-- Name: TABLE event_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.event_log TO anon;
GRANT ALL ON TABLE public.event_log TO authenticated;
GRANT ALL ON TABLE public.event_log TO service_role;


--
-- Name: SEQUENCE event_log_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.event_log_id_seq TO anon;
GRANT ALL ON SEQUENCE public.event_log_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.event_log_id_seq TO service_role;


--
-- Name: TABLE expected_judges; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.expected_judges TO anon;
GRANT ALL ON TABLE public.expected_judges TO authenticated;
GRANT ALL ON TABLE public.expected_judges TO service_role;


--
-- Name: TABLE judges; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.judges TO anon;
GRANT ALL ON TABLE public.judges TO authenticated;
GRANT ALL ON TABLE public.judges TO service_role;


--
-- Name: TABLE match_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.match_snapshots TO anon;
GRANT ALL ON TABLE public.match_snapshots TO authenticated;
GRANT ALL ON TABLE public.match_snapshots TO service_role;


--
-- Name: SEQUENCE match_snapshots_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.match_snapshots_id_seq TO anon;
GRANT ALL ON SEQUENCE public.match_snapshots_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.match_snapshots_id_seq TO service_role;


--
-- Name: TABLE matches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.matches TO anon;
GRANT ALL ON TABLE public.matches TO authenticated;
GRANT ALL ON TABLE public.matches TO service_role;


--
-- Name: TABLE state; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.state TO anon;
GRANT ALL ON TABLE public.state TO authenticated;
GRANT ALL ON TABLE public.state TO service_role;


--
-- Name: TABLE submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.submissions TO anon;
GRANT ALL ON TABLE public.submissions TO authenticated;
GRANT ALL ON TABLE public.submissions TO service_role;


--
-- Name: TABLE venues; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.venues TO anon;
GRANT ALL ON TABLE public.venues TO authenticated;
GRANT ALL ON TABLE public.venues TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict L26yeJRWxzfXef99eb8gznemS1sjmAXBYjRuAlfqP0yTDOqgfQig6vxDM0x3gR6

