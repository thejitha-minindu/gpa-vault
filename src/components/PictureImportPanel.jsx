import { useEffect, useMemo, useRef, useState } from 'react';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB


export default function PictureImportPanel({ scale, theme, onImport, onClose }) {
  const rootRef = useRef(null);

  useEffect(() => {
    // Scroll the panel into view smoothly when it opens
    if (rootRef.current) {
      rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [lastRawResponse, setLastRawResponse] = useState('');
  const lastImageRef = useRef(null);

  const canImport = rows.some(row => row.name.trim()) && rows.filter(r => r.name.trim()).every(row => row.credits !== '' && row.grade !== '');
  const inputStyle = useMemo(() => ({
    background: theme.input,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: '6px 9px',
    color: theme.text,
    fontSize: 12,
    outline: 'none',
    fontFamily: 'inherit',
  }), [theme]);

  const readPicture = async file => {
    if (!file) return;

    // Reject non-image MIME types early
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.).');
      return;
    }

    // 5 MB client-side cap
    if (file.size > MAX_BYTES) {
      setError('Image is too large (max 5 MB). Try a smaller or compressed picture.');
      return;
    }

    setBusy(true);
    setError('');
    setFileName(file.name);
    setRows([]);
    setRawText('');
    setLastRawResponse('');
    setShowRawResponse(false);
    lastImageRef.current = file;

    // Generate thumbnail preview
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const base64 = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_DIM = 1500;
          
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round(height * (MAX_DIM / width));
              width = MAX_DIM;
            } else {
              width = Math.round(width * (MAX_DIM / height));
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          // Fill white background in case of transparent PNGs
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG to save tokens and payload size
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = reject;
        
        const reader = new FileReader();
        reader.onload = () => { img.src = reader.result; };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setRawText(base64); // Store base64 for retry

      await analyzeWithAi(base64, 'image/jpeg');
    } catch (err) {
      console.error('Picture processing failed', err);
      setError('Could not process that picture. Check your image and try again.');
    } finally {
      setBusy(false);
    }
  };

  const analyzeWithAi = async (imageBase64 = rawText, mimeType = 'image/jpeg') => {
    if (!imageBase64) return;
    setAiBusy(true);
    setError('');
    setLastRawResponse('');
    setShowRawResponse(false);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase is not configured. Please set up Supabase to use the Picture Import feature.');
      }

      const fetchUrl = `${supabaseUrl}/functions/v1/analyze-picture`;
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          allowedGrades: scale.grades,
        }),
      });

      const responseText = await response.text();

      if (!responseText) {
        throw new Error(`Server returned an empty response (HTTP ${response.status}). The image may be too large — try a smaller picture.`);
      }

      let resData;
      try {
        resData = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Server returned invalid data (HTTP ${response.status}). Try a smaller or clearer picture.`);
      }

      if (resData?.error) {
        throw new Error(resData.error);
      }

      const aiData = resData?.data;
      if (!aiData) {
        throw new Error('No data returned from AI.');
      }
      setLastRawResponse(JSON.stringify(aiData, null, 2));
      const nextRows = (aiData.courses ?? [])
        .map(course => {
          const gradeInScale = scale.grades.includes(course.grade);
          return {
            name: String(course.name ?? '').trim(),
            credits: course.credits ? Number(course.credits) : '',
            grade: gradeInScale ? course.grade : '',
            // Track if the AI returned a grade that doesn't match the current scale
            gradeMismatch: (!gradeInScale && course.grade) ? String(course.grade) : '',
          };
        })
        .filter(course => course.name);

      if (!nextRows.length) {
        throw new Error('The image is not clear or relevant. Please try a different picture.');
      }
      setRows(nextRows);
    } catch (aiError) {
      console.error('AI analysis failed', aiError);
      setError(aiError.message || 'AI analysis failed.');
    } finally {
      setAiBusy(false);
    }
  };

  const updateRow = (index, patch) => {
    setRows(current => current.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      const updated = { ...row, ...patch };
      // Clear mismatch warning if user manually picks a grade
      if ('grade' in patch && patch.grade) updated.gradeMismatch = '';
      return updated;
    }));
  };

  const removeRow = index => {
    setRows(current => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const addBlankRow = () => {
    setRows(current => [...current, { name: '', credits: '', grade: '', gradeMismatch: '' }]);
  };

  const importRows = () => {
    const cleanRows = rows
      .map(row => ({ ...row, name: row.name.trim(), credits: Number(row.credits) }))
      .filter(row => row.name && !isNaN(row.credits) && row.grade);

    if (!cleanRows.length) return;
    onImport(cleanRows, { replaceExisting });
    onClose();
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div ref={rootRef} style={{ marginTop: 12, border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.input, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Picture import</div>
        </div>
        <button onClick={onClose} aria-label="Close picture import" style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: theme.sub, borderRadius: 8, padding: '5px 8px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Close</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <label aria-label="Upload transcript image" style={{ ...inputStyle, cursor: busy ? 'wait' : 'pointer', color: theme.accent, fontWeight: 600 }}>
          Choose picture
          <input type="file" accept="image/*" disabled={busy} onChange={event => readPicture(event.target.files?.[0])} style={{ display: 'none' }} />
        </label>
        <button onClick={() => lastImageRef.current && readPicture(lastImageRef.current)} disabled={busy || !lastImageRef.current} style={{ ...inputStyle, cursor: busy || !lastImageRef.current ? 'not-allowed' : 'pointer', opacity: busy || !lastImageRef.current ? 0.6 : 1 }}>Retry picture</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.sub, fontSize: 12 }}>
          <input type="checkbox" checked={replaceExisting} onChange={event => setReplaceExisting(event.target.checked)} />
          Replace existing
        </label>
      </div>

      {/* Image thumbnail preview */}
      {previewUrl && (
        <div style={{ marginBottom: 10 }}>
          <img
            src={previewUrl}
            alt="Selected transcript"
            style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8, border: `1px solid ${theme.border}`, objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Status with aria-live for screen readers */}
      <div aria-live="polite">
        {fileName && <div style={{ color: theme.sub, fontSize: 11, marginBottom: 8 }}>{busy || aiBusy ? `Analyzing ${fileName}…` : `Analyzed ${fileName}`}</div>}
        {aiBusy && <div style={{ color: theme.accent, fontSize: 12, marginBottom: 8 }}>🔄 AI is analyzing your image…</div>}
      </div>
      {error && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: theme.red, fontSize: 12 }}>{error}</div>
          {/* Collapsible raw response for debugging */}
          {lastRawResponse && (
            <button
              onClick={() => setShowRawResponse(v => !v)}
              style={{ background: 'transparent', border: 'none', color: theme.sub, fontSize: 11, cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}
            >
              {showRawResponse ? 'Hide' : 'Show'} raw AI response
            </button>
          )}
          {showRawResponse && lastRawResponse && (
            <pre style={{ fontSize: 10, color: theme.sub, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 6, padding: 8, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 4 }}>
              {lastRawResponse}
            </pre>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6, color: theme.sub, fontSize: 10, fontWeight: 600 }}>
            <span style={{ flex: 2 }}>MODULE</span>
            <span style={{ width: 66 }}>CREDITS</span>
            <span style={{ width: 94 }}>GRADE</span>
            <span style={{ width: 26 }} />
          </div>
          <div style={{ maxHeight: 220, overflow: 'auto', paddingRight: 2 }}>
            {rows.map((row, index) => (
              <div key={`${row.name}-${index}`} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input value={row.name} onChange={event => updateRow(index, { name: event.target.value })} placeholder="Module name" style={{ ...inputStyle, flex: 2, minWidth: 0 }} />
                <input type="number" min={0.5} max={6} step={0.5} value={row.credits} onChange={event => updateRow(index, { credits: event.target.value })} placeholder="-" style={{ ...inputStyle, width: 66 }} />
                <div style={{ position: 'relative', width: 94 }}>
                  <select value={row.grade} onChange={event => updateRow(index, { grade: event.target.value })} style={{ ...inputStyle, width: '100%' }}>
                    <option value="" disabled>-</option>
                    {scale.grades.map(grade => (
                      <option key={grade} value={grade}>{scale.labels?.[grade] ?? grade}</option>
                    ))}
                  </select>
                  {/* Grade mismatch warning — AI returned a grade not in the current scale */}
                  {row.gradeMismatch && (
                    <span title={`AI returned "${row.gradeMismatch}" which isn't in your current scale — pick one manually`} style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', fontSize: 13, cursor: 'help', color: '#fbbf24' }}>⚠️</span>
                  )}
                </div>
                <button onClick={() => removeRow(index)} aria-label={`Remove ${row.name || 'course'}`} style={{ width: 26, background: 'transparent', border: 'none', cursor: 'pointer', color: theme.red, fontSize: 17, lineHeight: 1 }}>x</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={addBlankRow} style={{ ...inputStyle, cursor: 'pointer' }}>+ Row</button>
            <button onClick={importRows} disabled={!canImport} style={{ padding: '7px 14px', background: canImport ? theme.accent : 'rgba(232,184,75,0.35)', border: 'none', borderRadius: 8, color: '#0d1117', cursor: canImport ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
              {replaceExisting ? 'Replace semester' : 'Insert modules'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
