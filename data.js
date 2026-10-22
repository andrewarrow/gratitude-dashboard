(function exposeGratitudeData(root) {
  'use strict';

  const PERIODS = new Set(['today', 'week', 'month', 'all']);
  const METRIC_DEFINITIONS = [
    { id: 'water', label: 'Clean Drinking Water', icon: 'water', color: 'blue', kind: 'percent', detail: 'Available' },
    { id: 'shower', label: 'Warm Shower Access', icon: 'shower', color: 'purple', kind: 'percent', detail: 'A little everyday comfort' },
    { id: 'food', label: 'Good Food', icon: 'food', color: 'green', kind: 'meals', detail: 'Nourishing meals today' },
    { id: 'shelter', label: 'Safe Place to Sleep', icon: 'bed', color: 'blue', kind: 'percent', detail: 'Safe and comfortable' },
    { id: 'electricity', label: 'Electricity On Demand', icon: 'bolt', color: 'amber', kind: 'percent', detail: 'Light and power, ready' },
    { id: 'breaths', label: 'Fresh Air Taken In', icon: 'lungs', color: 'green', kind: 'breaths', detail: 'Breaths today' },
    { id: 'body', label: 'Body Still Working', icon: 'heart', color: 'pink', kind: 'percent', detail: 'A lot working for you' },
    { id: 'people', label: 'People Who Care', icon: 'people', color: 'purple', kind: 'people', detail: "You're not alone" },
    { id: 'sunlight', label: 'Sunlight Today', icon: 'sun', color: 'amber', kind: 'sunlight', detail: 'A little natural light' },
    { id: 'music', label: 'Music Available Instantly', icon: 'music', color: 'pink', kind: 'percent', detail: 'Always a song away' }
  ];

  const NEEDS = [
    { label: 'Clean water', color: '#65a8f5' },
    { label: 'Food', color: '#63bea0' },
    { label: 'Shelter', color: '#f3c34f' },
    { label: 'Warmth', color: '#ef927a' },
    { label: 'Healthcare', color: '#b879dc' },
    { label: 'Connection', color: '#ec83ad' },
    { label: 'Knowledge', color: '#9a83eb' },
    { label: 'Mobility', color: '#70b2f3' }
  ];

  const REASONS = [
    { label: 'Good people in my life', color: '#70b2f3' },
    { label: "Possibilities I haven't seen yet", color: '#63bea0' },
    { label: 'Small joys ahead', color: '#f3c34f' },
    { label: 'Things I still want to do', color: '#ef927a' },
    { label: 'People who would miss me', color: '#ec83ad' },
    { label: 'Positive change is possible', color: '#9a83eb' },
    { label: "I'm proud of how far I've come", color: '#b59aeb' },
    { label: 'Because the world is better with me in it', color: '#70a1ed' }
  ];

  const WINS = [
    { title: 'Woke up today', detail: 'Another day to experience life' },
    { title: 'Refilled a water bottle', detail: 'Clean, safe drinking water' },
    { title: 'Ate something nourishing', detail: 'Fuel for a functioning human' },
    { title: 'Had shelter overnight', detail: 'Safe and comfortable' },
    { title: 'Solved a small problem', detail: 'Handled it one step at a time' },
    { title: 'Had a moment of joy', detail: 'Noticed something beautiful' },
    { title: 'Kept going', detail: "That's enough for today" },
    { title: 'Sent a kind message', detail: 'A little care went both ways' },
    { title: 'Stepped outside', detail: 'Fresh air and a change of scene' }
  ];

  const ACTIVITIES = [
    { title: 'Refilled water bottle', detail: 'Hydration level: looking good', category: 'essentials', icon: 'water', color: 'blue' },
    { title: 'Ate something nourishing', detail: 'Food = energy = good things', category: 'essentials', icon: 'food', color: 'amber' },
    { title: 'Spent time in sunlight', detail: 'Vitamin D and a brighter mood', category: 'small-joys', icon: 'sun', color: 'amber' },
    { title: 'Had shelter overnight', detail: 'A safe place to rest', category: 'essentials', icon: 'bed', color: 'blue' },
    { title: 'Breathing remained automatic', detail: 'Breaths in and counting', category: 'essentials', icon: 'heart', color: 'pink' },
    { title: 'Received a text from a friend', detail: 'Someone cares about you', category: 'connection', icon: 'people', color: 'purple' },
    { title: 'Listened to a favorite song', detail: 'A small joy, right on cue', category: 'small-joys', icon: 'music', color: 'pink' },
    { title: 'Enjoyed a warm shower', detail: 'A quiet moment to reset', category: 'essentials', icon: 'shower', color: 'purple' }
  ];

  const QUOTES = [
    { text: 'A lot is going right.', attribution: 'A moment to notice' },
    { text: 'Same life. More gratitude.', attribution: 'A gentle reminder' },
    { text: 'There is good here, too.', attribution: 'A moment to notice' },
    { text: 'Small things count. They always did.', attribution: 'A gentle reminder' },
    { text: 'You made it to this moment.', attribution: 'A moment to notice' },
    { text: 'Good things can be ordinary.', attribution: 'A gentle reminder' }
  ];

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function sample(items) {
    return items[randomInt(0, items.length - 1)];
  }

  function shuffled(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function dateLabel(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function shiftDays(date, days) {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + days);
    return shifted;
  }

  function getMomentLabels(period, now) {
    if (period === 'today') {
      return Array.from({ length: 7 }, (_, index) => {
        if (index === 6) return 'Now';
        const date = new Date(now.getTime() - (6 - index) * 60 * 60 * 1000);
        return date.toLocaleTimeString(undefined, { hour: 'numeric' });
      });
    }
    if (period === 'all') {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1);
        return date.toLocaleDateString(undefined, { month: 'short' });
      });
    }

    const startDaysAgo = period === 'month' ? 30 : 6;
    return Array.from({ length: 7 }, (_, index) =>
      dateLabel(shiftDays(now, -startDaysAgo + Math.round((startDaysAgo * index) / 6)))
    );
  }

  function metricRawValue(kind) {
    switch (kind) {
      case 'percent': return randomInt(94, 100);
      case 'meals': return randomInt(2, 5);
      case 'breaths': return randomInt(18000, 26000);
      case 'people': return randomInt(4, 8);
      case 'sunlight': return randomInt(42, 98);
      default: return 1;
    }
  }

  function formatMetric(kind, raw) {
    switch (kind) {
      case 'percent': return `${raw}%`;
      case 'meals': return String(raw);
      case 'breaths': return raw.toLocaleString('en-US');
      case 'people': return `${raw}+`;
      case 'sunlight': return `${(raw / 10).toFixed(1)} hrs`;
      default: return String(raw);
    }
  }

  function nextDifferentRaw(kind, raw) {
    if (kind === 'percent') return raw >= 100 ? 94 : raw + 1;
    if (kind === 'meals') return raw >= 5 ? 2 : raw + 1;
    if (kind === 'breaths') return raw >= 26000 ? 18000 : raw + 1;
    if (kind === 'people') return raw >= 8 ? 4 : raw + 1;
    if (kind === 'sunlight') return raw >= 98 ? 42 : raw + 1;
    return raw + 1;
  }

  function previousMetricValue(previous, id) {
    if (!previous || !Array.isArray(previous.metrics)) return undefined;
    const metric = previous.metrics.find((item) => item && item.id === id);
    return metric && metric.value;
  }

  function makePoints() {
    let value = randomInt(4, 12);
    const points = [value];
    for (let i = 1; i < 10; i += 1) {
      value += randomInt(1, 5);
      points.push(value);
    }
    return points;
  }

  function makeMoments(period) {
    const baseline = period === 'today' ? 4 : period === 'week' ? 9 : period === 'month' ? 15 : 22;
    const values = [randomInt(baseline, baseline + 8)];
    for (let i = 1; i < 7; i += 1) values.push(values[i - 1] + randomInt(2, 7));
    return values;
  }

  function makeActivityTimes() {
    const times = [];
    let minutesAgo = randomInt(3, 18);
    for (let index = 0; index < 6; index += 1) {
      times.push(minutesAgo);
      minutesAgo += randomInt(7, 82);
    }
    return times;
  }

  function previousQuoteText(previous) {
    return previous && previous.quote && previous.quote.text;
  }

  function makeNeeds() {
    return NEEDS.map((need) => ({ label: need.label, value: randomInt(92, 100), color: need.color }));
  }

  function makeReasons() {
    return REASONS.map((reason) => ({ label: reason.label, value: randomInt(75, 99), color: reason.color }));
  }

  function createSnapshot(period, previous) {
    const selectedPeriod = PERIODS.has(period) ? period : 'week';
    const now = new Date();
    const metrics = METRIC_DEFINITIONS.map((definition) => {
      let raw = metricRawValue(definition.kind);
      let value = formatMetric(definition.kind, raw);
      if (value === previousMetricValue(previous, definition.id)) {
        raw = nextDifferentRaw(definition.kind, raw);
        value = formatMetric(definition.kind, raw);
      }
      return {
        id: definition.id,
        label: definition.label,
        value,
        detail: definition.detail,
        change: randomInt(1, 8),
        color: definition.color,
        icon: definition.icon,
        points: makePoints()
      };
    });

    const wins = shuffled(WINS).slice(0, 7).map((win, index) => ({
      id: `win-${index + 1}`,
      title: win.title,
      detail: win.detail,
      when: 'Today'
    }));

    const activityTimes = makeActivityTimes();
    const activity = shuffled(ACTIVITIES).slice(0, 6).map((item, index) => ({
      id: `activity-${index + 1}`,
      title: item.title,
      detail: item.detail,
      minutesAgo: activityTimes[index],
      category: item.category,
      icon: item.icon,
      color: item.color
    }));

    let quote = sample(QUOTES);
    if (quote.text === previousQuoteText(previous)) {
      const previousIndex = QUOTES.findIndex((item) => item.text === quote.text);
      quote = QUOTES[(previousIndex + 1) % QUOTES.length];
    }

    return {
      period: selectedPeriod,
      timestamp: now.toISOString(),
      metrics,
      moments: {
        labels: getMomentLabels(selectedPeriod, now),
        values: makeMoments(selectedPeriod)
      },
      needs: makeNeeds(),
      reasons: makeReasons(),
      wins,
      activity,
      quote: { ...quote }
    };
  }

  const api = { createSnapshot };
  root.GratitudeData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
