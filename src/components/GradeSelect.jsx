import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gColDyn, isPendingGrade, PENDING_GRADE } from '../utils/gpa';

export default function GradeSelect({ value, onChange, scale, theme, width = 148, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 215, placement: 'bottom' });
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  const isPending = isPendingGrade(value);
  const currentGrade = isPending ? PENDING_GRADE : value;
  const gradePoints = scale?.points?.[currentGrade];

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const popUp = spaceBelow < 290 && spaceAbove > spaceBelow;
    const menuWidth = 220;
    const left = Math.max(10, Math.min(rect.left, window.innerWidth - menuWidth - 10));

    setCoords({
      placement: popUp ? 'top' : 'bottom',
      top: rect.bottom + 4,
      bottom: window.innerHeight - rect.top + 4,
      left,
      width: menuWidth,
    });
  }, []);

  // Close on outside click, escape, or window scroll
  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleOutsideClick = event => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = event => {
      if (event.key === 'Escape') setOpen(false);
    };

    const handleScrollOrResize = event => {
      // If scroll happens outside the dropdown menu itself, close it
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, updatePosition]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!open) {
      updatePosition();
    }
    setOpen(prev => !prev);
  };

  const handleSelect = gradeVal => {
    onChange(gradeVal);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width, flexShrink: 0 }}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          background: isPending
            ? (theme.isDark ? 'rgba(232,184,75,0.1)' : 'rgba(232,184,75,0.15)')
            : theme.input,
          border: `1px solid ${
            isPending
              ? 'rgba(232,184,75,0.4)'
              : (open ? theme.accent : theme.border)
          }`,
          borderRadius: 8,
          padding: '6px 9px',
          color: isPending
            ? theme.accent
            : theme.text,
          fontSize: 12,
          fontWeight: isPending ? 600 : 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isPending ? (
            <>
              {/* Minimalist Clock SVG Icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.9 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span style={{ letterSpacing: '0.01em' }}>Result Pending</span>
            </>
          ) : (
            <>
              <span style={{ fontWeight: 600 }}>{scale?.labels?.[currentGrade] ?? currentGrade}</span>
              {gradePoints !== undefined && (
                <span style={{ fontSize: 11, color: theme.sub, fontWeight: 400 }}>
                  ({gradePoints.toFixed(scale?.max >= 10 ? 0 : 1)})
                </span>
              )}
            </>
          )}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            color: isPending ? theme.accent : theme.sub,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Portaled Dropdown Menu — Floats above everything, zero clipping or parent scrollbar */}
      {open && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'fixed',
            ...(coords.placement === 'top'
              ? { bottom: coords.bottom }
              : { top: coords.top }),
            left: coords.left,
            width: coords.width,
            background: theme.isDark ? '#141a27' : '#ffffff',
            border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)'}`,
            borderRadius: 12,
            padding: '6px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            zIndex: 99999,
            animation: 'fadeInScale 0.12s ease-out',
          }}
        >
          {/* Status Section: Result Pending */}
          <div style={{ marginBottom: 6 }}>
            <button
              type="button"
              onClick={() => handleSelect(PENDING_GRADE)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 9px',
                borderRadius: 8,
                border: isPending ? '1px solid rgba(232,184,75,0.45)' : '1px solid transparent',
                background: isPending
                  ? (theme.isDark ? 'rgba(232,184,75,0.14)' : 'rgba(232,184,75,0.2)')
                  : 'transparent',
                color: theme.accent,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={e => {
                if (!isPending) e.currentTarget.style.background = theme.isDark ? 'rgba(232,184,75,0.08)' : 'rgba(232,184,75,0.1)';
              }}
              onMouseLeave={e => {
                if (!isPending) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>Result Pending</div>
                  <div style={{ fontSize: 10, color: theme.sub, marginTop: 1 }}>Excluded from GPA</div>
                </div>
              </div>
              {isPending && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Section Divider */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 8px 4px', borderTop: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.sub, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Graded Options
            </span>
          </div>

          {/* Graded Options List — generous height to see all grades without excessive scrolling */}
          <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 2 }}>
            {(scale?.grades || []).map(grade => {
              const pts = scale.points[grade];
              const isSelected = !isPending && currentGrade === grade;
              const color = gColDyn(pts, scale.max);

              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => handleSelect(grade)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: isSelected
                      ? (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                      : 'transparent',
                    color: isSelected ? theme.accent : theme.text,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    marginBottom: 2,
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: isSelected ? 700 : 500 }}>
                      {scale.labels?.[grade] ?? grade}
                    </span>
                    {isSelected && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.accent }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  {pts !== undefined && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color,
                        background: `${color}18`,
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {pts.toFixed(scale.max >= 10 ? 0 : 1)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
