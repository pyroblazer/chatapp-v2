import { Injectable } from '@nestjs/common';

export interface MetricLabels {
  [key: string]: string;
}

interface CounterEntry {
  value: number;
  labels: MetricLabels;
}

interface GaugeEntry {
  value: number;
  labels: MetricLabels;
}

interface HistogramEntry {
  buckets: number[];
  counts: number[];
  sum: number;
  count: number;
  labels: MetricLabels;
}

const DEFAULT_HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

function serializeLabels(labels: MetricLabels): string {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
  const pairs = keys.map((k) => `${k}="${labels[k]}"`);
  return `{${pairs.join(',')}}`;
}

@Injectable()
export class TelemetryService {
  private counters: Map<string, CounterEntry[]> = new Map();
  private gauges: Map<string, GaugeEntry[]> = new Map();
  private histograms: Map<string, HistogramEntry[]> = new Map();

  incrementCounter(name: string, labels: MetricLabels = {}): void {
    const entries = this.counters.get(name) || [];
    const existing = this.findEntry(entries, labels);
    if (existing) {
      existing.value += 1;
    } else {
      entries.push({ value: 1, labels: { ...labels } });
    }
    this.counters.set(name, entries);
  }

  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    const entries = this.gauges.get(name) || [];
    const existing = this.findEntry(entries, labels);
    if (existing) {
      existing.value = value;
    } else {
      entries.push({ value, labels: { ...labels } });
    }
    this.gauges.set(name, entries);
  }

  observeHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    const entries = this.histograms.get(name) || [];
    const existing = this.findHistogramEntry(entries, labels);
    if (existing) {
      existing.sum += value;
      existing.count += 1;
      for (let i = 0; i < existing.buckets.length; i++) {
        if (value <= existing.buckets[i]) {
          existing.counts[i] += 1;
        }
      }
    } else {
      const buckets = [...DEFAULT_HISTOGRAM_BUCKETS];
      const counts = buckets.map((b) => (value <= b ? 1 : 0));
      entries.push({
        buckets,
        counts,
        sum: value,
        count: 1,
        labels: { ...labels },
      });
    }
    this.histograms.set(name, entries);
  }

  getMetrics(): string {
    const lines: string[] = [];

    // Counters
    for (const [name, entries] of this.counters.entries()) {
      lines.push(`# HELP ${name} Total count`);
      lines.push(`# TYPE ${name} counter`);
      for (const entry of entries) {
        lines.push(`${name}${serializeLabels(entry.labels)} ${entry.value}`);
      }
    }

    // Gauges
    for (const [name, entries] of this.gauges.entries()) {
      lines.push(`# HELP ${name} Current value`);
      lines.push(`# TYPE ${name} gauge`);
      for (const entry of entries) {
        lines.push(`${name}${serializeLabels(entry.labels)} ${entry.value}`);
      }
    }

    // Histograms
    for (const [name, entries] of this.histograms.entries()) {
      lines.push(`# HELP ${name} Duration histogram`);
      lines.push(`# TYPE ${name} histogram`);
      for (const entry of entries) {
        const labelStr = serializeLabels(entry.labels);
        let cumulative = 0;
        for (let i = 0; i < entry.buckets.length; i++) {
          cumulative += entry.counts[i];
          lines.push(
            `${name}_bucket{le="${entry.buckets[i]}"${labelStr ? ',' + labelStr.slice(1, -1) : ''}} ${cumulative}`,
          );
        }
        lines.push(`${name}_bucket{le="+Inf"${labelStr ? ',' + labelStr.slice(1, -1) : ''}} ${entry.count}`);
        lines.push(`${name}_sum${labelStr} ${entry.sum}`);
        lines.push(`${name}_count${labelStr} ${entry.count}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  private findEntry<T extends { labels: MetricLabels }>(
    entries: T[],
    labels: MetricLabels,
  ): T | undefined {
    return entries.find((e) => this.labelsMatch(e.labels, labels));
  }

  private findHistogramEntry(entries: HistogramEntry[], labels: MetricLabels): HistogramEntry | undefined {
    return entries.find((e) => this.labelsMatch(e.labels, labels));
  }

  private labelsMatch(a: MetricLabels, b: MetricLabels): boolean {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key, i) => key === keysB[i] && a[key] === b[key]);
  }
}
