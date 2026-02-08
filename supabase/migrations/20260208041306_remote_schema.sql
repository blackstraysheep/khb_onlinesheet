


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."access_tokens" (
    "token" "text" NOT NULL,
    "judge_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'judge'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."access_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_log" (
    "id" bigint NOT NULL,
    "event_type" "text" NOT NULL,
    "match_id" "uuid",
    "judge_id" "uuid",
    "epoch" integer,
    "detail" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."event_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."event_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."event_log_id_seq" OWNED BY "public"."event_log"."id";



CREATE TABLE IF NOT EXISTS "public"."expected_judges" (
    "match_id" "uuid" NOT NULL,
    "judge_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."expected_judges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."judges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "voice_key" "text"
);


ALTER TABLE "public"."judges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."match_snapshots" (
    "id" bigint NOT NULL,
    "match_id" "uuid" NOT NULL,
    "epoch" integer NOT NULL,
    "snapshot" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "github_path" "text",
    "github_pushed_at" timestamp with time zone,
    "winner" "text",
    CONSTRAINT "match_snapshots_winner_check" CHECK (("winner" = ANY (ARRAY['red'::"text", 'white'::"text"])))
);


ALTER TABLE "public"."match_snapshots" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."match_snapshots_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."match_snapshots_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."match_snapshots_id_seq" OWNED BY "public"."match_snapshots"."id";



CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "red_team_name" "text",
    "white_team_name" "text",
    "num_bouts" integer
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."state" (
    "id" integer DEFAULT 1 NOT NULL,
    "epoch" integer DEFAULT 1 NOT NULL,
    "accepting" boolean DEFAULT false NOT NULL,
    "e3_reached" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "current_match_id" "uuid",
    "scoreboard_visible" boolean DEFAULT false,
    "red_wins" integer DEFAULT 0 NOT NULL,
    "white_wins" integer DEFAULT 0 NOT NULL,
    "wins_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid" NOT NULL,
    "judge_id" "uuid" NOT NULL,
    "epoch" integer NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "red_work" integer NOT NULL,
    "red_app" integer NOT NULL,
    "red_total" integer NOT NULL,
    "red_flag" boolean NOT NULL,
    "white_work" integer NOT NULL,
    "white_app" integer NOT NULL,
    "white_total" integer NOT NULL,
    "white_flag" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."event_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."event_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."match_snapshots" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."match_snapshots_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."access_tokens"
    ADD CONSTRAINT "access_tokens_pkey" PRIMARY KEY ("token");



ALTER TABLE ONLY "public"."event_log"
    ADD CONSTRAINT "event_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expected_judges"
    ADD CONSTRAINT "expected_judges_pkey" PRIMARY KEY ("match_id", "judge_id");



ALTER TABLE ONLY "public"."judges"
    ADD CONSTRAINT "judges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."judges"
    ADD CONSTRAINT "judges_voice_key_key" UNIQUE ("voice_key");



ALTER TABLE ONLY "public"."match_snapshots"
    ADD CONSTRAINT "match_snapshots_match_epoch_unique" UNIQUE ("match_id", "epoch");



ALTER TABLE ONLY "public"."match_snapshots"
    ADD CONSTRAINT "match_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."state"
    ADD CONSTRAINT "state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "idx_match_snapshots_unique" ON "public"."match_snapshots" USING "btree" ("match_id", "epoch");



CREATE UNIQUE INDEX "submissions_match_judge_epoch_idx" ON "public"."submissions" USING "btree" ("match_id", "judge_id", "epoch");



ALTER TABLE ONLY "public"."access_tokens"
    ADD CONSTRAINT "access_tokens_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "public"."judges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expected_judges"
    ADD CONSTRAINT "expected_judges_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "public"."judges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expected_judges"
    ADD CONSTRAINT "expected_judges_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_snapshots"
    ADD CONSTRAINT "match_snapshots_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."state"
    ADD CONSTRAINT "state_current_match_id_fkey" FOREIGN KEY ("current_match_id") REFERENCES "public"."matches"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "public"."judges"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."access_tokens" TO "anon";
GRANT ALL ON TABLE "public"."access_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."access_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."event_log" TO "anon";
GRANT ALL ON TABLE "public"."event_log" TO "authenticated";
GRANT ALL ON TABLE "public"."event_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expected_judges" TO "anon";
GRANT ALL ON TABLE "public"."expected_judges" TO "authenticated";
GRANT ALL ON TABLE "public"."expected_judges" TO "service_role";



GRANT ALL ON TABLE "public"."judges" TO "anon";
GRANT ALL ON TABLE "public"."judges" TO "authenticated";
GRANT ALL ON TABLE "public"."judges" TO "service_role";



GRANT ALL ON TABLE "public"."match_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."match_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."match_snapshots" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_snapshots_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."match_snapshots_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_snapshots_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."state" TO "anon";
GRANT ALL ON TABLE "public"."state" TO "authenticated";
GRANT ALL ON TABLE "public"."state" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";