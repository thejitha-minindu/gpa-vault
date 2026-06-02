import { useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '../lib/supabase';

const extractGeminiText = response =>
  (response.candidates ?? [])
    .flatMap(candidate => candidate.content?.parts ?? [])
    .map(item => item.text ?? '')
    .filter(Boolean)
    .join('\n');

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
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState([]);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
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
    setBusy(true);
    setError('');
    setFileName(file.name);
    setProgress(0);
    setRows([]);
    setRawText('');
    lastImageRef.current = file;

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setRawText(base64); // Use rawText to store base64 temporarily
      setProgress(100);
      
      await analyzeWithAi(base64, file.type);
    } catch (err) {
      console.error('Picture processing failed', err);
      setError('Could not process that picture. Check your image and try again.');
    } finally {
      setBusy(false);
    }
  };

  const analyzeWithAi = async (imageBase64 = rawText, mimeType = lastImageRef.current?.type || 'image/jpeg') => {
    if (!imageBase64) return;
    setAiBusy(true);
    setError('');

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured. Please set up Supabase to use the Picture Import feature.');
      }

      const { data: resData, error: invokeError } = await supabase.functions.invoke('analyze-picture', {
        body: {
          imageBase64,
          mimeType,
          allowedGrades: scale.grades,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to call edge function.');
      }

      if (resData?.error) {
        throw new Error(resData.error);
      }

      const geminiData = resData?.data;
      if (!geminiData) {
        throw new Error('No data returned from AI.');
      }
      const outputText = extractGeminiText(geminiData);
      const parsed = JSON.parse(outputText);
      const nextRows = (parsed.courses ?? [])
        .map(course => ({
          name: String(course.name ?? '').trim(),
          credits: course.credits ? Number(course.credits) : '',
          grade: scale.grades.includes(course.grade) ? course.grade : '',
        }))
        .filter(course => course.name);

      if (!nextRows.length) {
        throw new Error('The image is not clear or relevant. Please try a different picture.');
      }
      setRows(nextRows);
    } catch (aiError) {
      console.error('Gemini analysis failed', aiError);
      setError(aiError.message || 'Gemini analysis failed.');
    } finally {
      setAiBusy(false);
    }
  };

  const updateRow = (index, patch) => {
    setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const removeRow = index => {
    setRows(current => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const addBlankRow = () => {
    setRows(current => [...current, { name: '', credits: '', grade: '' }]);
  };

  const importRows = () => {
    const cleanRows = rows
      .map(row => ({ ...row, name: row.name.trim(), credits: Number(row.credits) }))
      .filter(row => row.name && !isNaN(row.credits) && row.grade);

    if (!cleanRows.length) return;
    onImport(cleanRows, { replaceExisting });
    onClose();
  };

  return (
    <div ref={rootRef} style={{ marginTop: 12, border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.input, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Picture import</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: theme.sub, borderRadius: 8, padding: '5px 8px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Close</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <label style={{ ...inputStyle, cursor: busy ? 'wait' : 'pointer', color: theme.accent, fontWeight: 600 }}>
          Choose picture
          <input type="file" accept="image/*" disabled={busy} onChange={event => readPicture(event.target.files?.[0])} style={{ display: 'none' }} />
        </label>
        <button onClick={() => lastImageRef.current && readPicture(lastImageRef.current)} disabled={busy || !lastImageRef.current} style={{ ...inputStyle, cursor: busy || !lastImageRef.current ? 'not-allowed' : 'pointer', opacity: busy || !lastImageRef.current ? 0.6 : 1 }}>Retry picture</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.sub, fontSize: 12 }}>
          <input type="checkbox" checked={replaceExisting} onChange={event => setReplaceExisting(event.target.checked)} />
          Replace existing
        </label>
      </div>

      {fileName && <div style={{ color: theme.sub, fontSize: 11, marginBottom: 8 }}>{busy || aiBusy ? `Analyzing ${fileName}...` : `Analyzed ${fileName}`}</div>}
      {error && <div style={{ color: theme.red, fontSize: 12, marginBottom: 8 }}>{error}</div>}

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
                <select value={row.grade} onChange={event => updateRow(index, { grade: event.target.value })} style={{ ...inputStyle, width: 94 }}>
                  <option value="" disabled>-</option>
                  {scale.grades.map(grade => (
                    <option key={grade} value={grade}>{scale.labels?.[grade] ?? grade}</option>
                  ))}
                </select>
                <button onClick={() => removeRow(index)} style={{ width: 26, background: 'transparent', border: 'none', cursor: 'pointer', color: theme.red, fontSize: 17, lineHeight: 1 }}>x</button>
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
