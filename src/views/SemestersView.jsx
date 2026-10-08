import { useEffect, useState } from 'react';
import SemesterCard from '../components/SemesterCard';
import { calcGPA, fmt, gColDyn, semCreds, semNonGpaCreds, semPendingCreds } from '../utils/gpa';

export default function SemestersView({
  semesters,
  scale,
  theme,
  scaleName,
  addSemester,
  updateSemester,
  deleteSemester,
  addCourse,
  addNonGpaCourse,
  updateCourse,
  deleteCourse,
  importCourses,
  onSave,
  saveStatus,
  cgpa,
  cgpaOwn,
  totalCreds,
  totalNonGpaCreds = 0,
  priorGPA,
  priorCreds,
  bestEntry,
  targetSemesterId,
  onClearTargetSemester,
}) {
  const [collapsedMap, setCollapsedMap] = useState({});
  const [focusMode, setFocusMode] = useState(false);
  const [activeSemId, setActiveSemId] = useState(semesters[0]?.id ? String(semesters[0].id) : null);

  const allCollapsed = semesters.length > 0 && semesters.every(s => collapsedMap[s.id]);

  // Track which semester is currently visible while scrolling
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const semId = entry.target.id.replace('semester-', '');
            setActiveSemId(semId);
          }
        });
      },
      { rootMargin: '-80px 0px -50% 0px', threshold: 0.1 }
    );

    semesters.forEach(s => {
      const el = document.getElementById(`semester-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [semesters]);

  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsedMap({});
    } else {
      const all = {};
      semesters.forEach(s => { all[s.id] = true; });
      setCollapsedMap(all);
    }
  };

  const toggleFocusMode = () => {
    setFocusMode(prev => {
      const next = !prev;
      if (next) {
        const targetId = activeSemId || semesters[0]?.id;
        const newMap = {};
        semesters.forEach(s => { newMap[s.id] = (String(s.id) !== String(targetId)); });
        setCollapsedMap(newMap);
      }
      return next;
    });
  };

  const handleToggleCard = id => {
    if (focusMode) {
      if (collapsedMap[id]) {
        const newMap = {};
        semesters.forEach(s => { newMap[s.id] = (s.id !== id); });
        setCollapsedMap(newMap);
        setActiveSemId(String(id));
      } else {
        setCollapsedMap(prev => ({ ...prev, [id]: true }));
      }
    } else {
      setCollapsedMap(prev => ({
        ...prev,
        [id]: !prev[id],
      }));
    }
  };

  const scrollToSemester = id => {
    const el = document.getElementById(`semester-${id}`);
    if (el) {
      const stickyHeader = document.getElementById('semesters-sticky-header');
      const stickyH = stickyHeader ? stickyHeader.offsetHeight : 120;
      // 56px TopNav + sticky header height + 16px buffer
      const topOffset = 56 + stickyH + 16;
      const y = el.getBoundingClientRect().top + window.pageYOffset - topOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });

      // Highlight the targeted card with an accent border and glow animation
      el.style.transition = 'border-color 0.25s ease, box-shadow 0.25s ease';
      el.style.borderColor = theme.accent;
      el.style.boxShadow = `0 0 0 3px ${theme.accent}40`;
      setTimeout(() => {
        el.style.borderColor = theme.border;
        el.style.boxShadow = 'none';
      }, 1600);
    }
  };

  const handleJump = id => {
    if (focusMode) {
      const newMap = {};
      semesters.forEach(s => { newMap[s.id] = (String(s.id) !== String(id)); });
      setCollapsedMap(newMap);
    } else {
      setCollapsedMap(prev => ({
        ...prev,
        [id]: false,
      }));
    }
    setActiveSemId(String(id));

    setTimeout(() => {
      scrollToSemester(id);
    }, 60);
  };

  // When navigated to a specific semester (e.g. clicked from dashboard)
  useEffect(() => {
    if (!targetSemesterId) return;

    if (focusMode) {
      const newMap = {};
      semesters.forEach(s => { newMap[s.id] = (String(s.id) !== String(targetSemesterId)); });
      setCollapsedMap(newMap);
    } else {
      setCollapsedMap(prev => ({
        ...prev,
        [targetSemesterId]: false,
      }));
    }
    setActiveSemId(String(targetSemesterId));

    const timer = setTimeout(() => {
      scrollToSemester(targetSemesterId);
      if (onClearTargetSemester) {
        onClearTargetSemester();
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [targetSemesterId, semesters, focusMode]);

  const academicStanding = cgpa
    ? (cgpa >= scale.max * 0.875
      ? 'First Class Honours'
      : cgpa >= scale.max * 0.75
      ? 'Good Standing'
      : 'Passing')
    : 'No Data Yet';

  return (
    <div>
      {/* ── Top Academic Overview & CGPA Showcase Card ── */}
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: '20px 22px',
          marginBottom: 18,
          boxShadow: theme.isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {/* Cumulative GPA Card */}
          <div
            style={{
              padding: '14px 18px',
              background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                Cumulative GPA (CGPA)
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: gColDyn(cgpa, scale.max),
                  background: `${gColDyn(cgpa, scale.max)}18`,
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                {academicStanding}
              </span>
            </div>

            <div style={{ margin: '8px 0 4px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: gColDyn(cgpa, scale.max),
                  fontFamily: "'Playfair Display',serif",
                  lineHeight: 1,
                }}
              >
                {fmt(cgpa)}
              </span>
              <span style={{ fontSize: 13, color: theme.sub }}>
                / {scale.max} Scale
              </span>
            </div>

            <div style={{ fontSize: 11, color: theme.sub }}>
              {priorGPA && priorCreds ? `Includes prior record (${priorCreds} cr)` : 'Calculated across all graded semesters'}
            </div>
          </div>

          {/* Total Credits Card */}
          <div
            style={{
              padding: '14px 18px',
              background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 11, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
              Total Earned Credits
            </div>

            <div style={{ margin: '8px 0 4px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: theme.accent,
                  fontFamily: "'Playfair Display',serif",
                  lineHeight: 1,
                }}
              >
                {(totalCreds || 0) + (totalNonGpaCreds || 0)}
              </span>
              <span style={{ fontSize: 13, color: theme.sub }}>
                credits
              </span>
            </div>

            <div style={{ fontSize: 11, color: theme.sub }}>
              {totalCreds || 0} GPA credits{totalNonGpaCreds > 0 ? ` · ${totalNonGpaCreds} non-GPA` : ''}
            </div>
          </div>

          {/* Best Semester Card */}
          <div
            onClick={() => bestEntry?.id && handleJump(bestEntry.id)}
            style={{
              padding: '14px 18px',
              background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: bestEntry?.id ? 'pointer' : 'default',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={e => {
              if (bestEntry?.id) e.currentTarget.style.borderColor = theme.accent;
            }}
            onMouseLeave={e => {
              if (bestEntry?.id) e.currentTarget.style.borderColor = theme.border;
            }}
            title={bestEntry?.id ? `Jump to ${bestEntry.name}` : ''}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                Best Semester
              </span>
              {bestEntry?.id && (
                <span style={{ fontSize: 10, color: theme.accent, fontWeight: 600 }}>Click to jump →</span>
              )}
            </div>

            <div style={{ margin: '8px 0 4px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: bestEntry ? gColDyn(bestEntry.gpa, scale.max) : theme.sub,
                  fontFamily: "'Playfair Display',serif",
                  lineHeight: 1,
                }}
              >
                {bestEntry ? fmt(bestEntry.gpa) : '—'}
              </span>
              <span style={{ fontSize: 13, color: theme.sub }}>
                {bestEntry ? bestEntry.name : '—'}
              </span>
            </div>

            <div style={{ fontSize: 11, color: theme.sub }}>
              {semesters.length} semester{semesters.length !== 1 ? 's' : ''} logged in vault
            </div>
          </div>
        </div>

        {/* ── All Semester GPAs at a Glance (The semester overview matrix) ── */}
        {semesters.length > 0 && (
          <div style={{ marginTop: 18, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                All Semester GPAs at a Glance · Click to jump
              </div>
              <div style={{ fontSize: 11, color: theme.sub }}>
                {semesters.filter(s => calcGPA(s.courses, scale) !== null).length} of {semesters.length} graded
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                gap: 10,
              }}
            >
              {semesters.map(semester => {
                const semGpa = calcGPA(semester.courses, scale);
                const semCredits = semCreds(semester, scale.points);
                const semNonGpa = semNonGpaCreds(semester);
                const semPending = semPendingCreds(semester);
                const semColor = gColDyn(semGpa, scale.max);
                const isActive = String(activeSemId) === String(semester.id);

                return (
                  <div
                    key={semester.id}
                    onClick={() => handleJump(semester.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: isActive
                        ? (theme.isDark ? 'rgba(232,184,75,0.14)' : 'rgba(232,184,75,0.2)')
                        : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      border: `1px solid ${isActive ? theme.accent : theme.border}`,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = theme.accent;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = theme.isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = isActive ? theme.accent : theme.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title={`Jump to ${semester.name}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {semester.name}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: theme.accent,
                            boxShadow: `0 0 6px ${theme.accent}`,
                          }}
                          title="Currently in view"
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: semColor,
                          fontFamily: "'Playfair Display',serif",
                          lineHeight: 1.1,
                        }}
                      >
                        {fmt(semGpa)}
                      </span>
                      <span style={{ fontSize: 10, color: theme.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {semGpa !== null ? 'GPA' : semPending > 0 ? 'Pending' : 'No Grades'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: theme.sub, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span>{semCredits} cr</span>
                      {semNonGpa > 0 && <span style={{ color: '#a5b4fc' }}>· {semNonGpa} non-GPA</span>}
                      {semPending > 0 && <span style={{ color: theme.accent }}>· {semPending} pend.</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Header & Navigation Toolbar — Always accessible as user scrolls ── */}
      <div
        id="semesters-sticky-header"
        style={{
          position: 'sticky',
          top: 56,
          zIndex: 35,
          background: theme.isDark ? 'rgba(13, 17, 23, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '12px 0 10px',
          marginBottom: 16,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: semesters.length >= 2 ? 10 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: theme.text, margin: 0 }}>Semesters</h1>
            <span style={{ fontSize: 12, color: theme.sub, background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 12 }}>
              {semesters.length} semester{semesters.length !== 1 ? 's' : ''}
            </span>

            {/* Sticky CGPA Badge — Always clearly visible no matter where user scrolls */}
            <div
              title="Your overall Cumulative GPA"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '3px 10px',
                borderRadius: 16,
                background: theme.isDark ? 'rgba(232, 184, 75, 0.12)' : 'rgba(232, 184, 75, 0.18)',
                border: `1px solid rgba(232, 184, 75, 0.35)`,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CGPA:
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: gColDyn(cgpa, scale.max) }}>
                {fmt(cgpa)}
              </span>
              <span style={{ fontSize: 11, color: theme.sub }}>
                / {scale.max}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Focus Mode (Accordion) Toggle */}
            {semesters.length >= 2 && (
              <button
                type="button"
                onClick={toggleFocusMode}
                title="Focus Mode: Keeps only 1 semester open at a time so all other semesters stay visible as compact rows"
                style={{
                  padding: '7px 11px',
                  background: focusMode ? (theme.isDark ? 'rgba(232,184,75,0.15)' : 'rgba(232,184,75,0.22)') : 'transparent',
                  border: `1px solid ${focusMode ? theme.accent : theme.border}`,
                  borderRadius: 8,
                  color: focusMode ? theme.accent : theme.sub,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Focus Mode: {focusMode ? 'ON' : 'OFF'}
              </button>
            )}

            {/* Collapse All / Expand All Toggle */}
            {semesters.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                title={allCollapsed ? 'Expand all semesters' : 'Collapse all semesters into compact summary rows'}
                style={{
                  padding: '7px 11px',
                  background: 'transparent',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  color: theme.sub,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {allCollapsed ? (
                    <>
                      <polyline points="7 11 12 6 17 11" />
                      <polyline points="7 18 12 13 17 18" />
                    </>
                  ) : (
                    <>
                      <polyline points="7 13 12 18 17 13" />
                      <polyline points="7 6 12 11 17 6" />
                    </>
                  )}
                </svg>
                {allCollapsed ? 'Expand All' : 'Collapse All'}
              </button>
            )}

            <button
              type="button"
              onClick={onSave}
              disabled={saveStatus?.busy}
              style={{
                padding: '7px 14px',
                background: saveStatus?.busy ? 'rgba(232,184,75,0.35)' : theme.accent,
                border: 'none',
                borderRadius: 8,
                color: '#0d1117',
                cursor: saveStatus?.busy ? 'wait' : 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
                opacity: saveStatus?.busy ? 0.8 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              Save
            </button>

            <button
              type="button"
              onClick={addSemester}
              style={{
                padding: '7px 14px',
                background: theme.accent,
                border: 'none',
                borderRadius: 8,
                color: '#0d1117',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              + Semester
            </button>
          </div>
        </div>

        {saveStatus?.message && (
          <div style={{ marginBottom: 8, color: saveStatus.message === 'Saved to account' ? theme.green : saveStatus.message === 'Save failed' ? '#f87171' : theme.accent, fontSize: 12, fontWeight: 500 }}>
            {saveStatus.message}
          </div>
        )}

        {/* ── High-Visibility Semester Quick Jump Strip ── */}
        {semesters.length >= 2 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, paddingTop: 2, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2, fontWeight: 700, flexShrink: 0 }}>
              Quick Jump:
            </span>
            {semesters.map(semester => {
              const semGpa = calcGPA(semester.courses, scale);
              const semCredits = semCreds(semester, scale.points);
              const isCardOpen = !collapsedMap[semester.id];
              const isActive = activeSemId === String(semester.id);
              const semColor = gColDyn(semGpa, scale.max);

              return (
                <button
                  key={semester.id}
                  type="button"
                  onClick={() => handleJump(semester.id)}
                  title={`Jump to ${semester.name}${isCardOpen ? ' (Expanded)' : ' (Collapsed)'}`}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: `1px solid ${
                      isActive
                        ? theme.accent
                        : isCardOpen
                        ? 'rgba(232,184,75,0.35)'
                        : theme.border
                    }`,
                    background: isActive
                      ? (theme.isDark ? 'rgba(232,184,75,0.18)' : 'rgba(232,184,75,0.24)')
                      : isCardOpen
                      ? (theme.isDark ? 'rgba(232,184,75,0.08)' : 'rgba(232,184,75,0.12)')
                      : (theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    color: isActive || isCardOpen ? (isActive ? theme.accent : theme.text) : theme.sub,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? `0 0 8px ${theme.accent}30` : 'none',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{semester.name}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: semColor,
                      background: semGpa !== null ? `${semColor}22` : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                      padding: '2px 7px',
                      borderRadius: 6,
                    }}
                  >
                    {fmt(semGpa)}
                  </span>
                  <span style={{ fontSize: 11, color: theme.sub, opacity: 0.9 }}>
                    ({semCredits} cr)
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Semesters Cards List ── */}
      {semesters.length === 0 ? (
        <div style={{ background: theme.card, border: `2px dashed ${theme.border}`, borderRadius: 14, padding: 40, textAlign: 'center', color: theme.sub, fontSize: 14 }}>
          No semesters yet. Click "+ Semester" above to start logging your courses.
        </div>
      ) : semesters.map(semester => (
        <SemesterCard
          key={semester.id}
          semester={semester}
          scale={scale}
          theme={theme}
          isOpen={!collapsedMap[semester.id]}
          onToggle={() => handleToggleCard(semester.id)}
          onUpdate={patch => updateSemester(semester.id, patch)}
          onDelete={() => deleteSemester(semester.id)}
          onAddCourse={() => addCourse(semester.id)}
          onUpdateCourse={(courseId, patch) => updateCourse(semester.id, courseId, patch)}
          onDeleteCourse={courseId => deleteCourse(semester.id, courseId)}
          onImportCourses={(courses, options) => importCourses(semester.id, courses, options)}
        />
      ))}
    </div>
  );
}
