import { useEffect, useState } from 'react';
import SemesterCard from '../components/SemesterCard';
import { calcGPA, fmt, gColDyn, semCreds } from '../utils/gpa';

export default function SemestersView({
  semesters,
  scale,
  theme,
  scaleName,
  addSemester,
  updateSemester,
  deleteSemester,
  addCourse,
  updateCourse,
  deleteCourse,
  importCourses,
  onSave,
  saveStatus,
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
      // Expand all
      setCollapsedMap({});
    } else {
      // Collapse all
      const all = {};
      semesters.forEach(s => { all[s.id] = true; });
      setCollapsedMap(all);
    }
  };

  const toggleFocusMode = () => {
    setFocusMode(prev => {
      const next = !prev;
      if (next) {
        // When Focus Mode is enabled, keep only the currently active semester (or the first) open
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
        // Was collapsed: expand this semester and collapse all others
        const newMap = {};
        semesters.forEach(s => { newMap[s.id] = (s.id !== id); });
        setCollapsedMap(newMap);
        setActiveSemId(String(id));
      } else {
        // Already open: collapse it
        setCollapsedMap(prev => ({ ...prev, [id]: true }));
      }
    } else {
      setCollapsedMap(prev => ({
        ...prev,
        [id]: !prev[id],
      }));
    }
  };

  const handleJump = id => {
    if (focusMode) {
      // In focus mode, open only this targeted semester
      const newMap = {};
      semesters.forEach(s => { newMap[s.id] = (s.id !== id); });
      setCollapsedMap(newMap);
    } else {
      // Ensure the targeted semester is expanded
      setCollapsedMap(prev => ({
        ...prev,
        [id]: false,
      }));
    }
    setActiveSemId(String(id));

    setTimeout(() => {
      const el = document.getElementById(`semester-${id}`);
      if (el) {
        // Offset scroll position so card header isn't obscured by the sticky header
        const stickyOffset = 135;
        const y = el.getBoundingClientRect().top + window.pageYOffset - stickyOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        el.style.borderColor = theme.accent;
        setTimeout(() => {
          el.style.borderColor = theme.border;
        }, 1200);
      }
    }, 50);
  };

  return (
    <div>
      {/* Sticky Header & Navigation Toolbar — Always accessible no matter where user scrolls */}
      <div
        style={{
          position: 'sticky',
          top: 56,
          zIndex: 35,
          background: theme.isDark ? 'rgba(13, 17, 23, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '12px 0 10px',
          marginBottom: 16,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: semesters.length >= 2 ? 10 : 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: theme.text, margin: 0 }}>Semesters</h1>
              <span style={{ fontSize: 12, color: theme.sub, background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 12 }}>
                {semesters.length} semester{semesters.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p style={{ color: theme.sub, fontSize: 12, margin: '2px 0 0' }}>Scale: <strong style={{ color: theme.accent }}>{scaleName}</strong> · Double-click name to rename</p>
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

        {/* Semester Quick Jump Bar — Pinned right in the sticky bar for effortless 1-click navigation */}
        {semesters.length >= 2 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: theme.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4, fontWeight: 700, flexShrink: 0 }}>
              Quick Jump:
            </span>
            {semesters.map(semester => {
              const semGpa = calcGPA(semester.courses, scale);
              const semCredits = semCreds(semester, scale.points);
              const isCardOpen = !collapsedMap[semester.id];
              const isActive = activeSemId === String(semester.id);

              return (
                <button
                  key={semester.id}
                  type="button"
                  onClick={() => handleJump(semester.id)}
                  title={`Jump to ${semester.name}${isCardOpen ? ' (Expanded)' : ' (Collapsed)'}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    border: `1px solid ${
                      isActive
                        ? theme.accent
                        : isCardOpen
                        ? 'rgba(232,184,75,0.3)'
                        : theme.border
                    }`,
                    background: isActive
                      ? (theme.isDark ? 'rgba(232,184,75,0.18)' : 'rgba(232,184,75,0.22)')
                      : isCardOpen
                      ? (theme.isDark ? 'rgba(232,184,75,0.06)' : 'rgba(232,184,75,0.1)')
                      : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    color: isActive || isCardOpen ? (isActive ? theme.accent : theme.text) : theme.sub,
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{semester.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: gColDyn(semGpa, scale.max) }}>
                    {fmt(semGpa)}
                  </span>
                  <span style={{ fontSize: 10, color: theme.sub, opacity: 0.85 }}>
                    ({semCredits} cr)
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Semesters Cards List */}
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
