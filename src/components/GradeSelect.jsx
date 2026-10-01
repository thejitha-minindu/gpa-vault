import { useEffect, useRef, useState } from 'react';
import { gColDyn, isPendingGrade, PENDING_GRADE } from '../utils/gpa';

export default function GradeSelect({ value, onChange, scale, theme, width = 152, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState('bottom');
  const containerRef = useRef(null);

  const isPending = isPendingGrade(value);
  const currentGrade = isPending ? PENDING_GRADE : value;
  const gradePoints = scale?.points?.[currentGrade];

  // Close on outside click or escape
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If space below is limited (< 260px) and there's more room above, pop upwards
      if (spaceBelow < 260 && spaceAbove > spaceBelow) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }
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
            ? (theme.isDark ? 'rgba(232,184,75,0.12)' : 'rgba(232,184,75,0.18)')
            : theme.input,
          border: `1px solid ${
            isPending
              ? 'rgba(232,184,75,0.45)'
              : (open ? theme.accent : theme.border)
          }`,
          borderRadius: 8,
          padding: '6px 9px',
          color: isPending ? theme.accent : theme.text,
          fontSize: 12,
          fontWeight: isPending ? 600 : 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
          boxShadow: isPending ? '0 0 10px rgba(232,184,75,0.08)' : 'none',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isPending ? (
            <>
              <span style={{ fontSize: 13, lineHeight: 1 }}>⏳</span>
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
        <span
          style={{
            fontSize: 10,
            color: isPending ? theme.accent : theme.sub,
            transform: open ? (placement === 'top' ? 'rotate(0deg)' : 'rotate(180deg)') : (placement === 'top' ? 'rotate(180deg)' : 'rotate(0deg)'),
            transition: 'transform 0.2s ease',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>

      {/* Dropdown Menu Popup with Smart Direction Placement */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            ...(placement === 'top'
              ? { bottom: 'calc(100% + 6px)' }
              : { top: 'calc(100% + 6px)' }),
            left: 0,
            width: 205,
            background: theme.isDark ? '#161d2b' : '#ffffff',
            border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)'}`,
            borderRadius: 12,
            padding: '6px',
            boxShadow: placement === 'top'
              ? '0 -16px 42px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)'
              : '0 16px 42px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            zIndex: 80,
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
                padding: '8px 10px',
                borderRadius: 8,
                border: isPending ? '1px solid rgba(232,184,75,0.5)' : '1px solid transparent',
                background: isPending
                  ? (theme.isDark ? 'rgba(232,184,75,0.16)' : 'rgba(232,184,75,0.22)')
                  : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                color: theme.accent,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isPending) e.currentTarget.style.background = theme.isDark ? 'rgba(232,184,75,0.09)' : 'rgba(232,184,75,0.12)';
              }}
              onMouseLeave={e => {
                if (!isPending) e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>⏳</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>Result Pending</div>
                  <div style={{ fontSize: 10, color: theme.sub, marginTop: 2 }}>Not counted in GPA</div>
                </div>
              </div>
              {isPending && (
                <span style={{ fontSize: 13, color: theme.accent, fontWeight: 700 }}>✓</span>
              )}
            </button>
          </div>

          {/* Section Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px', borderTop: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.sub, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Graded Options
            </span>
          </div>

          {/* Graded Options List */}
          <div style={{ maxHeight: 165, overflowY: 'auto', paddingRight: 2 }}>
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
                      <span style={{ fontSize: 12, color: theme.accent }}>✓</span>
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
        </div>
      )}
    </div>
  );
}
