--
-- PostgreSQL database dump
--

\restrict S2TI2BA6d8RaEM0ub4hcJrr0HPmafquPkhwXlVqeGI8PcXyVONSAGoJ9nPa3nXY

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: consultation_sessions; Type: TABLE; Schema: public; Owner: emr_user
--

CREATE TABLE public.consultation_sessions (
    session_id character varying(20) NOT NULL,
    patient_id character varying(36) NOT NULL,
    doctor_id character varying(36) NOT NULL,
    session_type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    started_at character varying(50) NOT NULL,
    ended_at character varying(50),
    paused_at character varying(50),
    resumed_at character varying(50),
    total_duration double precision,
    audio_file_url character varying(500),
    audio_file_size integer,
    audio_format character varying(10),
    audio_duration double precision,
    chief_complaint character varying(500),
    notes character varying(2000),
    audio_quality_score double precision,
    transcription_confidence double precision,
    recording_settings jsonb,
    stt_settings jsonb,
    billing_code character varying(20),
    billing_amount double precision,
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.consultation_sessions OWNER TO emr_user;

--
-- Name: intake_patients; Type: TABLE; Schema: public; Owner: emr_user
--

CREATE TABLE public.intake_patients (
    main_patient_id character varying(36),
    name character varying(200) NOT NULL,
    age integer NOT NULL,
    sex character varying(20) NOT NULL,
    address text,
    informants jsonb NOT NULL,
    illness_duration_value integer NOT NULL,
    illness_duration_unit character varying(20) NOT NULL,
    referred_by character varying(200),
    precipitating_factor_narrative text,
    precipitating_factor_tags jsonb,
    doctor_id character varying(36) NOT NULL,
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.intake_patients OWNER TO emr_user;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: emr_user
--

CREATE TABLE public.patients (
    patient_id character varying(20) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    date_of_birth character varying(20) NOT NULL,
    gender character varying(30) NOT NULL,
    phone_primary character varying(20),
    phone_secondary character varying(20),
    email character varying(255),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    postal_code character varying(20),
    country character varying(100),
    emergency_contact_name character varying(200),
    emergency_contact_phone character varying(20),
    emergency_contact_relationship character varying(50),
    blood_group character varying(10),
    allergies character varying(1000),
    medical_history character varying(5000),
    current_medications character varying(2000),
    insurance_provider character varying(200),
    insurance_policy_number character varying(100),
    insurance_group_number character varying(100),
    occupation character varying(200),
    marital_status character varying(20),
    preferred_language character varying(50),
    created_by character varying(36) NOT NULL,
    name_hash character varying(64) NOT NULL,
    phone_hash character varying(64),
    email_hash character varying(64),
    notes text,
    tags character varying(500),
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.patients OWNER TO emr_user;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: emr_user
--

CREATE TABLE public.reports (
    session_id character varying(36) NOT NULL,
    template_id character varying(36),
    transcription_id character varying(36) NOT NULL,
    report_type character varying(30) NOT NULL,
    status character varying(20) NOT NULL,
    version integer NOT NULL,
    generated_content character varying(20000),
    structured_data jsonb,
    ai_model character varying(100),
    ai_prompt_version character varying(20),
    generation_started_at character varying(50),
    generation_completed_at character varying(50),
    generation_duration integer,
    confidence_score character varying(10),
    quality_score character varying(10),
    completeness_score character varying(10),
    reviewed_by character varying(36),
    signed_by character varying(36),
    reviewed_at character varying(50),
    signed_at character varying(50),
    manual_corrections character varying(5000),
    correction_notes text,
    manually_edited boolean,
    exported_formats jsonb,
    shared_with jsonb,
    error_message text,
    retry_count integer,
    id character varying(36) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reports OWNER TO emr_user;

--
-- Data for Name: consultation_sessions; Type: TABLE DATA; Schema: public; Owner: emr_user
--

COPY public.consultation_sessions (session_id, patient_id, doctor_id, session_type, status, started_at, ended_at, paused_at, resumed_at, total_duration, audio_file_url, audio_file_size, audio_format, audio_duration, chief_complaint, notes, audio_quality_score, transcription_confidence, recording_settings, stt_settings, billing_code, billing_amount, id, created_at, updated_at) FROM stdin;
CS-20251003-41052FFA	fee1ff5f-dc7d-4f6e-8cb6-d5ba83bae333	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 16:18:25.595073+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm8zX2RSWGh3SC1xZmNTUHE0cE42aFdsTHdra2Z3S2p6SENzOVdXRTRyVGdXeFdTdUZrYXc1d1VnYUQ1bnlNbkFvUUxMSDdWcmJnbjhzLUxPamkzYkJVNGRiOTZCN1JSTC1Ld1B2c19nZ2RaeVJNQ3M9	\N	\N	\N	\N	\N	\N	\N	c9e01921-e0cd-4a0b-94f7-ae3b2d28475c	2025-10-03 16:18:25.595074+00	2025-10-03 16:18:25.588367+00
CS-20251003-D53C288B	083ee3df-7e8b-4c5d-b0a2-7c750bea85ce	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 16:18:59.623307+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm8zX2R6Y2QxWXZMQVNBSXVrZEw0NHUzS0NVNzBlNmp0Rzg2dlgzWlo1NVJvNzFzb3dnTWduTWVSMkF6dUZWclFJRkNTZ0J1NmVQUGZNMmtnWmZWTC1mLWVlbkduYmhwWTVJbUVZTDBYd0htS2xxZU09	\N	\N	\N	\N	\N	\N	\N	8918f26e-b16c-4202-a076-a857fbcd7b43	2025-10-03 16:18:59.623308+00	2025-10-03 16:18:59.61405+00
CS-20251003-ADB39F03	a7ba587d-a947-49a0-b0cc-f0fb9583eb34	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 16:19:22.92352+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm8zX2VLdUdjU1lQc0ZERHp2UDNwUTZPd1Z3OXB1VTVXbWFUZ2UzTGhJdlR3a0t2U1pmTC1wZS1mc0ppMjg4cXMwODZIdWxzczFzTVcxbVNialJqNDhfRHBVRnJ1OHZld3gyd2RwQnFycmFsMGhRTXM9	\N	\N	\N	\N	\N	\N	\N	8d284812-da06-4b27-b83f-61aea5b8a7ea	2025-10-03 16:19:22.923522+00	2025-10-03 16:19:22.920976+00
CS-20251003-CE678D19	4e3ae565-dc58-4af5-858f-326a3eabe113	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 16:20:38.903312+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm8zX2ZXc3lEM1hPYVMzYUFPQW5pVkJQRFZfOUJEaUNqNDVpelNQN3owdllFdmpPM3VOUlc3a2FhWXk5T19nWnpGWlVLbm9KVEV2X0plWWhwQzlYRlVyNmVHbFpvX1BORjhHZW9mVjRBd0JvYkx4LW89	\N	\N	\N	\N	\N	\N	\N	d80e939f-fd97-4c66-aca6-0becc23dd7e1	2025-10-03 16:20:38.903316+00	2025-10-03 16:20:38.880316+00
CS-20251003-CC9109F2	31df7ae6-946f-4e80-b9a5-1adea33d94e4	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 16:21:47.399074+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm8zX2diSGJpMEo1SEFhQmMyajVQSE5MTUFhWDlPbEN0R2R2NWFfdF9URXdVSzk3T3AwekF1a25vQWZ4ZmFiejk0TmNULVc5U1R1ekwxR0lPOUtYbzVibmRoUmY1a2ktWGxuazdmTVNyVjMxZGswYnM9	\N	\N	\N	\N	\N	\N	\N	2cb8bf77-f548-47a1-8a9a-f3086b12836f	2025-10-03 16:21:47.399077+00	2025-10-03 16:21:47.384337+00
CS-20251003-614F7B28	e6848cd4-7d4e-4f31-9e96-d1bf9387c174	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 16:29:33.998126+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm8zX250VXJRU2pfRFd5cng3RlRQTUJ1LWFMeVdLdk50dEZlVGJYS0VtNFYyS0NMWHRqZXJZTV9xelowZ3hsQkxKMlUyclVNa3JqZU1kMzRocDlRcXc3NlJxZGNRbU5YLXEzQVExVlhLNmp3cDJUTFE9	\N	\N	\N	\N	\N	\N	\N	586b7bbc-b5e7-47b9-9f6e-1b7c1fda6b84	2025-10-03 16:29:33.998127+00	2025-10-03 16:29:33.995608+00
CS-20251003-F693D28D	56b9583f-20af-402f-aab5-17e873f32837	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 16:30:17.954566+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm8zX29aaGJmMlJJdEd5OUtieXFhTVY0NVczbXM4MHdxNVoteTBlQ2pEUFUtQmRFbmlIcHBtMHpKNk5YNFIzZDhHSkZLOUdtU1E2cDRzemZvd1FpNU1HNkRBVEE9PQ==	\N	\N	\N	\N	\N	\N	\N	ba7d926d-dc1b-40ce-b770-d4689b7cffd6	2025-10-03 16:30:17.954567+00	2025-10-03 16:30:17.950584+00
CS-20251003-A9444218	cb868482-9017-485e-935a-c34befc0cc48	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 16:32:29.62537+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm8zX3FkaHBSZTkxZVRJRVlESkZVVkxabnd3Sm1OMkpvVnJnbG5SYUt1SGwwVlVxbVJIcDlVREpwQ2NLbmFSS0JDM2E0djQzVEswNHNCd29qeGpvQjhLdG9UbkdFUU5qVzAtMFZuN0VZZ1h6RFBwMU09	\N	\N	\N	\N	\N	\N	\N	2eb3a516-7dd0-420b-aa0a-8633c3135362	2025-10-03 16:32:29.625373+00	2025-10-03 16:32:29.603119+00
CS-20251003-5E6A5181	8754d0d5-a965-43d2-8eba-06782f9d105b	63eb2210-0019-4e13-99d8-cc11452fdba7	consultation	in_progress	2025-10-03 19:03:59.601323+00	\N	\N	\N	0	\N	\N	\N	\N	Z0FBQUFBQm80QjRmRUxtUWlHcEVYNWRJQTROcHNIY0xPamVlOUtTZDd4OTFmQjVSVHBOTkM5WUhrQW9hNGRQeGdmcnBIcE8xTzFFc01uajJMcTNxX1hFQkcyUWZLYi1qVGVRRnI2dWk4MVF4Sl9fSHB1WEFiWTA9	\N	\N	\N	\N	\N	\N	\N	2e2103f4-efb7-4563-b375-aa27141a1526	2025-10-03 19:03:59.601326+00	2025-10-03 19:03:59.578543+00
\.


--
-- Data for Name: intake_patients; Type: TABLE DATA; Schema: public; Owner: emr_user
--

COPY public.intake_patients (main_patient_id, name, age, sex, address, informants, illness_duration_value, illness_duration_unit, referred_by, precipitating_factor_narrative, precipitating_factor_tags, doctor_id, id, created_at, updated_at) FROM stdin;
\N	Rakesh sharma	22	Male		{"selection": ["Self"], "other_details": ""}	1	Weeks			[]	63eb2210-0019-4e13-99d8-cc11452fdba7	e33f1856-2883-4989-8e84-1f6fdad1e2d0	2025-10-03 15:11:02.875229+00	2025-10-03 15:11:02.875229+00
\N	Rakesh sharma	24	Male		{"selection": ["Self"], "other_details": ""}	7	Weeks			[]	63eb2210-0019-4e13-99d8-cc11452fdba7	a2d0b538-44e0-45cb-8e64-8de3952af30b	2025-10-03 15:19:09.786879+00	2025-10-03 15:19:09.786879+00
751357b6-e1f3-4413-b841-20d26538bfcf	Test Patient	30	Male	123 Test St	{"selection": ["Self"], "other_details": ""}	2	Weeks	Self	\N	[]	63eb2210-0019-4e13-99d8-cc11452fdba7	751357b6-e1f3-4413-b841-20d26538bfcf	2025-10-03 16:17:43.815633+00	2025-10-03 16:17:43.815633+00
fee1ff5f-dc7d-4f6e-8cb6-d5ba83bae333	John Doe	35	Male	123 Main St	{"selection": ["Self"], "other_details": ""}	3	Weeks	Self	\N	[]	63eb2210-0019-4e13-99d8-cc11452fdba7	fee1ff5f-dc7d-4f6e-8cb6-d5ba83bae333	2025-10-03 16:18:25.547975+00	2025-10-03 16:18:25.547975+00
083ee3df-7e8b-4c5d-b0a2-7c750bea85ce	Sarah Johnson	28	Female	456 Oak Ave	{"selection": ["Self"], "other_details": ""}	2	Months	Dr. Smith	\N	[]	63eb2210-0019-4e13-99d8-cc11452fdba7	083ee3df-7e8b-4c5d-b0a2-7c750bea85ce	2025-10-03 16:18:59.58081+00	2025-10-03 16:18:59.58081+00
a7ba587d-a947-49a0-b0cc-f0fb9583eb34	Alice Cooper	42	Female	789 Pine Rd	{"selection": ["Self"], "other_details": ""}	4	Weeks	Self	\N	[]	63eb2210-0019-4e13-99d8-cc11452fdba7	a7ba587d-a947-49a0-b0cc-f0fb9583eb34	2025-10-03 16:19:22.898078+00	2025-10-03 16:19:22.898078+00
4e3ae565-dc58-4af5-858f-326a3eabe113	Rakesh sharma	24	Male		{"selection": ["Self"], "other_details": ""}	1	Weeks			[]	63eb2210-0019-4e13-99d8-cc11452fdba7	4e3ae565-dc58-4af5-858f-326a3eabe113	2025-10-03 16:20:25.655599+00	2025-10-03 16:20:25.655599+00
31df7ae6-946f-4e80-b9a5-1adea33d94e4	Rakesh sharma	20	Male		{"selection": ["Self"], "other_details": ""}	2	Months			[]	63eb2210-0019-4e13-99d8-cc11452fdba7	31df7ae6-946f-4e80-b9a5-1adea33d94e4	2025-10-03 16:21:37.539984+00	2025-10-03 16:21:37.539984+00
e6848cd4-7d4e-4f31-9e96-d1bf9387c174	Michael Brown	33	Male	321 Elm St	{"selection": ["Self"], "other_details": ""}	5	Weeks	Self	\N	[]	63eb2210-0019-4e13-99d8-cc11452fdba7	e6848cd4-7d4e-4f31-9e96-d1bf9387c174	2025-10-03 16:29:33.968696+00	2025-10-03 16:29:33.968696+00
56b9583f-20af-402f-aab5-17e873f32837	Emma Wilson	27	Female	555 Oak St	{"selection": ["Self"], "other_details": ""}	3	Weeks	Friend	\N	[]	63eb2210-0019-4e13-99d8-cc11452fdba7	56b9583f-20af-402f-aab5-17e873f32837	2025-10-03 16:30:17.926603+00	2025-10-03 16:30:17.926603+00
cb868482-9017-485e-935a-c34befc0cc48	Rakesh sharma	22	Male		{"selection": ["Self"], "other_details": ""}	1	Weeks			[]	63eb2210-0019-4e13-99d8-cc11452fdba7	cb868482-9017-485e-935a-c34befc0cc48	2025-10-03 16:32:17.951706+00	2025-10-03 16:32:17.951706+00
2d8ea7fd-6ce5-423a-8f63-a26b7b866c7e	Rakesh Sharma	22	Male		{"selection": ["Self"], "other_details": ""}	2	Months			[]	63eb2210-0019-4e13-99d8-cc11452fdba7	2d8ea7fd-6ce5-423a-8f63-a26b7b866c7e	2025-10-03 18:49:16.660432+00	2025-10-03 18:49:16.660432+00
8754d0d5-a965-43d2-8eba-06782f9d105b	Rakesh sharma	22	Male		{"selection": ["Self"], "other_details": ""}	1	Weeks			[]	63eb2210-0019-4e13-99d8-cc11452fdba7	8754d0d5-a965-43d2-8eba-06782f9d105b	2025-10-03 19:00:54.082475+00	2025-10-03 19:00:54.082475+00
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: emr_user
--

COPY public.patients (patient_id, first_name, last_name, date_of_birth, gender, phone_primary, phone_secondary, email, address_line1, address_line2, city, state, postal_code, country, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, blood_group, allergies, medical_history, current_medications, insurance_provider, insurance_policy_number, insurance_group_number, occupation, marital_status, preferred_language, created_by, name_hash, phone_hash, email_hash, notes, tags, id, created_at, updated_at) FROM stdin;
PT751357B6-E	Test Patient		1990-01-01	Male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	751357b6-e1f3-4413-b841-20d26538bfcf	\N	\N	\N	\N	751357b6-e1f3-4413-b841-20d26538bfcf	2025-10-03 16:17:43.815633+00	2025-10-03 16:17:43.815633+00
PTFEE1FF5F-D	John Doe		1990-01-01	Male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	fee1ff5f-dc7d-4f6e-8cb6-d5ba83bae333	\N	\N	\N	\N	fee1ff5f-dc7d-4f6e-8cb6-d5ba83bae333	2025-10-03 16:18:25.547975+00	2025-10-03 16:18:25.547975+00
PT083EE3DF-7	Sarah Johnson		1990-01-01	Female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	083ee3df-7e8b-4c5d-b0a2-7c750bea85ce	\N	\N	\N	\N	083ee3df-7e8b-4c5d-b0a2-7c750bea85ce	2025-10-03 16:18:59.58081+00	2025-10-03 16:18:59.58081+00
PTA7BA587D-A	Alice Cooper		1990-01-01	Female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	a7ba587d-a947-49a0-b0cc-f0fb9583eb34	\N	\N	\N	\N	a7ba587d-a947-49a0-b0cc-f0fb9583eb34	2025-10-03 16:19:22.898078+00	2025-10-03 16:19:22.898078+00
PT4E3AE565-D	Rakesh sharma		1990-01-01	Male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	4e3ae565-dc58-4af5-858f-326a3eabe113	\N	\N	\N	\N	4e3ae565-dc58-4af5-858f-326a3eabe113	2025-10-03 16:20:25.655599+00	2025-10-03 16:20:25.655599+00
PT31DF7AE6-9	Rakesh sharma		1990-01-01	Male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	31df7ae6-946f-4e80-b9a5-1adea33d94e4	\N	\N	\N	\N	31df7ae6-946f-4e80-b9a5-1adea33d94e4	2025-10-03 16:21:37.539984+00	2025-10-03 16:21:37.539984+00
PTE6848CD4-7	Michael Brown		1990-01-01	Male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	e6848cd4-7d4e-4f31-9e96-d1bf9387c174	\N	\N	\N	\N	e6848cd4-7d4e-4f31-9e96-d1bf9387c174	2025-10-03 16:29:33.968696+00	2025-10-03 16:29:33.968696+00
PT56B9583F-2	Emma Wilson		1990-01-01	Female	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	56b9583f-20af-402f-aab5-17e873f32837	\N	\N	\N	\N	56b9583f-20af-402f-aab5-17e873f32837	2025-10-03 16:30:17.926603+00	2025-10-03 16:30:17.926603+00
PTCB868482-9	Rakesh sharma		1990-01-01	Male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	cb868482-9017-485e-935a-c34befc0cc48	\N	\N	\N	\N	cb868482-9017-485e-935a-c34befc0cc48	2025-10-03 16:32:17.951706+00	2025-10-03 16:32:17.951706+00
PT2D8EA7FD-6	Rakesh Sharma		1990-01-01	Male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	2d8ea7fd-6ce5-423a-8f63-a26b7b866c7e	\N	\N	\N	\N	2d8ea7fd-6ce5-423a-8f63-a26b7b866c7e	2025-10-03 18:49:16.660432+00	2025-10-03 18:49:16.660432+00
PT8754D0D5-A	Rakesh sharma		1990-01-01	Male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	63eb2210-0019-4e13-99d8-cc11452fdba7	8754d0d5-a965-43d2-8eba-06782f9d105b	\N	\N	\N	\N	8754d0d5-a965-43d2-8eba-06782f9d105b	2025-10-03 19:00:54.082475+00	2025-10-03 19:00:54.082475+00
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: emr_user
--

COPY public.reports (session_id, template_id, transcription_id, report_type, status, version, generated_content, structured_data, ai_model, ai_prompt_version, generation_started_at, generation_completed_at, generation_duration, confidence_score, quality_score, completeness_score, reviewed_by, signed_by, reviewed_at, signed_at, manual_corrections, correction_notes, manually_edited, exported_formats, shared_with, error_message, retry_count, id, created_at, updated_at) FROM stdin;
\.


--
-- Name: consultation_sessions pk_consultation_sessions; Type: CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.consultation_sessions
    ADD CONSTRAINT pk_consultation_sessions PRIMARY KEY (id);


--
-- Name: intake_patients pk_intake_patients; Type: CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.intake_patients
    ADD CONSTRAINT pk_intake_patients PRIMARY KEY (id);


--
-- Name: patients pk_patients; Type: CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT pk_patients PRIMARY KEY (id);


--
-- Name: reports pk_reports; Type: CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT pk_reports PRIMARY KEY (id);


--
-- Name: idx_patient_created_by; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE INDEX idx_patient_created_by ON public.patients USING btree (created_by);


--
-- Name: idx_patient_email_hash; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE INDEX idx_patient_email_hash ON public.patients USING btree (email_hash);


--
-- Name: idx_patient_name_hash; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE INDEX idx_patient_name_hash ON public.patients USING btree (name_hash);


--
-- Name: idx_patient_phone_hash; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE INDEX idx_patient_phone_hash ON public.patients USING btree (phone_hash);


--
-- Name: ix_consultation_sessions_session_id; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE UNIQUE INDEX ix_consultation_sessions_session_id ON public.consultation_sessions USING btree (session_id);


--
-- Name: ix_intake_patients_main_patient_id; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE INDEX ix_intake_patients_main_patient_id ON public.intake_patients USING btree (main_patient_id);


--
-- Name: ix_patients_email_hash; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE INDEX ix_patients_email_hash ON public.patients USING btree (email_hash);


--
-- Name: ix_patients_name_hash; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE INDEX ix_patients_name_hash ON public.patients USING btree (name_hash);


--
-- Name: ix_patients_patient_id; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE UNIQUE INDEX ix_patients_patient_id ON public.patients USING btree (patient_id);


--
-- Name: ix_patients_phone_hash; Type: INDEX; Schema: public; Owner: emr_user
--

CREATE INDEX ix_patients_phone_hash ON public.patients USING btree (phone_hash);


--
-- Name: consultation_sessions fk_consultation_sessions_doctor_id_users; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.consultation_sessions
    ADD CONSTRAINT fk_consultation_sessions_doctor_id_users FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: consultation_sessions fk_consultation_sessions_patient_id_patients; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.consultation_sessions
    ADD CONSTRAINT fk_consultation_sessions_patient_id_patients FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: intake_patients fk_intake_patients_doctor_id_users; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.intake_patients
    ADD CONSTRAINT fk_intake_patients_doctor_id_users FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: intake_patients fk_intake_patients_main_patient_id_patients; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.intake_patients
    ADD CONSTRAINT fk_intake_patients_main_patient_id_patients FOREIGN KEY (main_patient_id) REFERENCES public.patients(id);


--
-- Name: patients fk_patients_created_by_users; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT fk_patients_created_by_users FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: reports fk_reports_reviewed_by_users; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_reports_reviewed_by_users FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: reports fk_reports_session_id_consultation_sessions; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_reports_session_id_consultation_sessions FOREIGN KEY (session_id) REFERENCES public.consultation_sessions(id);


--
-- Name: reports fk_reports_signed_by_users; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_reports_signed_by_users FOREIGN KEY (signed_by) REFERENCES public.users(id);


--
-- Name: reports fk_reports_template_id_report_templates; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_reports_template_id_report_templates FOREIGN KEY (template_id) REFERENCES public.report_templates(id);


--
-- Name: reports fk_reports_transcription_id_transcriptions; Type: FK CONSTRAINT; Schema: public; Owner: emr_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_reports_transcription_id_transcriptions FOREIGN KEY (transcription_id) REFERENCES public.transcriptions(id);


--
-- PostgreSQL database dump complete
--

\unrestrict S2TI2BA6d8RaEM0ub4hcJrr0HPmafquPkhwXlVqeGI8PcXyVONSAGoJ9nPa3nXY

