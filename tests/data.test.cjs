'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSnapshot } = require('../data.js');

const METRIC_IDS = ['water', 'shower', 'food', 'shelter', 'electricity', 'breaths', 'body', 'people', 'sunlight', 'music'];
const METRIC_ICONS = ['water', 'shower', 'food', 'bed', 'bolt', 'lungs', 'heart', 'people', 'sun', 'music'];
const METRIC_COLORS = ['blue', 'purple', 'green', 'blue', 'amber', 'green', 'pink', 'purple', 'amber', 'pink'];
const POSITIVE_COLOR = /^#[0-9a-f]{6}$/i;

test('snapshots have the complete positive dashboard shape', () => {
  const snapshot = createSnapshot('week');
  assert.equal(snapshot.period, 'week');
  assert.doesNotThrow(() => new Date(snapshot.timestamp).toISOString());
  assert.deepEqual(snapshot.metrics.map((metric) => metric.id), METRIC_IDS);
  assert.deepEqual(snapshot.metrics.map((metric) => metric.icon), METRIC_ICONS);
  assert.deepEqual(snapshot.metrics.map((metric) => metric.color), METRIC_COLORS);
  for (const metric of snapshot.metrics) {
    assert.equal(typeof metric.value, 'string');
    assert.ok(metric.value.length > 0);
    assert.ok(Number.isInteger(metric.change) && metric.change > 0);
    assert.equal(metric.points.length, 10);
    assert.ok(metric.points.every((point, index) => point > 0 && (index === 0 || point > metric.points[index - 1])));
  }
  assert.equal(snapshot.moments.labels.length, 7);
  assert.equal(snapshot.moments.values.length, 7);
  assert.ok(snapshot.moments.values.every((value, index) => value > 0 && (index === 0 || value > snapshot.moments.values[index - 1])));
  assert.ok(snapshot.moments.values.at(-1) > snapshot.moments.values[0]);
  assert.equal(snapshot.needs.length, 8);
  assert.ok(snapshot.needs.every((need) => Number.isInteger(need.value) && need.value >= 92 && need.value <= 100 && POSITIVE_COLOR.test(need.color)));
  assert.equal(snapshot.reasons.length, 8);
  assert.ok(snapshot.reasons.every((reason) => Number.isInteger(reason.value) && reason.value >= 75 && reason.value <= 99 && POSITIVE_COLOR.test(reason.color)));
  assert.equal(snapshot.wins.length, 7);
  assert.ok(snapshot.wins.every((win) => win.when === 'Today' && win.title && win.detail));
  assert.equal(snapshot.activity.length, 6);
  assert.ok(snapshot.activity.every((item) => Number.isInteger(item.minutesAgo) && item.minutesAgo >= 0 && ['essentials', 'connection', 'small-joys'].includes(item.category)));
  assert.ok(snapshot.activity.every((item, index) => index === 0 || item.minutesAgo > snapshot.activity[index - 1].minutesAgo));
  assert.ok(snapshot.quote.text && snapshot.quote.attribution);
});

test('all periods have meaningful labels and positive increasing moments', () => {
  const periods = ['today', 'week', 'month', 'all'];
  for (const period of periods) {
    const snapshot = createSnapshot(period);
    assert.equal(snapshot.period, period);
    assert.equal(snapshot.moments.labels.length, 7);
    assert.ok(snapshot.moments.labels.every((label) => typeof label === 'string' && label.length > 0));
    assert.ok(snapshot.moments.values.every((value, index) => value > 0 && (index === 0 || value > snapshot.moments.values[index - 1])));
    if (period === 'today') {
      assert.equal(snapshot.moments.labels.at(-1), 'Now');
      assert.ok(snapshot.moments.labels.slice(0, 6).every((label) => /^\d{1,2} (AM|PM)$/.test(label)));
      const expectedFirst = new Date(Date.parse(snapshot.timestamp) - 6 * 60 * 60 * 1000).toLocaleTimeString(undefined, { hour: 'numeric' });
      assert.equal(snapshot.moments.labels[0], expectedFirst);
    }
    if (period === 'all') assert.ok(snapshot.moments.labels.every((label) => /^[A-Z][a-z]{2}$/.test(label)));
    if (period === 'week' || period === 'month') assert.ok(snapshot.moments.labels.every((label) => /^[A-Z][a-z]{2} \d{1,2}$/.test(label)));
  }
});

test('metric formats stay in their intended positive ranges', () => {
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const { metrics } = createSnapshot('today');
    const byId = Object.fromEntries(metrics.map((metric) => [metric.id, metric.value]));
    for (const id of ['water', 'shower', 'shelter', 'electricity', 'body', 'music']) {
      assert.match(byId[id], /^(9[4-9]|100)%$/);
    }
    assert.ok(Number(byId.food) >= 2 && Number(byId.food) <= 5);
    assert.ok(Number(byId.breaths.replaceAll(',', '')) >= 18000 && Number(byId.breaths.replaceAll(',', '')) <= 26000);
    assert.match(byId.people, /^[4-8]\+$/);
    assert.match(byId.sunlight, /^(4\.[2-9]|[5-8]\.[0-9]|9\.[0-8]) hrs$/);
  }
});

test('each supplied prior snapshot gets a different formatted value for every metric', () => {
  let previous = createSnapshot('week');
  for (let iteration = 0; iteration < 500; iteration += 1) {
    const next = createSnapshot('week', previous);
    for (let index = 0; index < METRIC_IDS.length; index += 1) {
      assert.equal(next.metrics[index].id, previous.metrics[index].id);
      assert.notEqual(next.metrics[index].value, previous.metrics[index].value, `${METRIC_IDS[index]} repeated at iteration ${iteration}`);
    }
    assert.notEqual(next.quote.text, previous.quote.text);
    previous = next;
  }
});

test('generation remains bounded when random values are constant', () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    const previous = createSnapshot('week');
    const next = createSnapshot('week', previous);
    for (let index = 0; index < METRIC_IDS.length; index += 1) {
      assert.notEqual(next.metrics[index].value, previous.metrics[index].value);
    }
    assert.ok(next.metrics.every((metric) => metric.points.length === 10));
  } finally {
    Math.random = originalRandom;
  }
});

