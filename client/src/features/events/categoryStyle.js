const rules = [
  [/wildfire|fire/i, { color: '#fb923c', type: 'fire' }],
  [/storm|cyclone|hurricane|typhoon|tornado/i, { color: '#fb7185', type: 'storm' }],
  [/flood/i, { color: '#38bdf8', type: 'flood' }],
  [/volcano/i, { color: '#f87171', type: 'volcano' }],
  [/earthquake/i, { color: '#c4b5fd', type: 'earthquake' }],
  [/landslide/i, { color: '#fbbf24', type: 'landslide' }],
  [/sea and lake ice|sea.*ice|lake.*ice|iceberg/i, { color: '#67e8f9', type: 'iceberg' }],
  [/snow|ice/i, { color: '#93c5fd', type: 'snow' }],
  [/drought/i, { color: '#fbbf24', type: 'drought' }],
  [/temperature|extreme heat|extreme cold|heat wave|cold wave/i, { color: '#f97316', type: 'temperature' }],
  [/man.?made|human.?caused/i, { color: '#f59e0b', type: 'manmade' }]
];

export function getCategoryStyle(category) {
  const title = typeof category === 'string' ? category : category?.title ?? category?.id ?? '';
  const style = rules.find(([pattern]) => pattern.test(String(title)))?.[1]
    ?? { icon: '✦', color: '#a5b4fc', type: 'other' };
  return { ...style, iconUrl: `/category-icons/${style.type}.svg` };
}
