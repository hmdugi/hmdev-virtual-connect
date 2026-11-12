create table if not exists public.vc_directory_candidates (
 id text primary key,
 display_name text not null check(length(display_name) between 1 and 100),
 agency text,
 primary_platform text,
 primary_url text,
 youtube_url text,
 social_urls jsonb not null default '[]'::jsonb check(jsonb_typeof(social_urls)='array'),
 topics text[] not null default '{}',
 career_started_no_later_than date,
 career_start_is_exact boolean not null default false,
 career_exception_approved boolean not null default false,
 career_exception_reason text,
 sources jsonb not null default '[]'::jsonb check(jsonb_typeof(sources)='array'),
 review_status text not null default 'pending' check(review_status in ('pending','eligible','excluded','hidden')),
 review_reasons text[] not null default '{}',
 fetched_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.vc_directory_broadcasts (
 candidate_id text not null references public.vc_directory_candidates(id),
 platform text not null,
 stream_id text not null,
 started_at timestamptz not null,
 duration_seconds integer not null check(duration_seconds>0 and duration_seconds<=172800),
 source_url text not null,
 is_live_archive boolean not null default false,
 verified boolean not null default false,
 verified_at timestamptz,
 primary key(candidate_id,platform,stream_id),
 check(not verified or verified_at is not null)
);
alter table public.vc_directory_candidates enable row level security;
alter table public.vc_directory_broadcasts enable row level security;
revoke all on public.vc_directory_candidates,public.vc_directory_broadcasts from public,anon,authenticated;
grant select,insert,update,delete on public.vc_directory_candidates,public.vc_directory_broadcasts to service_role;
create index if not exists vc_directory_broadcasts_started_idx on public.vc_directory_broadcasts(candidate_id,started_at desc);
