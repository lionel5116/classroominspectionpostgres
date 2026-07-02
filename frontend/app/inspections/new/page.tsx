'use client';

import { useState } from 'react';
import { InspectionsApi } from '@/lib/api';
import StarRating from '@/components/inspections/StarRating';

interface ScannedClassroom {
  schoolNumber: string;
  schoolName: string;
  classroomNumber: string;
}

export default function RecordInspectionPage() {
  const [scanned, setScanned] = useState<ScannedClassroom | null>(null);
  const [temperatureReading, setTemperatureReading] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [cleaningNotes, setCleaningNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleScan() {
    // TODO: Implement scanner integration for future release
  }

  function resetForm() {
    setScanned(null);
    setTemperatureReading('');
    setIssueDescription('');
    setCleanlinessRating(0);
    setCleaningNotes('');
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (!scanned) {
      setError('Scan a classroom QR code to continue.');
      return;
    }
    if (!temperatureReading.trim()) {
      setError('Temperature reading is required.');
      return;
    }
    if (cleanlinessRating === 0) {
      setError('Select a cleanliness rating.');
      return;
    }

    setSubmitting(true);
    try {
      await InspectionsApi.create({
        schoolNumber: scanned.schoolNumber,
        classroomNumber: scanned.classroomNumber,
        temperatureReading: Number(temperatureReading),
        issueDescription: issueDescription || undefined,
        cleanlinessRating,
        cleaningNotes: cleaningNotes || undefined,
      });
      setSuccess(true);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit inspection.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Record inspection</h1>
      </div>

      <div className="rounded-lg border border-hisd-gray-border bg-white p-6 space-y-6">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={handleScan}
            className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-hisd-gray-border bg-hisd-gray py-6 text-gray-500 hover:bg-hisd-gray/70"
          >
            <span className="text-2xl" aria-hidden>
              ⛶
            </span>
            <span className="text-xs">Tap to scan</span>
          </button>

          <div className="grid flex-1 grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                School number
              </label>
              <div className="w-full rounded-md border border-hisd-gray-border bg-hisd-gray px-3 py-2 text-sm italic text-gray-400">
                {scanned?.schoolNumber || 'Auto from QR scan'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                School name
              </label>
              <div className="w-full rounded-md border border-hisd-gray-border bg-hisd-gray px-3 py-2 text-sm italic text-gray-400">
                {scanned?.schoolName || 'Auto from QR scan'}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Classroom number
              </label>
              <div className="w-full rounded-md border border-hisd-gray-border bg-hisd-gray px-3 py-2 text-sm italic text-gray-400">
                {scanned?.classroomNumber || 'Auto from QR scan'}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-hisd-gray-border pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Temperature</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Reading (°F) *</label>
              <input
                type="number"
                step="0.1"
                value={temperatureReading}
                onChange={(e) => setTemperatureReading(e.target.value)}
                placeholder="Enter reading"
                className="w-full rounded-md border border-hisd-gray-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date and time</label>
              <div className="w-full rounded-md border border-hisd-gray-border bg-hisd-gray px-3 py-2 text-sm italic text-gray-400">
                Captured on submit
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Issue description</label>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe any temperature-related issues..."
              rows={2}
              className="w-full rounded-md border border-hisd-gray-border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="border-t border-hisd-gray-border pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Cleanliness</div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Rating</label>
            <StarRating value={cleanlinessRating} onChange={setCleanlinessRating} />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cleaning notes</label>
            <textarea
              value={cleaningNotes}
              onChange={(e) => setCleaningNotes(e.target.value)}
              placeholder="Additional cleanliness comments..."
              rows={2}
              className="w-full rounded-md border border-hisd-gray-border px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-hisd-red">{error}</div>}
        {success && (
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-hisd-green">
            Inspection submitted successfully.
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-hisd-gray-border pt-4">
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            className="rounded-md border border-hisd-gray-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-hisd-gray disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-hisd-blue px-4 py-2 text-sm font-medium text-white hover:bg-hisd-navy disabled:opacity-50"
          >
            ✓ Submit inspection
          </button>
        </div>
      </div>
    </div>
  );
}
