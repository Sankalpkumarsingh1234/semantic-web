'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Compass,
  GitCompareArrows,
  GraduationCap,
  Lightbulb,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { careers, careerCategories } from '@/data/careers';
import { calculateProfileStrength, recommendCareers } from '@/services/recommendation-engine';
import type { CareerProfile, Recommendation } from '@/types/career';
import { clearPathwiseStorage, loadCompare, loadProfile, saveCompare, saveProfile } from '@/utils/profile-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const defaultProfile: CareerProfile = {
  goal: 'I enjoy solving problems with technology but also like communicating with people and understanding business needs.',
  skills: ['Python', 'Data Analysis', 'Communication'],
  values: ['Learning', 'Career Growth'],
  environments: ['Hybrid', 'Collaborative'],
  experienceLevel: 'Student',
  priorities: ['Career Growth', 'Technical Depth', 'Customer Interaction'],
};

const skillOptions = [
  'Python',
  'Java',
  'Data Analysis',
  'SQL',
  'Research',
  'Communication',
  'Problem Solving',
  'Writing',
  'Design Thinking',
  'Leadership',
  'Presentation',
  'Creativity',
  'Project Management',
  'Machine Learning',
  'Cloud',
  'Cybersecurity',
  'Business Strategy',
  'Customer Interaction',
];

const valueOptions = ['High Salary', 'Career Growth', 'Learning', 'Stability', 'Creativity', 'Leadership', 'Work-Life Balance', 'Social Impact', 'Autonomy', 'Recognition'];
const environmentOptions = ['Remote', 'Hybrid', 'Office', 'Collaborative', 'Independent', 'Fast-paced', 'Structured', 'Flexible'];
const experienceOptions: CareerProfile['experienceLevel'][] = ['Student', 'Entry Level', '1-3 Years', '3-5 Years', '5+ Years'];
const priorityOptions = ['Earning Potential', 'Career Growth', 'Remote Flexibility', 'Work-Life Balance', 'Technical Depth', 'Leadership', 'Creativity', 'Customer Interaction', 'Social Impact', 'Stability'];
const navItems = ['Home', 'Discover', 'Explore Careers', 'Compare'] as const;
type View = (typeof navItems)[number] | 'Results' | 'Career Detail';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function scoreTone(score: number) {
  if (score >= 78) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (score >= 58) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function ToggleChip({
  active,
  disabled,
  children,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'min-h-10 rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:opacity-45',
        active
          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <progress className="h-2 w-full overflow-hidden rounded-full bg-slate-200 [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-slate-950" value={value} max={100} />
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-slate-300 bg-white/70 px-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-lg bg-slate-100 text-slate-700">
          <Compass className="size-5" />
        </span>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export default function Home() {
  const [profile, setProfile] = useState<CareerProfile>(defaultProfile);
  const [view, setView] = useState<View>('Home');
  const [step, setStep] = useState(0);
  const [customSkill, setCustomSkill] = useState('');
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [experience, setExperience] = useState('All');
  const [environment, setEnvironment] = useState('All');
  const [outlook, setOutlook] = useState('All');
  const [hasGenerated, setHasGenerated] = useState(true);

  useEffect(() => {
    window.setTimeout(() => {
      setProfile(loadProfile(defaultProfile));
      setCompareIds(loadCompare());
    }, 0);
  }, []);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveCompare(compareIds);
  }, [compareIds]);

  const profileStrength = calculateProfileStrength(profile);
  const recommendations = useMemo(() => recommendCareers(profile, careers), [profile]);
  const selectedRecommendation = selectedCareerId ? recommendations.find((item) => item.career.id === selectedCareerId) : recommendations[0];
  const top = recommendations[0];
  const compared = recommendations.filter((item) => compareIds.includes(item.career.id));
  const completedSections = [
    profile.goal.trim().length > 0,
    profile.skills.length > 0,
    profile.values.length > 0,
    profile.environments.length > 0,
    Boolean(profile.experienceLevel),
    profile.priorities.length > 0,
  ].filter(Boolean).length;
  const setupProgress = Math.round(((step + 1) / 7) * 100);

  const updateProfile = (patch: Partial<CareerProfile>) => setProfile((current) => ({ ...current, ...patch }));
  const toggle = (key: 'skills' | 'values' | 'environments' | 'priorities', item: string, max?: number) => {
    setProfile((current) => {
      const list = current[key];
      const next = list.includes(item) ? list.filter((value) => value !== item) : max && list.length >= max ? list : [...list, item];
      return { ...current, [key]: next };
    });
  };
  const addCustomSkill = () => {
    const next = customSkill.trim();
    if (!next || profile.skills.some((skill) => skill.toLowerCase() === next.toLowerCase())) return;
    updateProfile({ skills: [...profile.skills, next] });
    setCustomSkill('');
  };
  const generate = () => {
    setHasGenerated(true);
    setView('Results');
    setExpandedId(recommendations[0]?.career.id ?? null);
  };
  const reset = () => {
    clearPathwiseStorage();
    setProfile({ ...defaultProfile, goal: '', skills: [], values: [], environments: [], priorities: [] });
    setCompareIds([]);
    setHasGenerated(false);
    setView('Discover');
    setStep(0);
  };
  const toggleCompare = (id: string) => setCompareIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : current.length >= 3 ? current : [...current, id]));
  const openCareer = (id: string) => {
    setSelectedCareerId(id);
    setView('Career Detail');
    setMobileOpen(false);
  };

  const filteredCareers = recommendations.filter(({ career }) => {
    const search = `${career.title} ${career.description} ${career.category} ${career.requiredSkills.join(' ')}`.toLowerCase();
    return (
      search.includes(query.toLowerCase()) &&
      (category === 'All' || career.category === category) &&
      (experience === 'All' || career.experienceLevels.includes(experience as CareerProfile['experienceLevel'])) &&
      (environment === 'All' || career.environments.includes(environment)) &&
      (outlook === 'All' || career.growthOutlook === outlook)
    );
  });

  return (
    <main className="min-h-screen bg-[#eef1f5] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-900 bg-[#080b12] text-white shadow-lg shadow-slate-950/10">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setView('Home')} className="flex items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="grid size-9 place-items-center rounded-md bg-white text-slate-950">
              <Compass className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-normal">Pathwise</span>
          </button>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <button key={item} type="button" onClick={() => setView(item)} className={cx('rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white', view === item && 'bg-white text-slate-950 hover:bg-white hover:text-slate-950')}>
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300 sm:inline-flex">Profile {profileStrength}%</span>
            <Button size="sm" variant="secondary" onClick={reset} className="hidden bg-white text-slate-950 hover:bg-slate-100 sm:inline-flex">
              <RefreshCw />Reset
            </Button>
            <Button aria-label="Open menu" size="icon" variant="ghost" onClick={() => setMobileOpen(!mobileOpen)} className="text-white hover:bg-white/10 md:hidden">
              <Menu />
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-white/10 px-4 py-3 md:hidden">
            {navItems.map((item) => (
              <button key={item} type="button" onClick={() => { setView(item); setMobileOpen(false); }} className={cx('block w-full rounded-md px-3 py-3 text-left text-sm font-medium text-slate-300', view === item && 'bg-white text-slate-950')}>
                {item}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        {view === 'Home' && (
          <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-lg bg-[#10141f] p-5 text-white shadow-xl shadow-slate-900/15">
              <p className="text-xs font-medium text-cyan-200">Semantic career matching</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight">Find career paths that fit how you think, work, and grow.</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">Pathwise compares your goals, skills, values, preferences, and experience against career paths and explains why they fit.</p>
              <div className="mt-6 flex flex-col gap-2">
                <Button onClick={() => { setView('Discover'); setStep(0); }} className="justify-between bg-white text-slate-950 hover:bg-slate-100">
                  Discover My Career <ArrowRight />
                </Button>
                <Button onClick={() => setView('Explore Careers')} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">Explore Careers</Button>
              </div>
              <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs text-slate-300"><span>Profile Strength</span><span>{profileStrength}%</span></div>
                <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${profileStrength}%` }} /></div>
              </div>
            </aside>
            <section className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Semantic career matching', Icon: Sparkles },
                  { label: 'Explainable recommendations', Icon: ShieldCheck },
                  { label: 'Skill-gap insights', Icon: Target },
                  { label: 'Career comparison', Icon: GitCompareArrows },
                ].map(({ label, Icon }) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <Icon className="size-5 text-slate-900" />
                    <p className="mt-4 text-sm font-semibold">{label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Recommended jobs</p>
                    <p className="text-xs text-slate-500">A live preview based on your current profile</p>
                  </div>
                  <Button size="sm" onClick={generate}>View Matches</Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {recommendations.slice(0, 6).map((item, index) => (
                    <MiniCareerCard key={item.career.id} recommendation={item} rank={index + 1} onOpen={() => openCareer(item.career.id)} onCompare={() => toggleCompare(item.career.id)} compared={compareIds.includes(item.career.id)} />
                  ))}
                </div>
              </div>
            </section>
          </section>
        )}

        {view === 'Discover' && (
          <section className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase text-slate-500">Profile Setup</p>
              <div className="mt-2 flex items-end justify-between"><h2 className="text-xl font-semibold">Step {step + 1} of 7</h2><span className="text-sm font-semibold">{setupProgress}%</span></div>
              <div className="mt-4"><ProgressBar value={setupProgress} /></div>
              <div className="mt-6 rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm"><span>Profile Strength</span><strong>{profileStrength}%</strong></div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{profile.skills.length < 4 ? 'Add more skills to improve recommendation quality.' : `${completedSections}/6 profile signals completed.`}</p>
              </div>
            </aside>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <DiscoverStep step={step} profile={profile} updateProfile={updateProfile} toggle={toggle} addCustomSkill={addCustomSkill} customSkill={customSkill} setCustomSkill={setCustomSkill} />
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}><ArrowLeft />Back</Button>
                {step < 6 ? <Button onClick={() => setStep(Math.min(6, step + 1))}>Next <ArrowRight /></Button> : <Button onClick={generate}>Find My Career Matches <Sparkles /></Button>}
              </div>
            </div>
          </section>
        )}

        {view === 'Results' && (
          <section className="space-y-5">
            {!hasGenerated ? (
              <EmptyState title="Complete your profile to discover your best career matches." body="Your results will appear after the Discover flow." action={<Button onClick={() => setView('Discover')}>Start Discover</Button>} />
            ) : (
              <>
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Your Career Matches</p>
                    <h2 className="mt-1 text-2xl font-semibold">Strong alignment with {top?.career.category.toLowerCase()} roles.</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Your profile shows alignment with analytical, technical, and people-centered work. Scores update as you tune your profile.</p>
                  </div>
                  <Button onClick={() => setView('Discover')} variant="outline">Edit Profile</Button>
                </div>
                {top && <TopRecommendation item={top} expanded={expandedId === top.career.id} onExpand={() => setExpandedId(expandedId === top.career.id ? null : top.career.id)} onOpen={() => openCareer(top.career.id)} onCompare={() => toggleCompare(top.career.id)} compared={compareIds.includes(top.career.id)} />}
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {recommendations.slice(1, 10).map((item, index) => (
                    <RecommendationCard key={item.career.id} item={item} rank={index + 2} expanded={expandedId === item.career.id} onExpand={() => setExpandedId(expandedId === item.career.id ? null : item.career.id)} onOpen={() => openCareer(item.career.id)} onCompare={() => toggleCompare(item.career.id)} compared={compareIds.includes(item.career.id)} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {view === 'Explore Careers' && (
          <section className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div><p className="text-xs font-semibold uppercase text-slate-500">Explore Careers</p><h2 className="mt-1 text-2xl font-semibold">Browse {careers.length} career paths</h2></div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="relative sm:col-span-2 lg:col-span-1"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><Input aria-label="Search careers" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search careers" /></div>
                  <SelectLike value={category} values={['All', ...careerCategories]} onChange={setCategory} label="Category" />
                  <SelectLike value={experience} values={['All', ...experienceOptions]} onChange={setExperience} label="Experience" />
                  <SelectLike value={environment} values={['All', ...environmentOptions]} onChange={setEnvironment} label="Environment" />
                  <SelectLike value={outlook} values={['All', 'Very High', 'High', 'Steady', 'Emerging']} onChange={setOutlook} label="Growth" />
                </div>
              </div>
            </div>
            {filteredCareers.length === 0 ? <EmptyState title="No careers match these filters." body="Try a broader search or clear one filter." /> : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredCareers.map((item) => <ExploreCard key={item.career.id} item={item} onOpen={() => openCareer(item.career.id)} onCompare={() => toggleCompare(item.career.id)} compared={compareIds.includes(item.career.id)} />)}
              </div>
            )}
          </section>
        )}

        {view === 'Compare' && (
          <section className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-semibold uppercase text-slate-500">Compare</p><h2 className="mt-1 text-2xl font-semibold">Career comparison</h2><p className="mt-2 text-sm text-slate-500">Select up to three careers from recommendations or Career Explorer.</p></div>
                <Button variant="outline" onClick={() => setCompareIds([])} disabled={compareIds.length === 0}>Clear</Button>
              </div>
            </div>
            {compared.length === 0 ? <EmptyState title="No careers selected yet." body="Select up to three careers from your recommendations or Career Explorer." action={<Button onClick={() => setView('Explore Careers')}>Explore Careers</Button>} /> : <CompareView items={compared} />}
          </section>
        )}

        {view === 'Career Detail' && selectedRecommendation && (
          <CareerDetail item={selectedRecommendation} onBack={() => setView('Results')} onCompare={() => toggleCompare(selectedRecommendation.career.id)} compared={compareIds.includes(selectedRecommendation.career.id)} onRelated={openCareer} />
        )}
      </div>
    </main>
  );
}

function SelectLike({ value, values, onChange, label }: { value: string; values: string[]; onChange: (value: string) => void; label: string }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10">
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}

function DiscoverStep({
  step,
  profile,
  updateProfile,
  toggle,
  customSkill,
  setCustomSkill,
  addCustomSkill,
}: {
  step: number;
  profile: CareerProfile;
  updateProfile: (patch: Partial<CareerProfile>) => void;
  toggle: (key: 'skills' | 'values' | 'environments' | 'priorities', item: string, max?: number) => void;
  customSkill: string;
  setCustomSkill: (value: string) => void;
  addCustomSkill: () => void;
}) {
  if (step === 0) return <StepShell eyebrow="Career Goal" title="What kind of work would you like to do?"><Textarea value={profile.goal} onChange={(event) => updateProfile({ goal: event.target.value })} className="min-h-40 resize-none text-base" placeholder="I enjoy solving problems with technology but also like communicating with people and understanding business needs." /></StepShell>;
  if (step === 1) return <StepShell eyebrow="Skills" title="Which skills do you enjoy using?"><div className="flex flex-wrap gap-2">{skillOptions.map((skill) => <ToggleChip key={skill} active={profile.skills.includes(skill)} onClick={() => toggle('skills', skill)}>{skill}</ToggleChip>)}</div><div className="mt-5 flex gap-2"><Input value={customSkill} onChange={(event) => setCustomSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomSkill(); } }} placeholder="Add a custom skill" /><Button type="button" onClick={addCustomSkill}><Plus />Add</Button></div><div className="mt-4 flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium">{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => toggle('skills', skill)}><X className="size-3" /></button></span>)}</div></StepShell>;
  if (step === 2) return <ChoiceGrid eyebrow="Work Values" title="What matters in your work?" options={valueOptions} selected={profile.values} onToggle={(item) => toggle('values', item)} />;
  if (step === 3) return <ChoiceGrid eyebrow="Work Environment" title="Where do you do your best work?" options={environmentOptions} selected={profile.environments} onToggle={(item) => toggle('environments', item)} />;
  if (step === 4) return <StepShell eyebrow="Experience Level" title="Where are you in your career right now?"><div className="grid gap-3 sm:grid-cols-5">{experienceOptions.map((item) => <button key={item} type="button" onClick={() => updateProfile({ experienceLevel: item })} className={cx('min-h-24 rounded-lg border p-4 text-left text-sm font-semibold transition', profile.experienceLevel === item ? 'border-slate-950 bg-slate-950 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300')}>{item}</button>)}</div></StepShell>;
  if (step === 5) return <ChoiceGrid eyebrow="Career Priorities" title="Choose up to five priorities" options={priorityOptions} selected={profile.priorities} onToggle={(item) => toggle('priorities', item, 5)} helper={`${profile.priorities.length}/5 selected`} />;
  return (
    <StepShell eyebrow="Review Profile" title="Review your profile before matching">
      <div className="grid gap-3 md:grid-cols-2">
        <ReviewBlock title="Goal" value={profile.goal || 'Not added'} />
        <ReviewBlock title="Experience" value={profile.experienceLevel} />
        <ReviewBlock title="Skills" value={profile.skills.join(', ') || 'Not added'} />
        <ReviewBlock title="Values" value={profile.values.join(', ') || 'Not added'} />
        <ReviewBlock title="Environment" value={profile.environments.join(', ') || 'Not added'} />
        <ReviewBlock title="Priorities" value={profile.priorities.join(', ') || 'Not added'} />
      </div>
    </StepShell>
  );
}

function StepShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <div><p className="text-xs font-semibold uppercase text-slate-500">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold">{title}</h2><div className="mt-6">{children}</div></div>;
}

function ChoiceGrid({ eyebrow, title, options, selected, onToggle, helper }: { eyebrow: string; title: string; options: string[]; selected: string[]; onToggle: (item: string) => void; helper?: string }) {
  return (
    <StepShell eyebrow={eyebrow} title={title}>
      {helper && <p className="mb-4 text-sm text-slate-500">{helper}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((item) => <button key={item} type="button" onClick={() => onToggle(item)} className={cx('flex min-h-20 items-center justify-between rounded-lg border p-4 text-left text-sm font-semibold transition', selected.includes(item) ? 'border-slate-950 bg-slate-950 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50')}><span>{item}</span>{selected.includes(item) && <Check className="size-4" />}</button>)}
      </div>
    </StepShell>
  );
}

function ReviewBlock({ title, value }: { title: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">{title}</p><p className="mt-2 text-sm leading-6 text-slate-800">{value}</p></div>;
}

function ScorePill({ score }: { score: number }) {
  return <span className={cx('inline-flex min-w-20 items-center justify-center rounded-full border px-3 py-1 text-sm font-bold', scoreTone(score))}>{score}% Match</span>;
}

function MiniCareerCard({ recommendation, rank, onOpen, onCompare, compared }: { recommendation: Recommendation; rank: number; onOpen: () => void; onCompare: () => void; compared: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
      <div className="flex items-start justify-between gap-3"><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">#{rank}</span><ScorePill score={recommendation.totalScore} /></div>
      <h3 className="mt-4 font-semibold">{recommendation.career.title}</h3>
      <p className="mt-1 text-xs text-slate-500">{recommendation.career.category}</p>
      <div className="mt-4 flex gap-2"><Button size="sm" onClick={onOpen} className="flex-1">View</Button><Button aria-label="Compare career" size="icon" variant={compared ? 'default' : 'outline'} onClick={onCompare}><GitCompareArrows /></Button></div>
    </article>
  );
}

function TopRecommendation({ item, expanded, onExpand, onOpen, onCompare, compared }: { item: Recommendation; expanded: boolean; onExpand: () => void; onOpen: () => void; onCompare: () => void; compared: boolean }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-950 bg-white shadow-xl shadow-slate-900/10">
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Top recommendation</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.confidence}</span></div>
          <h2 className="mt-4 text-3xl font-semibold">{item.career.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{item.career.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">{item.matchingSkills.slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{skill}</span>)}</div>
        </div>
        <div className="rounded-lg bg-slate-950 p-5 text-white"><p className="text-sm text-slate-300">Match score</p><p className="mt-2 text-5xl font-semibold">{item.totalScore}%</p><p className="mt-4 text-sm leading-6 text-slate-300">{item.reasons[0]}</p></div>
      </div>
      <div className="grid gap-4 border-t border-slate-200 p-5 md:grid-cols-3">
        <Insight title="Strong Matches" items={item.matchingSkills.slice(0, 3)} icon={<Check className="size-4 text-emerald-600" />} />
        <Insight title="Skills to Develop" items={item.missingSkills.length ? item.missingSkills : ['Keep deepening core skills']} icon={<Target className="size-4 text-amber-600" />} />
        <Insight title="Growth Outlook" items={[item.career.growthOutlook, `Readiness ${item.careerReadiness}%`]} icon={<TrendingUp className="size-4 text-cyan-700" />} />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 p-4"><Button onClick={onExpand} variant="outline">Why This Match <ChevronDown className={cx('transition', expanded && 'rotate-180')} /></Button><Button onClick={onOpen}>View Career</Button><Button onClick={onCompare} variant={compared ? 'default' : 'outline'}>Compare</Button></div>
      {expanded && <Explanation item={item} />}
    </article>
  );
}

function RecommendationCard({ item, rank, expanded, onExpand, onOpen, onCompare, compared }: { item: Recommendation; rank: number; expanded: boolean; onExpand: () => void; onOpen: () => void; onCompare: () => void; compared: boolean }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-4"><div className="flex items-start justify-between gap-3"><span className="text-xs font-semibold text-slate-400">#{rank}</span><ScorePill score={item.totalScore} /></div><h3 className="mt-3 text-lg font-semibold">{item.career.title}</h3><p className="text-xs text-slate-500">{item.career.category}</p><p className="mt-3 text-sm leading-6 text-slate-500">{item.career.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{item.matchingSkills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{skill}</span>)}</div></div>
      <div className="flex gap-2 border-t border-slate-200 bg-slate-50 p-3"><Button size="sm" variant="outline" onClick={onExpand}>Why</Button><Button size="sm" onClick={onOpen}>View</Button><Button aria-label="Compare career" size="icon" variant={compared ? 'default' : 'outline'} onClick={onCompare}><GitCompareArrows /></Button></div>
      {expanded && <Explanation item={item} />}
    </article>
  );
}

function Explanation({ item }: { item: Recommendation }) {
  const rows = [
    ['Goal Match', item.scoreBreakdown.goal, 40],
    ['Skills', item.scoreBreakdown.skills, 25],
    ['Work Values', item.scoreBreakdown.values, 15],
    ['Environment', item.scoreBreakdown.environment, 10],
    ['Experience', item.scoreBreakdown.experience, 10],
  ] as const;
  return <div className="border-t border-slate-200 bg-white p-5"><h4 className="font-semibold">Why {item.career.title}?</h4><div className="mt-4 grid gap-3 md:grid-cols-2">{rows.map(([label, value, max]) => <div key={label}><div className="flex justify-between text-xs font-semibold"><span>{label}</span><span>{value} / {max}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950" style={{ width: `${(value / max) * 100}%` }} /></div></div>)}</div><div className="mt-5 grid gap-4 md:grid-cols-2"><Insight title="What Matches" items={item.reasons} icon={<Check className="size-4 text-emerald-600" />} /><Insight title="What Reduces the Score" items={item.reductions.length ? item.reductions : ['No major gaps found.']} icon={<Lightbulb className="size-4 text-amber-600" />} /></div></div>;
}

function Insight({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="mb-3 flex items-center gap-2 text-sm font-semibold">{icon}{title}</p><ul className="space-y-2 text-sm text-slate-600">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

function ExploreCard({ item, onOpen, onCompare, compared }: { item: Recommendation; onOpen: () => void; onCompare: () => void; compared: boolean }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.career.title}</h3><p className="mt-1 text-xs text-slate-500">{item.career.category}</p></div><ScorePill score={item.totalScore} /></div><p className="mt-4 text-sm leading-6 text-slate-500">{item.career.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{item.career.requiredSkills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{skill}</span>)}</div><div className="mt-5 flex gap-2"><Button onClick={onOpen} className="flex-1">View Career</Button><Button aria-label="Compare career" size="icon" variant={compared ? 'default' : 'outline'} onClick={onCompare}><GitCompareArrows /></Button></div></article>;
}

function CompareView({ items }: { items: Recommendation[] }) {
  const rows = [
    ['Match Score', (item: Recommendation) => `${item.totalScore}%`],
    ['Skill Match', (item: Recommendation) => `${item.scoreBreakdown.skills} / 25`],
    ['Goal Match', (item: Recommendation) => `${item.scoreBreakdown.goal} / 40`],
    ['Work Value Fit', (item: Recommendation) => `${item.scoreBreakdown.values} / 15`],
    ['Environment Fit', (item: Recommendation) => `${item.scoreBreakdown.environment} / 10`],
    ['Experience Fit', (item: Recommendation) => `${item.scoreBreakdown.experience} / 10`],
    ['Career Readiness', (item: Recommendation) => `${item.careerReadiness}%`],
    ['Growth Outlook', (item: Recommendation) => item.career.growthOutlook],
    ['Key Skills', (item: Recommendation) => item.career.requiredSkills.join(', ')],
    ['Skills Missing', (item: Recommendation) => item.missingSkills.join(', ') || 'None'],
  ] as const;
  return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="hidden lg:grid" style={{ gridTemplateColumns: `190px repeat(${items.length}, minmax(0, 1fr))` }}>{rows.map(([label, render], rowIndex) => [<div key={`${label}-label`} className={cx('border-slate-200 bg-slate-50 p-4 text-sm font-semibold', rowIndex > 0 && 'border-t')}>{label}</div>, ...items.map((item) => <div key={`${label}-${item.career.id}`} className={cx('border-l border-slate-200 p-4 text-sm leading-6 text-slate-600', rowIndex > 0 && 'border-t')}><strong className="mb-1 block text-slate-950">{rowIndex === 0 ? item.career.title : ''}</strong>{render(item)}</div>)]).flat()}</div><div className="grid gap-4 p-4 lg:hidden">{items.map((item) => <div key={item.career.id} className="rounded-lg border border-slate-200 p-4"><h3 className="font-semibold">{item.career.title}</h3>{rows.map(([label, render]) => <p key={label} className="mt-3 text-sm text-slate-600"><strong className="block text-xs uppercase text-slate-400">{label}</strong>{render(item)}</p>)}</div>)}</div></div>;
}

function CareerDetail({ item, onBack, onCompare, compared, onRelated }: { item: Recommendation; onBack: () => void; onCompare: () => void; compared: boolean; onRelated: (id: string) => void }) {
  const career = item.career;
  const related = careers.filter((candidate) => candidate.category === career.category && candidate.id !== career.id).slice(0, 3);
  return <section className="space-y-5"><Button variant="ghost" onClick={onBack}><ArrowLeft />Back to Matches</Button><article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold text-slate-500">{career.category}</p><h1 className="mt-2 text-3xl font-semibold">{career.title}</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{career.detailedDescription}</p></div><div className="rounded-lg bg-slate-950 p-5 text-white"><p className="text-sm text-slate-300">Your match</p><p className="mt-2 text-4xl font-semibold">{item.totalScore}%</p><p className="mt-2 text-sm text-slate-300">{item.confidence}</p></div></div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={onCompare} variant={compared ? 'default' : 'outline'}>Compare</Button><Button onClick={onBack}>Back to Matches</Button></div></article><div className="grid gap-5 lg:grid-cols-3"><Insight title="Responsibilities" items={career.responsibilities} icon={<BriefcaseBusiness className="size-4 text-slate-700" />} /><Insight title="Required Skills" items={career.requiredSkills} icon={<GraduationCap className="size-4 text-slate-700" />} /><Insight title="Suggested First Step" items={[career.suggestedNextStep]} icon={<Lightbulb className="size-4 text-slate-700" />} /><Insight title="Skills You Already Have" items={item.matchingSkills.length ? item.matchingSkills : ['No direct skill matches yet']} icon={<Check className="size-4 text-emerald-600" />} /><Insight title="Skills To Develop" items={item.missingSkills.length ? item.missingSkills : ['Keep building depth']} icon={<Target className="size-4 text-amber-600" />} /><Insight title="Work Environment" items={[career.environments.join(', '), `Experience fit: ${item.scoreBreakdown.experience} / 10`, `Growth outlook: ${career.growthOutlook}`]} icon={<Compass className="size-4 text-cyan-700" />} /></div><section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Related careers</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{related.map((career) => <button key={career.id} type="button" onClick={() => onRelated(career.id)} className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-slate-950"><p className="font-semibold">{career.title}</p><p className="mt-1 text-sm text-slate-500">{career.description}</p></button>)}</div></section></section>;
}
