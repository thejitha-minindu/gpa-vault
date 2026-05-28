import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthModal from './components/AuthModal';
import TopNav from './components/TopNav';
import DashboardView from './views/DashboardView';
import SemestersView from './views/SemestersView';
import AnalyticsView from './views/AnalyticsView';
import WhatIfView from './views/WhatIfView';
import { SCALES } from './data/gradeScales';
import { TEMPLATES } from './data/degreeTemplates';
import { calcGPA, fmt, gColDyn, semCreds, uid } from './utils/gpa';
import { loadJSON, saveJSON } from './utils/storage';
import { getCurrentSession, loadUserData, loginUser, logoutUser, registerUser, saveUserData } from './utils/auth';
import { supabase } from './lib/supabase';
import { loadUserDataFromSupabase, saveUserDataToSupabase } from './utils/supabaseSync';

export default function App() {
  const [semesters, setSemesters] = useState([]);
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState('dashboard');
  const [scaleName, setScaleName] = useState('4.2 Standard');
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [priorGPA, setPriorGPA] = useState('');
  const [priorCreds, setPriorCreds] = useState('');
  const [whatIf, setWhatIf] = useState([{ id: uid(), name: '', credits: 3, grade: 'A' }]);
  const [targetGPA, setTargetGPA] = useState('');
  const [targetCr, setTargetCr] = useState(15);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ busy: false, message: '' });

  // Refs for synchronous save-gating (no render-delay like useState)
  const isHydratingRef = useRef(true);   // blocks saves until hydration completes
  const userModifiedRef = useRef(false);  // only true after user makes a change
  const saveTimerRef = useRef(null);      // debounce timer for saves

  const scale = SCALES[scaleName];
  const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  const theme = {
    bg: dark ? '#0d1117' : '#f5f3ef',
    card: dark ? '#161b27' : '#ffffff',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    text: dark ? '#e8e0d0' : '#1f2937',
    sub: dark ? '#8896b0' : '#6b7280',
    accent: '#e8b84b',
    accentBg: dark ? 'rgba(232,184,75,0.1)' : 'rgba(232,184,75,0.15)',
    input: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    grid: dark ? '#2a3145' : '#e5e7eb',
    ttBg: dark ? '#1e2535' : '#ffffff',
    green: '#34d399',
    red: '#f87171',
    blue: '#60a5fa',
    isDark: dark,
  };

  useEffect(() => {
    let isMounted = true;

    const restoreLocalPreferences = () => {
      const savedPreferences = loadJSON('gpa-vault-preferences', null);
      if (savedPreferences) {
        setDark(savedPreferences.dark ?? true);
        setScaleName(savedPreferences.scaleName ?? '4.2 Standard');
        setPriorGPA(savedPreferences.priorGPA ?? '');
        setPriorCreds(savedPreferences.priorCreds ?? '');
      }
    };

    const bootstrap = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            setCurrentUser({ id: session.user.id, email: session.user.email });
          }
        } catch (error) {
          console.error('Failed to restore Supabase session', error);
        }
      } else {
        const savedSession = getCurrentSession();
        if (savedSession && isMounted) {
          setCurrentUser({ id: savedSession.userId, username: savedSession.username });
        }
        restoreLocalPreferences();
      }

      setReady(true);
    };

    bootstrap();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          // Only update if user ID actually changed to avoid re-triggering hydration
          setCurrentUser(prev => {
            if (prev?.id === session.user.id) return prev;
            return { id: session.user.id, email: session.user.email };
          });
        } else {
          setCurrentUser(null);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isSupabaseConfigured]);

  // ── Hydration: load user data from Supabase on login ─────────────────────
  useEffect(() => {
    if (!currentUser || !ready) return;

    let isCancelled = false;
    isHydratingRef.current = true;
    userModifiedRef.current = false;

    const hydrate = async () => {
      if (!isSupabaseConfigured) {
        isHydratingRef.current = false;
        return;
      }

      try {
        const savedData = await loadUserDataFromSupabase(currentUser.id);
        if (isCancelled) return;

        if (savedData) {
          setSemesters(savedData.semesters ?? []);
          setDark(savedData.dark ?? true);
          setScaleName(savedData.scaleName ?? '4.2 Standard');
          setPriorGPA(savedData.priorGPA ?? '');
          setPriorCreds(savedData.priorCreds ?? '');
        }
      } catch (error) {
        console.error('Failed to hydrate Supabase data', error);
      } finally {
        if (!isCancelled) {
          // Allow saves only after React has flushed the hydrated state
          requestAnimationFrame(() => {
            if (!isCancelled) {
              isHydratingRef.current = false;
            }
          });
        }
      }
    };

    hydrate();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, ready, isSupabaseConfigured]);

  // ── Local preferences (localStorage only, not Supabase) ─────────────────
  useEffect(() => {
    if (!ready) return;
    saveJSON('gpa-vault-preferences', { dark, scaleName, priorGPA, priorCreds });
  }, [dark, scaleName, priorGPA, priorCreds, ready]);

  // ── Auto-save to Supabase (debounced, only after user modifications) ────
  useEffect(() => {
    if (!currentUser || !ready) return;
    // Skip if we're still hydrating (ref is synchronous — no render gap)
    if (isHydratingRef.current) return;
    // Mark that user has modified data (skips the first post-hydration trigger)
    if (!userModifiedRef.current) {
      userModifiedRef.current = true;
      return;
    }

    // Debounce: cancel any pending save, schedule a new one
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (isSupabaseConfigured) {
        saveUserDataToSupabase(currentUser.id, { semesters, dark, scaleName, priorGPA, priorCreds }).catch(error => {
          console.error('Failed to sync data to Supabase', error);
        });
      } else {
        saveUserData(currentUser.id, { semesters, dark, scaleName, priorGPA, priorCreds });
      }
    }, 800);

    return () => clearTimeout(saveTimerRef.current);
  }, [currentUser, semesters, dark, scaleName, priorGPA, priorCreds, ready, isSupabaseConfigured]);

  const allCourses = useMemo(() => semesters.flatMap(semester => semester.courses), [semesters]);

  const calcGPAEff = useCallback((courses) => {
    const regular = courses.filter(course => course.grade in scale.points && Number(course.credits) > 0);
    let totalPoints = regular.reduce((sum, course) => sum + scale.points[course.grade] * Number(course.credits), 0);
    let totalCredits = regular.reduce((sum, course) => sum + Number(course.credits), 0);
    const priorGpaValue = parseFloat(priorGPA);
    const priorCreditsValue = parseFloat(priorCreds);
    if (priorGpaValue > 0 && priorCreditsValue > 0) {
      totalPoints += priorGpaValue * (scale.max / 4.0) * priorCreditsValue;
      totalCredits += priorCreditsValue;
    }
    return totalCredits > 0 ? totalPoints / totalCredits : null;
  }, [scale, priorGPA, priorCreds]);

  const cgpa = useMemo(() => {
    let totalWeightedPoints = 0;
    let totalWeightedCredits = 0;

    semesters.forEach(semester => {
      const semesterGpa = calcGPA(semester.courses, scale);
      const semesterCredits = semCreds(semester, scale.points);
      const semesterWeight = Number(semester.weight ?? 1);

      if (semesterGpa !== null && semesterCredits > 0) {
        totalWeightedPoints += semesterGpa * semesterCredits * semesterWeight;
        totalWeightedCredits += semesterCredits * semesterWeight;
      }
    });

    const priorGpaValue = parseFloat(priorGPA);
    const priorCreditsValue = parseFloat(priorCreds);
    if (priorGpaValue > 0 && priorCreditsValue > 0) {
      totalWeightedPoints += priorGpaValue * (scale.max / 4.0) * priorCreditsValue;
      totalWeightedCredits += priorCreditsValue;
    }

    return totalWeightedCredits > 0 ? totalWeightedPoints / totalWeightedCredits : null;
  }, [semesters, scale, priorGPA, priorCreds]);
  const cgpaOwn = useMemo(() => calcGPA(allCourses, scale), [allCourses, scale]);
  const totalCreds = useMemo(() => allCourses.filter(course => course.grade in scale.points && Number(course.credits) > 0).reduce((sum, course) => sum + Number(course.credits), 0), [allCourses, scale]);

  const chartData = useMemo(() =>
    semesters.map(semester => {
      const gpaValue = calcGPA(semester.courses, scale);
      return gpaValue !== null ? { name: semester.name, gpa: parseFloat(gpaValue.toFixed(2)), credits: semCreds(semester, scale.points) } : null;
    }).filter(Boolean),
  [semesters, scale]);

  const gradeDistData = useMemo(() => {
    const counts = {};
    scale.grades.forEach(grade => { counts[grade] = 0; });
    allCourses.forEach(course => { if (course.grade in counts) counts[course.grade] += 1; });
    return scale.grades.filter(grade => counts[grade] > 0).map(grade => ({ name: scale.labels?.[grade] ?? grade, value: counts[grade] }));
  }, [allCourses, scale]);

  const projGPA = useMemo(() => {
    const hypothetical = whatIf.filter(course => course.grade in scale.points && Number(course.credits) > 0);
    return calcGPAEff([...allCourses, ...hypothetical]);
  }, [allCourses, whatIf, scale, calcGPAEff]);

  const targetResult = useMemo(() => {
    if (!targetGPA) return null;
    const targetValue = parseFloat(targetGPA);
    if (Number.isNaN(targetValue) || targetValue <= 0 || targetValue > scale.max) return null;

    const existingPoints = allCourses.filter(course => course.grade in scale.points && Number(course.credits) > 0).reduce((sum, course) => sum + scale.points[course.grade] * Number(course.credits), 0);
    let existingCredits = totalCreds;
    const priorGpaValue = parseFloat(priorGPA);
    const priorCreditsValue = parseFloat(priorCreds);
    let adjustedPoints = existingPoints;
    if (priorGpaValue > 0 && priorCreditsValue > 0) {
      adjustedPoints += priorGpaValue * (scale.max / 4.0) * priorCreditsValue;
      existingCredits += priorCreditsValue;
    }

    const futureCredits = Number(targetCr);
    const neededAverage = futureCredits > 0 ? (targetValue * (existingCredits + futureCredits) - adjustedPoints) / futureCredits : null;
    if (neededAverage === null) return null;
    const entries = Object.entries(scale.points).sort((left, right) => Math.abs(left[1] - neededAverage) - Math.abs(right[1] - neededAverage));
    return {
      neededAvg: parseFloat(neededAverage.toFixed(2)),
      closest: entries[0]?.[0],
      feasible: neededAverage <= scale.max && neededAverage >= 0,
    };
  }, [targetGPA, targetCr, allCourses, totalCreds, scale, priorGPA, priorCreds]);

  const bestEntry = chartData.length ? chartData.reduce((best, current) => current.gpa > best.gpa ? current : best, chartData[0]) : null;

  const addSemester = () => setSemesters(current => [...current, { id: uid(), name: `Semester ${current.length + 1}`, weight: 1, courses: [] }]);
  const updateSemester = (semesterId, patch) => setSemesters(current => current.map(semester => semester.id === semesterId ? { ...semester, ...patch } : semester));
  const deleteSemester = semesterId => setSemesters(current => current.filter(semester => semester.id !== semesterId));
  const addCourse = semesterId => setSemesters(current => current.map(semester => semester.id === semesterId ? { ...semester, courses: [...semester.courses, { id: uid(), name: '', credits: 3, grade: scale.grades[0] }] } : semester));
  const updateCourse = (semesterId, courseId, patch) => setSemesters(current => current.map(semester => semester.id === semesterId ? { ...semester, courses: semester.courses.map(course => course.id === courseId ? { ...course, ...patch } : course) } : semester));
  const deleteCourse = (semesterId, courseId) => setSemesters(current => current.map(semester => semester.id === semesterId ? { ...semester, courses: semester.courses.filter(course => course.id !== courseId) } : semester));

  const applyTemplate = templateName => {
    const template = TEMPLATES[templateName];
    if (!template || !semesters.length) return;
    const latestSemester = semesters[semesters.length - 1];
    setSemesters(current => current.map(semester => semester.id === latestSemester.id ? { ...semester, courses: template.map(item => ({ id: uid(), name: item.name, credits: item.credits, grade: scale.grades[0] })) } : semester));
    setShowTemplate(false);
    setView('semesters');
  };

  const saveData = useCallback(async () => {
    if (!currentUser) {
      setSaveStatus({ busy: false, message: 'Sign in to save your semesters and modules.' });
      return;
    }

    setSaveStatus({ busy: true, message: 'Saving…' });

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured.');
      }

      await saveUserDataToSupabase(currentUser.id, { semesters, dark, scaleName, priorGPA, priorCreds });
      setSaveStatus({ busy: false, message: 'Saved to Supabase' });
    } catch (error) {
      console.error('Failed to save user data', error);
      setSaveStatus({ busy: false, message: 'Save failed' });
    }
  }, [currentUser, dark, isSupabaseConfigured, priorCreds, priorGPA, scaleName, semesters]);

  const exportCSV = () => {
    const rows = [['Semester', 'Course', 'Credits', 'Grade', 'Grade Points'], ...semesters.flatMap(semester => semester.courses.map(course => [semester.name, `"${course.name}"`, course.credits, course.grade, scale.points[course.grade] ?? '']))];
    const blob = new Blob([rows.map(row => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gpa_data.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setGoogleLoading(true);

    try {
      if (!isSupabaseConfigured) {
        setAuthError('Google sign-in requires Supabase environment variables.');
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await saveData();
    } catch (error) {
      console.error('Failed to save before logout', error);
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      logoutUser();
    }
    // Clear pending save timer so we don't save empty state
    clearTimeout(saveTimerRef.current);
    setCurrentUser(null);
    setSemesters([]);
    isHydratingRef.current = true;
    userModifiedRef.current = false;
  };

  if (!ready) {
    return <div style={{ background: '#0d1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8b84b', fontFamily: 'sans-serif' }}>Loading…</div>;
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: theme.text }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');"}</style>

      {!currentUser ? (
        <AuthModal onGoogleLogin={handleGoogleLogin} isGoogleLoading={googleLoading} error={authError} theme={theme} />
      ) : (
        <>
          <TopNav
            view={view}
            setView={setView}
            theme={theme}
            currentUser={currentUser}
            onOpenAuth={() => {}}
            onLogout={handleLogout}
            onToggleTheme={() => setDark(value => !value)}
            onToggleSettings={() => setShowSettings(value => !value)}
            showSettings={showSettings}
            onExportCSV={exportCSV}
          />

          {showSettings && (
            <div style={{ background: theme.card, borderBottom: `1px solid ${theme.border}`, padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Grading Scale</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.keys(SCALES).map(name => (
                    <button key={name} onClick={() => setScaleName(name)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${scaleName === name ? theme.accent : theme.border}`, background: scaleName === name ? theme.accentBg : 'transparent', color: scaleName === name ? theme.accent : theme.sub, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: scaleName === name ? 600 : 400 }}>{name}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Prior Record <span style={{ color: theme.accent }}>(optional)</span></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: theme.sub, marginBottom: 3 }}>Previous GPA</div>
                    <input type="number" placeholder={`0–${scale.max}`} value={priorGPA} onChange={e => setPriorGPA(e.target.value)} style={{ background: theme.input, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '7px 11px', color: theme.text, fontSize: 13, outline: 'none', width: 90, fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: theme.sub, marginBottom: 3 }}>Total Credits</div>
                    <input type="number" placeholder="e.g. 60" value={priorCreds} onChange={e => setPriorCreds(e.target.value)} style={{ background: theme.input, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '7px 11px', color: theme.text, fontSize: 13, outline: 'none', width: 90, fontFamily: 'inherit' }} />
                  </div>
                  {priorGPA && priorCreds && <div style={{ paddingTop: 16, fontSize: 12, color: theme.accent }}>✓ included</div>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Degree Templates</div>
                <button onClick={() => setShowTemplate(value => !value)} style={{ padding: '8px 16px', background: theme.accentBg, border: `1px solid rgba(232,184,75,0.3)`, borderRadius: 10, color: theme.accent, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>📋 Apply Template</button>
              </div>
            </div>
          )}

          {showTemplate && (
            <div onClick={() => setShowTemplate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div onClick={e => e.stopPropagation()} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 24, width: 340, maxWidth: '90vw' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 4 }}>Choose a Template</div>
                <p style={{ color: theme.sub, fontSize: 13, margin: '0 0 16px' }}>Fills the latest semester with common courses.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.keys(TEMPLATES).map(templateName => (
                    <button key={templateName} onClick={() => applyTemplate(templateName)} style={{ padding: '10px 14px', background: theme.input, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, cursor: 'pointer', fontSize: 14, textAlign: 'left', fontFamily: 'inherit', fontWeight: 500 }}>{templateName}</button>
                  ))}
                </div>
                <button onClick={() => setShowTemplate(false)} style={{ marginTop: 14, width: '100%', padding: '8px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.sub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 16px' }}>
            {view === 'dashboard' && (
              <DashboardView
                semesters={semesters}
                scale={scale}
                scaleName={scaleName}
                theme={theme}
                priorGPA={priorGPA}
                priorCreds={priorCreds}
                chartData={chartData}
                cgpa={cgpa}
                cgpaOwn={cgpaOwn}
                totalCreds={totalCreds}
                bestEntry={bestEntry}
                addSemester={addSemester}
                setView={setView}
              />
            )}

            {view === 'semesters' && (
              <SemestersView
                semesters={semesters}
                scale={scale}
                scaleName={scaleName}
                theme={theme}
                addSemester={addSemester}
                updateSemester={updateSemester}
                deleteSemester={deleteSemester}
                addCourse={addCourse}
                updateCourse={updateCourse}
                deleteCourse={deleteCourse}
                setShowTemplate={setShowTemplate}
                onSave={saveData}
                saveStatus={saveStatus}
              />
            )}

            {view === 'analytics' && (
              <AnalyticsView
                semesters={semesters}
                scale={scale}
                theme={theme}
                chartData={chartData}
                allCourses={allCourses}
                cgpa={cgpa}
                gradeDistData={gradeDistData}
              />
            )}

            {view === 'whatif' && (
              <WhatIfView
                scale={scale}
                theme={theme}
                allCourses={allCourses}
                whatIf={whatIf}
                setWhatIf={setWhatIf}
                targetGPA={targetGPA}
                setTargetGPA={setTargetGPA}
                targetCr={targetCr}
                setTargetCr={setTargetCr}
                projGPA={projGPA}
                targetResult={targetResult}
                scaleName={scaleName}
                cgpa={cgpa}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
