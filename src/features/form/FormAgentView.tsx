import { FormEvent, useEffect, useState } from 'react';
import type { Agent } from '../../types/database';
import { logAgentRun } from '../../lib/agentLogger';
import { supabase } from '../../lib/supabaseClient';

interface FormAgentViewProps {
  agent: Agent;
  userId: string;
  sessionId: string;
  sessionState: { values: Record<string, any> };
  onUpdateSessionState: (state: Record<string, any>) => Promise<any>;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'email';
  placeholder?: string;
  options?: { label: string; value: string }[];
  helperText?: string;
  required?: boolean;
  defaultValue?: string;
}

export function FormAgentView({
  agent,
  userId,
  sessionId,
  sessionState,
  onUpdateSessionState
}: FormAgentViewProps) {
  const config = agent.config_json ?? {};
  const fields: FormField[] = Array.isArray(config.fields) ? config.fields : [];
  const submitFunction: string | null = config.submitFunction ?? null;

  const [values, setValues] = useState<Record<string, any>>(sessionState?.values ?? {});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (sessionState?.values) {
      setValues(sessionState.values);
    }
  }, [sessionState]);

  const handleChange = async (name: string, value: any) => {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    await onUpdateSessionState({ values: nextValues });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      let result: any = { status: 'saved' };
      if (submitFunction) {
        const { data, error } = await supabase.functions.invoke(submitFunction, {
          body: { agentId: agent.id, sessionId, userId, payload: values }
        });
        if (error) {
          throw new Error(error.message);
        }
        result = data;
      }

      await onUpdateSessionState({ values });
      await logAgentRun({
        sessionId,
        agentId: agent.id,
        userId,
        input: { values },
        output: { result }
      });
      setStatus('Form submitted successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 rounded-2xl border border-white/5 bg-midnight-800/60 p-6 shadow-xl shadow-black/30">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="text-sm font-medium text-gray-200" htmlFor={field.name}>
              {field.label}
            </label>
            {renderField(field, values[field.name] ?? '', (value) => handleChange(field.name, value))}
            {field.helperText && <p className="text-xs text-gray-400">{field.helperText}</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-midnight-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-midnight-400 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : config.submitLabel ?? 'Submit'}
        </button>
        {status && <span className="text-xs text-gray-400">{status}</span>}
      </div>
    </form>
  );
}

function renderField(
  field: FormField,
  value: string,
  onChange: (value: string) => void
) {
  const commonClasses =
    'w-full rounded-xl border border-white/10 bg-midnight-900/70 px-4 py-3 text-sm text-gray-100 outline-none focus:border-white/30 transition';

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          id={field.name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={commonClasses}
        />
      );
    case 'select':
      return (
        <select
          id={field.name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={commonClasses}
        >
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          id={field.name}
          type={field.type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className={commonClasses}
        />
      );
  }
}
